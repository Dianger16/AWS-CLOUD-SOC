'''routers/alert_routes.py — Endpoints for security alerts and log analysis.'''

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional

from app.database import get_db
from app.models.alert_model import Alert 
from app.services.log_analyzer import analyze_logs
from app.security.auth import get_current_user, TokenData
from app.utils.logger import get_logger
from app.utils.helpers import utcnow

router = APIRouter(tags=["Alerts & Logs"])
logger = get_logger(__name__)


@router.get("/alerts", summary="Return security alerts")
async def get_alerts(
    severity: Optional[str] = Query(None, example="Critical"),
    source: Optional[str] = Query(None, example="misconfiguration"),
    resolved: bool = Query(False),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    query = db.query(Alert).filter(Alert.is_resolved == resolved)

    if severity:
        query = query.filter(Alert.severity == severity)
    if source:
        query = query.filter(Alert.source == source)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return {
        "total": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "title": a.title,
                "severity": a.severity,
                "source": a.source,
                "resource_id": a.resource_id,
                "remediation_advice": a.remediation_advice,
                "is_acknowledged": a.is_acknowledged,
                "is_resolved": a.is_resolved,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
    }

@router.patch("/alerts/{alert_id}/acknowledge", summary="Acknowledge an alert")
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert: 
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.is_acknowledged = True
    alert.acknowledged_at = utcnow()
    db.commit()
    logger.info(f"Alert {alert_id} acknowledged by {current_user.username}.")
    return {"message": "Alert acknowledged.", "alert_id": alert_id}

@router.patch("/alerts/{alert_id}/resolve", summary="Resolve an alert")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert: 
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.is_resolved = True
    alert.resolved_at = utcnow()
    db.commit()
    logger.info(f"Alert {alert_id} resolved by {current_user.username}.")
    return {"message": "Alert resolved.", "alert_id": alert_id}


class LogAnalysisRequest(BaseModel):
    cloudtrail_events: Optional[List[Dict[str, Any]]] = []
    vpc_flow_records: Optional[List[Dict[str, Any]]] = []
    persist_alerts: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "cloudtrail_events": [
                    {
                        "eventTime": "2024-01-15T03:22:00Z",
                        "eventName": "DescribeInstances",
                        "userIdentity": {"arn": "arn:aws:iam::123456:user/bob"},
                        "awsRegion": "ap-southeast-1",
                        "sourceIPAddress": "185.220.101.55",
                    }
                ],
                "vpc_flow_records": [],
                "persist_alerts": True,
            }
        }

@router.post("/analyze-logs", summary="Run anomaly detection on cloud logs")
async def analyze_cloud_logs(
    request: LogAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    if not request.cloudtrail_events and not request.vpc_flow_records:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Provide at least one of: cloudtrail_events, vpc_flow_records.",
        )

    try: 
        results = analyze_logs(
            cloudtrail_events=request.cloudtrail_events,
            vpc_flow_records=request.vpc_flow_records,
        )

        alerts_created = 0
        if request.persist_alerts:
            all_anomalies = (
                results.get("cloudtrail_anomalies", [])
                + results.get("vpc_anomalies", [])
            )
            # Assuming logic here to save alerts to DB if needed
            # For now just using the list length as placeholder
            new_alerts = []
            alerts_created = len(new_alerts)

        return {
            "status": "complete",
            "total_events_analyzed": results["total_events_analyzed"],
            "total_anomalies_found": results["total_anomalies_found"],
            "alerts_created": alerts_created,
            "cloudtrail_anomalies": results.get("cloudtrail_anomalies", []),
            "vpc_anomalies": results.get("vpc_anomalies", []),
        }
    except Exception as e:
        logger.error(f"Log analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class AdvisorRequest(BaseModel):
    rule_id: Optional[str] = None
    issue_description: Optional[str] = None
    resource_type: str = "AWS Resource"
    severity: str = "Medium"

@router.post("/advisor", summary="Get AI security recommendation")
async def get_ai_recommendation(
    request: AdvisorRequest,
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get a security recommendation for a specific rule ID or free-form issue description.
 
    If OPENAI_API_KEY is configured, returns an LLM-generated recommendation.
    Otherwise returns a rule-based recommendation from the internal database.
    """
    from app.services.ai_advisor import get_recommendation, get_llm_recommendation
 
    if request.rule_id:
        rec = get_recommendation(request.rule_id)
        return {"source": "rule_based", **rec}
 
    if request.issue_description:
        advice = await get_llm_recommendation(
            issue_description=request.issue_description,
            resource_type=request.resource_type,
            severity=request.severity,
        )
        return {
            "source": "llm",
            "recommendation": advice,
            "severity": request.severity,
        }
 
    raise HTTPException(
        status_code=422,
        detail="Provide either rule_id or issue_description.",
    )