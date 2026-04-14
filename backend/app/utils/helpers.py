from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import hashlib
import json


def utcnow() -> datetime:
    """Return current UTC datetime (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


def severity_to_score(severity: str) -> float:
    """
    Convert a severity label to a numeric risk score for sorting/comparison.

    Args:
        severity: One of Critical, High, Medium, Low, Info.

    Returns:
        Float between 0.0 and 1.0.
    """
    mapping = {
        "critical": 1.0,
        "high": 0.75,
        "medium": 0.5,
        "low": 0.25,
        "info": 0.1,
    }
    return mapping.get(severity.lower(), 0.0)


def score_to_severity(score: float) -> str:
    """
    Convert a numeric risk score to a severity label.

    Args:
        score: Float between 0.0 and 1.0.

    Returns:
        Severity string label.
    """
    if score >= 0.85:
        return "Critical"
    elif score >= 0.65:
        return "High"
    elif score >= 0.40:
        return "Medium"
    elif score >= 0.15:
        return "Low"
    return "Info"


def generate_resource_id(resource_type: str, identifier: str) -> str:
    raw = f"{resource_type}::{identifier}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def flatten_tags(tags: Optional[List[Dict[str, str]]]) -> Dict[str, str]:
    if not tags:
        return {}
    return {t.get("Key", ""): t.get("Value", "") for t in tags}


def safe_json(obj: Any) -> str:
    
    def default(o):
        if isinstance(o, datetime):
            return o.isoformat()
        return str(o)
    return json.dumps(obj, default=default)