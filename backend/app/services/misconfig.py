"""
Evaluates scanned AWS resources against a rule set and returns a list of
Vulnerability records with severity levels.
"""

from typing import Any, Dict, List
from app.utils.logger import get_logger
from app.utils.helpers import severity_to_score

logger = get_logger(__name__)

# severity constants
CRITICAL = "Critical"
HIGH = "High"
MEDIUM = "Medium"
LOW = "Low"
INFO = "Info"

def detect_all(scan_results: Dict[str, Any]) -> List[Dict]:
    """Runs all detection rules across the scan results."""
    findings: List[Dict] = []

    findings.extend(_check_s3_buckets(scan_results.get("s3_buckets", [])))
    findings.extend(_check_security_groups(scan_results.get("security_groups", [])))
    findings.extend(_check_iam_users(scan_results.get("iam_users", [])))
    findings.extend(_check_iam_roles(scan_results.get("iam_roles", [])))
    findings.extend(_check_ec2_instances(scan_results.get("ec2_instances", [])))

    logger.info(f"Misconfiguration detection complete. {len(findings)} findings.")
    return findings

def _finding(asset_id: str, resource_type: str, issue: str, severity: str, rule_id: str, remediation: str) -> Dict:
    """Helper to create a finding record."""
    return {
        "asset_id": asset_id,
        "resource_type": resource_type,
        "issue": issue,
        "severity": severity,
        "rule_id": rule_id,
        "remediation": remediation,
        "score": severity_to_score(severity)
    }

def _check_s3_buckets(buckets: List[Dict]) -> List[Dict]:
    findings: List[Dict] = []
    for bucket in buckets:
        name = bucket.get("name", "unknown")

        # S3_001 — Public access enabled
        if bucket.get("is_public"):
            findings.append(_finding(
                asset_id=name,
                resource_type="S3 Bucket",
                issue="Public access is enabled on this S3 bucket.",
                severity=CRITICAL,
                rule_id="S3_001",
                remediation=(
                    "Enable S3 Block Public Access at the account level or on the bucket. "
                    "Review and restrict bucket ACLs and bucket policies. "
                    "Ensure no objects have public-read or public-write ACLs."
                ),
            ))

        # S3_002 — No encryption
        if not bucket.get("encryption_enabled"):
            findings.append(_finding(
                asset_id=name,
                resource_type="S3 Bucket",
                issue="Server-side encryption is not enabled.",
                severity=HIGH,
                rule_id="S3_002",
                remediation=(
                    "Enable default server-side encryption using SSE-S3 or SSE-KMS. "
                    "Use a customer-managed KMS key for sensitive data."
                ),
            ))

        # S3_003 — No access logging
        if not bucket.get("logging_enabled"):
            findings.append(_finding(
                asset_id=name,
                resource_type="S3 Bucket",
                issue="Access logging is not enabled.",
                severity=MEDIUM,
                rule_id="S3_003",
                remediation=(
                    "Enable S3 server access logging. "
                    "Deliver logs to a separate, dedicated logging bucket."
                ),
            ))

    return findings

# Security Group Rules

SENSITIVE_PORTS = {22: "SSH", 3389: "RDP", 5432: "PostgreSQL", 3306: "MySQL", 6379: "Redis"}

def _check_security_groups(groups: List[Dict]) -> List[Dict]:
    findings = []
    for sg in groups:
        gid = sg.get("group_id", "unknown")

        if sg.get("open_to_world"):
            exposed_ports = _get_exposed_ports(sg.get("inbound_rules", []))
            severity = CRITICAL if exposed_ports else HIGH
            port_detail = (
                f" Exposed sensitive ports: {', '.join(exposed_ports)}." if exposed_ports else 
                ""
            )
            findings.append(_finding(
                asset_id=gid,
                resource_type="Security Group",
                issue=f"Inbound rules allow unrestricted access from 0.0.0.0/0.{port_detail}",
                severity=severity,
                rule_id="SG_001",
                remediation=(
                    "Replace 0.0.0.0/0 with specific IP ranges or security group references. "
                    "Use a bastion host or VPN for SSH/RDP access. "
                    "Apply the principle of least privilege to all inbound rules."
                ),
            ))
    return findings

def _get_exposed_ports(rules: List[Dict]) -> List[str]:
    exposed = []
    for rule in rules:
        is_world_open = any(
            r.get("CidrIp") == "0.0.0.0/0" for r in rule.get("IpRanges", [])
        ) or any(
            r.get("CidrIpv6") == "::/0" for r in rule.get("Ipv6Ranges", [])
        )
        
        if not is_world_open:
            continue
            
        from_port = rule.get("FromPort", 0)
        to_port = rule.get("ToPort", 65535)
        for port, label in SENSITIVE_PORTS.items():
            if from_port <= port <= to_port:
                exposed.append(f"{port}/{label}")
    return exposed

def _check_iam_users(users: List[Dict]) -> List[Dict]:
    findings = []
    for user in users:
        username = user.get("username", "unknown")
        
        # IAM_001 - MFA not enabled
        if not user.get("has_mfa"):
            findings.append(_finding(
                asset_id=username,
                resource_type="IAM User",
                issue="Multi-Factor Authentication (MFA) is not enabled.",
                severity=HIGH,
                rule_id="IAM_001",
                remediation="Enable MFA for this user. If they have console access, this is critical."
            ))

        # IAM_002 - Admin privileges
        if user.get("is_admin"):
            findings.append(_finding(
                asset_id=username,
                resource_type="IAM User",
                issue="User has AdministratorAccess permissions.",
                severity=MEDIUM,
                rule_id="IAM_002",
                remediation="Ensure this user actually requires admin access. Follow principle of least privilege."
            ))
    return findings

def _check_iam_roles(roles: List[Dict]) -> List[Dict]:
    findings = []
    for role in roles:
        name = role.get("role_name", "unknown")
        if role.get("is_admin"):
            findings.append(_finding(
                asset_id=name,
                resource_type="IAM Role",
                issue="Role has AdministratorAccess permissions.",
                severity=LOW,
                rule_id="IAM_003",
                remediation="Verify if the role really needs full admin access."
            ))
    return findings

def _check_ec2_instances(instances: List[Dict]) -> List[Dict]:
    findings = []
    for inst in instances:
        iid = inst.get("instance_id", "unknown")

        if inst.get("is_public") and not inst.get("iam_instance_profile"):
            findings.append(_finding(
                asset_id=iid,
                resource_type="EC2 Instance",
                issue="EC2 instance has a public IP but no IAM role profile attached.",
                severity=MEDIUM,
                rule_id="EC2_001",
                remediation=(
                    "Attach an IAM instance profile with least-privilege permissions."
                    "Avoid embedding AWS credentials directly in the instance."
                ),
            ))

        # EC2_002 — Instance without key pair (may indicate misconfigured access)
        if inst.get("state") == "running" and not inst.get("key_name"):
            findings.append(_finding(
                asset_id=iid,
                resource_type="EC2 Instance",
                issue="Running EC2 instance has no SSH key pair associated.",
                severity=LOW,
                rule_id="EC2_002",
                remediation=(
                    "Ensure all EC2 instances have a documented access method."
                    "Use AWS Systems Manager Session Manager as a key-free alternative."
                ),
            ))
    return findings


#____ Helper____
def _finding(
    asset_id: str,
    resource_type: str,
    issue: str,
    severity: str,
    rule_id: str,
    remediation: str,
) -> Dict:
    return {
        "asset_id": asset_id,
        "resource_type": resource_type,
        "issue": issue,
        "severity": severity,
        "rule_id": rule_id,
        "remediation": remediation,
        "risk_score": severity_to_score(severity),
    }

            