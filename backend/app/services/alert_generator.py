from datetime import datetime, timezone
from typing import Any,Dict,List
from sqlalchemy.orm import Session
from app.models.alert_model import Alert
from app.services.ai_advisor import get_recommendation
from app.utils.logger import get_logger
from app.utils.helpers import utcnow

logger = get_logger(__name__)

def create_alerts_from_vulnerabilities(
    vulnerabilities: List[Dict],
    db: Session,
) -> List[Alert]:
    created_alerts = []

    for vuln in vulnerabilities:
        asset_id = vuln.get("asset_id","unknown")
        rule_id = vuln.get("rule_id","UNKNOWN")
        severity = vuln.get("severity", "Medium")

        existing = (
            db.query(Alert)
            .filter(
              Alert.resource_id == asset_id,
              Alert.source == "misconfiguration",
              Alert.is_resolved == False,
              Alert.title.contains(rule_id),
            )
            .first()
        )
        if existing:
            logger.debug(f"Skipping duplicate alert for {asset_id} rule {rule_id}.")
            continue

        rec = get_recommendation(rule_id)

        alert = Alert(
            title=f"[{rule_id}] {vuln.get('issue', 'Security issue detected')}",
            description=vuln.get("issue", ""),
            severity=severity,
            source="misconfiguration",
            resource_id=asset_id,
            resource_type=vuln.get("resource_type", ""),
            created_at=utcnow(),
        )
        db.add(alert)
        created_alerts.append(alert)

    if created_alerts:
        db.commit()
        logger.info(f"Created {len(created_alerts)} new misconfiguration alerts.")

    return created_alerts

def created_alerts_from_anomalies(
    anomalies: List[Dict],
    db: Session,

) -> List[Alert]:
    created_alerts = []

    for anamoly in anomalies:
        if not anamoly.get("anamoly"):
            continue

        reason = anamoly.get("anamoly_reason","statistical outlier")
        user = anamoly.get("user_identify","unknown")
        event_type = anamoly.get("event_type","log")

        alert = Alert(
            title = f"Anamalous {event_type} activity detected for {user}",
            description=f"Anamoly detected: {reason}. User: {user}.",
            severity=_anamoly_severity(anamoly),
            source="anomaly_detection",
            resource_id=user,
            resource_type="event_type",
            remediation_advice=(
                "Investigate the activity in Cloudtrail."
                "If unauthorized, rotate credentials immediately and review IAM permissions."
                "Consider enabling AWS GuardDuty for ongoing threat detection."

            ),
            created_at=utcnow(),
        )
        db.add(alert)
        created_alerts.append(alert)

    if created_alerts:
        db.commit()
        logger.info(f"Created {len(created_alerts)} new anomaly alerts.")

    return created_alerts

def _anamoly_severity(anamoly: Dict) -> str:
    if anamoly.get("failed_logins",0) > 10:
        return "Critical"
    if anamoly.get("is_new_region"):
        return "High"
    if anamoly.get("is_new_region"):
        return "High"
    if anamoly.get("api_call_count",0) > 1000:
        return "High"
    return "Medium"







