import json
from typing import Any, Dict, List, Optional
from datetime import datetime
from app.services.anomaly_detection import detect_anomalies
from app.utils.logger import get_logger

logger = get_logger(__name__)




def parse_cloudtrail_event(raw_event: Dict[str, Any]) -> Dict[str,Any]:
    event_time_str = raw_event.get("eventTime","")
    hour_of_day = 12
    if event_time_str:
        try:
            dt = datetime.fromisoformat(event_time_str.replace("Z", "+00:00"))
            hour_of_day = dt.hour
        except ValueError:
            pass

    return {
        "event_type": raw_event.get("eventName", ""),
        "event_name": raw_event.get("userIdentity", {}).get("arn", "unknown"),
        "user_identity": raw_event.get("userIdentity", {}).get("arn", "unknown"),
        "source_ip": raw_event.get("sourceIPAddress", ""),
        "region": raw_event.get("awsRegion", ""),
        "error_code": raw_event.get("errorCode", ""),
        "hour_of_day": hour_of_day,
        "api_call_count": 1,
        "failed_logins": 1 if raw_event.get("errorCode") in ["AuthFailure", "InvalidClientTokenId"] else 0,
        "is_new_region": False,
        "bytes_transferred": 0,
        "unique_resources": 1,
    }

def parse_vpcflow_log(raw_event: Dict[str, Any]) -> Dict[str, Any]:
    action = raw_event.get("action", "ACCEPT")
    bytes_transferred = float(raw_event.get("bytes", 0))

    return {
        "event_type": "vpc_flow",
        "src_addr": raw_event.get("srcAddr", ""),
        "dst_addr": raw_event.get("dstAddr", ""),
        "dst_port": int(raw_event.get("dstPort", 0)),
        "action": action,
        "bytes_transferred": bytes_transferred,
        "api_call_count": 0,
        "failed_logins": 0,
        "hour_of_day": 12,
        "is_new_region": False,
        "unique_resources": 1,
    }

def aggregate_cloudtrail_by_user(events: List[Dict]) -> List[Dict]:
    from collections import defaultdict

    user_stats: Dict[str, Dict] = defaultdict(lambda: {
        "api_call_count": 0,
        "failed_logins": 0,
        "regions": set(),
        "hours": [],
        "bytes_transferred": 0,
        "unique_resources": set(),
    })

    for ev in events:
        uid = ev.get("user_identity", "unknown")
        stats = user_stats[uid]
        stats["api_call_count"] += 1
        stats["failed_logins"] += ev.get("failed_logins",0)
        stats["regions"].add(ev.get("region", ""))
        stats["hours"].append(ev.get("hour_of_day", 12))
        stats["bytes_transferred"] += ev.get("bytes_transferred",0)
        stats["unique_resources"].add(ev.get("event_name",""))

    aggregated = []
    for uid, stats in user_stats.items():
        hours = stats["hours"]
        avg_hour = sum(hours)/ len(hours) if hours else 12
        aggregated.append({
            "user_identity": uid,
            "api_call_count" :stats["api_call_count"],
            "failed_logins": stats["failed_logins"],
            "hour_of_day": avg_hour,
            "bytes_transferred": stats["bytes_transferred"],
            "unique_resources": len(stats["unique_resources"]),
        })

    return aggregated

def analyze_logs(
    cloudtrail_events: Optional[List[Dict]] = None,
    vpc_flow_records: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Main entry point for log analysis.
    """
    results: Dict[str, Any] = {
        "cloudtrail_anomalies": [],
        "vpc_anomalies": [],
        "total_events_analyzed": 0,
        "total_anomalies_found": 0,
    }

    if cloudtrail_events:
        parsed = [parse_cloudtrail_event(e) for e in cloudtrail_events]
        aggregated = aggregate_cloudtrail_by_user(parsed)
        detected = detect_anomalies(aggregated)
        anomalies = [e for e in detected if e.get("anomaly") or e.get("anamoly")]
        results["cloudtrail_anomalies"] = anomalies
        results["total_events_analyzed"] += len(parsed)
        results["total_anomalies_found"] += len(anomalies)
        logger.info(f"CloudTrail: {len(anomalies)} anomalies in {len(parsed)} events.")

    if vpc_flow_records:
        parsed_vpc = [parse_vpcflow_log(r) for r in vpc_flow_records]
        detected_vpc = detect_anomalies(parsed_vpc)
        anomalies_vpc = [e for e in detected_vpc if e.get("anomaly") or e.get("anamoly")]
        results["vpc_anomalies"] = anomalies_vpc
        results["total_events_analyzed"] += len(parsed_vpc)
        results["total_anomalies_found"] += len(anomalies_vpc)
        logger.info(f"VPC Flow: {len(anomalies_vpc)} anomalies in {len(parsed_vpc)} records.")

    return results




