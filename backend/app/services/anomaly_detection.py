import numpy as np
from typing import Any, Dict, List, Optional
from sklearn.ensemble import IsolationForest
from app.utils.logger import get_logger

logger = get_logger(__name__)
CONTAMINATION = 0.05

def extract_features(log_event: Dict[str,Any]) -> List[float]:
    return [
        float(log_event.get("api_call_count",0)),
        float(log_event.get("failed_logins",0)),
        float(log_event.get("hour_of_day",12)),
        float(1.0 if log_event.get("is_new_region") else 0.0),
        float(log_event.get("bytes_transferred",0)),
        float(log_event.get("unique_resources",0)),
    ]

def detect_anomalies(log_events: List[Dict[str,Any]]) -> List[Dict[str,Any]]:
    if not log_events:
        logger.warning("No log events provided for anomaly detection.")
        return []
        
    if len(log_events) < 10:
        logger.warning("Too few log events for reliable anomaly detection (need > 10).")
        return [
            {**e, "anomaly": False, "anomaly_score": 0.0, "anomaly_reason": "insufficient_data"}
            for e in log_events
        ]
        
    X = np.array([extract_features(e) for e in log_events])

    model = IsolationForest(
        contamination=CONTAMINATION,
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
    )

    predictions = model.fit_predict(X)
    scores = model.decision_function(X)

    results = []
    for i, event in enumerate(log_events):
        is_anomaly = predictions[i] == -1
        enriched = {
            **event,
            "anomaly": is_anomaly,
            "anomaly_score": round(float(scores[i]), 4),
            "anomaly_reason": _explain_anomaly(event, X[i]) if is_anomaly else "normal",
        }
        results.append(enriched)

    anomaly_count = sum(1 for r in results if r["anomaly"])
    logger.info(f"Anomaly detection complete: {anomaly_count}/{len(log_events)} anomalies found.")
    return results

def _explain_anomaly(event: Dict[str, Any], features: np.ndarray) -> str:
    reasons = []

    # Indices based on extract_features mapping:
    # 0: api_call_count, 1: failed_logins, 2: hour_of_day, 3: is_new_region, 4: bytes_transferred
    api_calls = features[0]
    failed_logins = features[1]
    hour = features[2]
    new_region = features[3]
    bytes_tx = features[4]

    if api_calls > 500:
        reasons.append(f"unusually high API call volume ({int(api_calls)} calls)")
    if failed_logins > 5:
        reasons.append(f"multiple failed login attempts ({int(failed_logins)})")
    if new_region:
        reasons.append("access from a previously unseen AWS region")
    if hour < 6 or hour > 22:
        reasons.append(f"access at an unusual hour ({int(hour)}:00 UTC)")
    if bytes_tx > 1_000_000_000:
        reasons.append(f"high data transfer {bytes_tx/1e9:.1f} GB")

    return "; ".join(reasons) if reasons else "statistical outlier in feature space"