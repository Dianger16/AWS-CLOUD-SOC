"""
routers/scan_routes.py — Endpoints for triggering and retrieving scan results.

SECURITY DESIGN — per-request AWS credentials:
  - User provides AWS credentials in the POST body each time they scan
  - Credentials are NEVER stored in the database, logs, or any file
  - They exist only in memory during the request lifecycle
  - Backend validates them via STS before running any scan
  - All credential fields are masked in logs
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from typing import Any, Dict, Optional

from app.database import get_db
from app.security.auth import get_current_user, TokenData
from app.utils.logger import get_logger
from app.services import misconfig, risk_model
from app.services.alert_generator import create_alerts_from_vulnerabilities
from app.models.vulnerability_model import Vulnerability

router = APIRouter(prefix="/scan", tags=["Scanning"])
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class AWSCredentials(BaseModel):
    """
    AWS credentials provided by the user per scan request.
    Never persisted — used only during the request lifecycle.
    """
    access_key_id: str = Field(..., min_length=16, max_length=128)
    secret_access_key: str = Field(..., min_length=1, max_length=512)
    region: str = Field(default="us-east-1", max_length=32)
    session_token: Optional[str] = Field(default=None)

    @field_validator("access_key_id")
    @classmethod
    def validate_access_key(cls, v: str) -> str:
        v = v.strip()
        valid_prefixes = ("AKIA", "ASIA", "AIDA", "AROA", "ANPA", "ANVA", "APKA")
        if not v.startswith(valid_prefixes):
            raise ValueError(
                f"Invalid AWS Access Key ID. Must start with one of: {', '.join(valid_prefixes)}"
            )
        return v

    @field_validator("region")
    @classmethod
    def validate_region(cls, v: str) -> str:
        import re
        v = v.strip().lower()
        if not re.match(r'^[a-z]{2,}-[a-z]+-\d$', v):
            raise ValueError(
                f"Invalid AWS region format: '{v}'. "
                "Examples: us-east-1, ap-south-1, eu-west-2"
            )
        return v


class ScanRequest(BaseModel):
    """Full scan request — credentials + optional scan config."""
    credentials: AWSCredentials
    scan_ec2: bool = True
    scan_s3: bool = True
    scan_iam: bool = True
    scan_security_groups: bool = True
    persist_results: bool = True


class VerifyRequest(BaseModel):
    """Lightweight credential verification request."""
    credentials: AWSCredentials


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/verify-aws", summary="Verify user-provided AWS credentials")
async def verify_aws_credentials(
    request: VerifyRequest,
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Verify AWS credentials via STS GetCallerIdentity.
    Returns account ID and IAM identity. Credentials are never stored.
    """
    from app.services.aws_scanner import validate_aws_credentials_explicit
    try:
        logger.info(f"Credential verification by '{current_user.username}' "
                    f"key='{request.credentials.access_key_id[:8]}...'")
        identity = validate_aws_credentials_explicit(
            access_key_id=request.credentials.access_key_id,
            secret_access_key=request.credentials.secret_access_key,
            region=request.credentials.region,
            session_token=request.credentials.session_token,
        )
        return {"status": "valid", "message": "AWS credentials are valid.", **identity}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Credential verification failed. Check your keys and region."
        )


@router.post("/aws", summary="Run AWS infrastructure scan with user-provided credentials")
async def scan_aws(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Trigger a full AWS infrastructure scan using credentials in the request body.

    Credentials are used only for this request and never stored anywhere.
    """
    from app.services.aws_scanner import run_full_scan_with_credentials
    try:
        logger.info(
            f"Scan by '{current_user.username}' | "
            f"region='{request.credentials.region}' | "
            f"key='{request.credentials.access_key_id[:8]}...'"
        )

        scan_results = run_full_scan_with_credentials(
            access_key_id=request.credentials.access_key_id,
            secret_access_key=request.credentials.secret_access_key,
            region=request.credentials.region,
            session_token=request.credentials.session_token,
            scan_ec2=request.scan_ec2,
            scan_s3=request.scan_s3,
            scan_iam=request.scan_iam,
            scan_security_groups=request.scan_security_groups,
        )

        vulnerabilities = misconfig.detect_all(scan_results)
        risk_scores = risk_model.score_all_resources(scan_results)

        if request.persist_results:
            for vuln in vulnerabilities:
                existing = db.query(Vulnerability).filter(
                    Vulnerability.asset_id == vuln.get("asset_id"),
                    Vulnerability.rule_id == vuln.get("rule_id"),
                    Vulnerability.status == "open",
                ).first()
                if not existing:
                    db_vuln = Vulnerability(**{
                        k: v for k, v in vuln.items()
                        if k in Vulnerability.__table__.columns.keys()
                    })
                    db.add(db_vuln)
            db.commit()
            background_tasks.add_task(create_alerts_from_vulnerabilities, vulnerabilities, db)

        return {
            "status": "complete",
            "scanned_by": current_user.username,
            "aws_account_id": scan_results.get("account_id"),
            "aws_identity": scan_results.get("scanned_by_arn"),
            "region": scan_results.get("region"),
            "summary": {
                "ec2_instances": len(scan_results.get("ec2_instances", [])),
                "s3_buckets": len(scan_results.get("s3_buckets", [])),
                "iam_users": len(scan_results.get("iam_users", [])),
                "iam_roles": len(scan_results.get("iam_roles", [])),
                "security_groups": len(scan_results.get("security_groups", [])),
            },
            "vulnerabilities_found": len(vulnerabilities),
            "resources_scored": len(risk_scores),
            "risk_scores_sample": risk_scores[:10],
        }

    except ValueError as e:
        logger.warning(f"Scan credential error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Scan failed: {type(e).__name__}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scan failed. Ensure the IAM user has required read permissions.",
        )


@router.get("/vulnerabilities", summary="Return all detected vulnerabilities")
async def get_vulnerabilities(
    severity: str = None,
    status_filter: str = "open",
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    query = db.query(Vulnerability)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    if status_filter:
        query = query.filter(Vulnerability.status == status_filter)
    vulns = query.order_by(Vulnerability.risk_score.desc()).limit(limit).all()
    return {
        "total": len(vulns),
        "vulnerabilities": [
            {
                "id": v.id,
                "asset_id": v.asset_id,
                "resource_type": v.resource_type,
                "issue": v.issue,
                "severity": v.severity,
                "rule_id": v.rule_id,
                "remediation": v.remediation,
                "risk_score": v.risk_score,
                "status": v.status,
                "detected_at": v.detected_at.isoformat() if v.detected_at else None,
            }
            for v in vulns
        ],
    }
