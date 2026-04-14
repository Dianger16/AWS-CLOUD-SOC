"""
services/aws_scanner.py — AWS cloud asset discovery module.

All public functions accept explicit credentials passed per-request.
Credentials are NEVER stored, logged in full, or written to disk.
"""

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from typing import Any, Dict, List, Optional
from app.utils.logger import get_logger
from app.utils.helpers import flatten_tags

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

def _make_session(
    access_key_id: str,
    secret_access_key: str,
    region: str,
    session_token: Optional[str] = None,
) -> boto3.Session:
    """Create a boto3 session from explicit credentials. Never logs secrets."""
    kwargs: Dict[str, Any] = {
        "aws_access_key_id": access_key_id,
        "aws_secret_access_key": secret_access_key,
        "region_name": region,
    }
    if session_token:
        kwargs["aws_session_token"] = session_token
    return boto3.Session(**kwargs)


# ---------------------------------------------------------------------------
# Credential validation
# ---------------------------------------------------------------------------

def validate_aws_credentials_explicit(
    access_key_id: str,
    secret_access_key: str,
    region: str,
    session_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Validate credentials via STS GetCallerIdentity.
    Returns account info. Raises ValueError with a clear message on failure.
    """
    try:
        session = _make_session(access_key_id, secret_access_key, region, session_token)
        sts = session.client("sts")
        identity = sts.get_caller_identity()
        account_id = identity.get("Account")
        user_arn = identity.get("Arn")
        logger.info(f"Credentials valid — account={account_id}")
        return {
            "valid": True,
            "account_id": account_id,
            "user_arn": user_arn,
            "region": region,
        }
    except ClientError as e:
        code = e.response["Error"]["Code"]
        messages = {
            "InvalidClientTokenId": "Invalid AWS Access Key ID. Re-copy it from the AWS Console.",
            "SignatureDoesNotMatch": "Invalid AWS Secret Access Key. Re-copy the secret key.",
            "ExpiredTokenException": "AWS credentials have expired. Generate new access keys.",
            "AuthFailure": "AWS authentication failed. Verify your credentials.",
            "AccessDenied": "Credentials are valid but cannot call STS. Attach the IAM policy.",
            "InvalidUserID.NotFound": "The AWS user was not found. Check your Access Key ID.",
        }
        raise ValueError(messages.get(code, f"AWS error ({code}): {e.response['Error']['Message']}"))
    except Exception as e:
        raise ValueError(
            f"Cannot connect to AWS region '{region}'. "
            f"Check your region name and that the backend has internet access. "
            f"({type(e).__name__}: {str(e)})"
        )


# ---------------------------------------------------------------------------
# EC2 Scanner
# ---------------------------------------------------------------------------

def _do_scan_ec2(session: boto3.Session) -> List[Dict]:
    """Scan all EC2 instances in the session region."""
    instances = []
    try:
        ec2 = session.client("ec2")
        paginator = ec2.get_paginator("describe_instances")
        for page in paginator.paginate():
            for reservation in page.get("Reservations", []):
                for inst in reservation.get("Instances", []):
                    public_ip = inst.get("PublicIpAddress")
                    instances.append({
                        "instance_id": inst.get("InstanceId"),
                        "instance_type": inst.get("InstanceType"),
                        "state": inst.get("State", {}).get("Name"),
                        "public_ip": public_ip,
                        "private_ip": inst.get("PrivateIpAddress"),
                        "is_public": bool(public_ip),
                        "key_name": inst.get("KeyName"),
                        "iam_instance_profile": inst.get("IamInstanceProfile", {}).get("Arn"),
                        "security_groups": [
                            sg.get("GroupId") for sg in inst.get("SecurityGroups", [])
                        ],
                        "tags": flatten_tags(inst.get("Tags")),
                        "launch_time": str(inst.get("LaunchTime", "")),
                    })
        logger.info(f"EC2: {len(instances)} instances discovered.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"EC2 scan failed: {e}")
    return instances


# ---------------------------------------------------------------------------
# S3 Scanner
# ---------------------------------------------------------------------------

def _do_scan_s3(session: boto3.Session) -> List[Dict]:
    """Scan all S3 buckets — public access, encryption, logging."""
    buckets = []
    try:
        s3 = session.client("s3")
        response = s3.list_buckets()
        for bucket in response.get("Buckets", []):
            name = bucket["Name"]
            data: Dict[str, Any] = {
                "name": name,
                "is_public": False,
                "versioning_enabled": False,
                "logging_enabled": False,
                "encryption_enabled": False,
                "region": "unknown",
                "tags": {},
            }
            try:
                loc = s3.get_bucket_location(Bucket=name)
                data["region"] = loc.get("LocationConstraint") or "us-east-1"
            except ClientError:
                pass
            try:
                pab = s3.get_public_access_block(Bucket=name)
                cfg = pab.get("PublicAccessBlockConfiguration", {})
                fully_blocked = all([
                    cfg.get("BlockPublicAcls", False),
                    cfg.get("IgnorePublicAcls", False),
                    cfg.get("BlockPublicPolicy", False),
                    cfg.get("RestrictPublicBuckets", False),
                ])
                data["is_public"] = not fully_blocked
            except ClientError:
                data["is_public"] = True
            try:
                v = s3.get_bucket_versioning(Bucket=name)
                data["versioning_enabled"] = v.get("Status") == "Enabled"
            except ClientError:
                pass
            try:
                enc = s3.get_bucket_encryption(Bucket=name)
                data["encryption_enabled"] = bool(
                    enc.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])
                )
            except ClientError:
                data["encryption_enabled"] = False
            try:
                log = s3.get_bucket_logging(Bucket=name)
                data["logging_enabled"] = "LoggingEnabled" in log
            except ClientError:
                pass
            try:
                tags_resp = s3.get_bucket_tagging(Bucket=name)
                data["tags"] = flatten_tags(tags_resp.get("TagSet", []))
            except ClientError:
                pass
            buckets.append(data)
        logger.info(f"S3: {len(buckets)} buckets discovered.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"S3 scan failed: {e}")
    return buckets


# ---------------------------------------------------------------------------
# IAM Scanner
# ---------------------------------------------------------------------------

def _do_scan_iam(session: boto3.Session) -> Dict[str, List[Dict]]:
    """Scan IAM users and roles."""
    iam = session.client("iam")
    users: List[Dict] = []
    roles: List[Dict] = []

    try:
        paginator = iam.get_paginator("list_users")
        for page in paginator.paginate():
            for user in page.get("Users", []):
                uname = user["UserName"]
                ud: Dict[str, Any] = {
                    "username": uname,
                    "arn": user.get("Arn"),
                    "has_mfa": False,
                    "has_console_access": False,
                    "attached_policies": [],
                    "is_admin": False,
                    "tags": flatten_tags(user.get("Tags")),
                }
                try:
                    mfa = iam.list_mfa_devices(UserName=uname)
                    ud["has_mfa"] = bool(mfa.get("MFADevices"))
                except ClientError:
                    pass
                try:
                    iam.get_login_profile(UserName=uname)
                    ud["has_console_access"] = True
                except ClientError:
                    pass
                try:
                    policies = iam.list_attached_user_policies(UserName=uname)
                    ud["attached_policies"] = [
                        p["PolicyName"] for p in policies.get("AttachedPolicies", [])
                    ]
                    ud["is_admin"] = "AdministratorAccess" in ud["attached_policies"]
                except ClientError:
                    pass
                users.append(ud)
        logger.info(f"IAM: {len(users)} users discovered.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"IAM user scan failed: {e}")

    try:
        paginator = iam.get_paginator("list_roles")
        for page in paginator.paginate():
            for role in page.get("Roles", []):
                rname = role["RoleName"]
                rd: Dict[str, Any] = {
                    "role_name": rname,
                    "arn": role.get("Arn"),
                    "attached_policies": [],
                    "is_admin": False,
                    "tags": flatten_tags(role.get("Tags")),
                }
                try:
                    policies = iam.list_attached_role_policies(RoleName=rname)
                    rd["attached_policies"] = [
                        p["PolicyName"] for p in policies.get("AttachedPolicies", [])
                    ]
                    rd["is_admin"] = "AdministratorAccess" in rd["attached_policies"]
                except ClientError:
                    pass
                roles.append(rd)
        logger.info(f"IAM: {len(roles)} roles discovered.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"IAM role scan failed: {e}")

    return {"users": users, "roles": roles}


# ---------------------------------------------------------------------------
# Security Groups Scanner
# ---------------------------------------------------------------------------

def _do_scan_security_groups(session: boto3.Session) -> List[Dict]:
    """Scan EC2 security groups for open-to-world inbound rules."""
    groups = []
    try:
        ec2 = session.client("ec2")
        paginator = ec2.get_paginator("describe_security_groups")
        for page in paginator.paginate():
            for sg in page.get("SecurityGroups", []):
                inbound = sg.get("IpPermissions", [])
                groups.append({
                    "group_id": sg.get("GroupId"),
                    "group_name": sg.get("GroupName"),
                    "description": sg.get("Description"),
                    "vpc_id": sg.get("VpcId"),
                    "open_to_world": _check_open_to_world(inbound),
                    "inbound_rules": inbound,
                    "tags": flatten_tags(sg.get("Tags")),
                })
        logger.info(f"Security groups: {len(groups)} discovered.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"Security group scan failed: {e}")
    return groups


def _check_open_to_world(rules: List[Dict]) -> bool:
    """Return True if any inbound rule allows traffic from 0.0.0.0/0 or ::/0."""
    for rule in rules:
        for ipv4 in rule.get("IpRanges", []):
            if ipv4.get("CidrIp") == "0.0.0.0/0":
                return True
        for ipv6 in rule.get("Ipv6Ranges", []):
            if ipv6.get("CidrIpv6") == "::/0":
                return True
    return False


# ---------------------------------------------------------------------------
# Main orchestrator — all names are unambiguous
# ---------------------------------------------------------------------------

def run_full_scan_with_credentials(
    access_key_id: str,
    secret_access_key: str,
    region: str,
    session_token: Optional[str] = None,
    scan_ec2: bool = True,
    scan_s3: bool = True,
    scan_iam: bool = True,
    scan_security_groups: bool = True,
) -> Dict[str, Any]:
    """
    Run a full AWS infrastructure scan using explicitly provided credentials.

    Validates credentials first via STS, then scans all selected resource types.
    Credentials exist only in this call stack — never stored or persisted.

    Args:
        access_key_id:        AWS Access Key ID
        secret_access_key:    AWS Secret Access Key
        region:               AWS region to scan (e.g. "us-east-1")
        session_token:        Optional STS session token
        scan_ec2:             Scan EC2 instances
        scan_s3:              Scan S3 buckets
        scan_iam:             Scan IAM users and roles
        scan_security_groups: Scan security groups

    Returns:
        Dict with account info and all discovered resources.

    Raises:
        ValueError: If credentials are invalid or AWS is unreachable.
    """
    logger.info(f"Starting scan in region '{region}'...")

    # Step 1 — Validate credentials via STS (fast, fails clearly on bad creds)
    identity = validate_aws_credentials_explicit(
        access_key_id, secret_access_key, region, session_token
    )

    # Step 2 — Build session
    session = _make_session(access_key_id, secret_access_key, region, session_token)

    # Step 3 — Scan each resource type
    # Note: all scanner functions are prefixed with _do_ to avoid any name
    # collision with the boolean parameters above
    iam_data = _do_scan_iam(session) if scan_iam else {"users": [], "roles": []}

    result: Dict[str, Any] = {
        "account_id": identity["account_id"],
        "scanned_by_arn": identity["user_arn"],
        "region": region,
        "ec2_instances": _do_scan_ec2(session) if scan_ec2 else [],
        "s3_buckets": _do_scan_s3(session) if scan_s3 else [],
        "iam_users": iam_data["users"],
        "iam_roles": iam_data["roles"],
        "security_groups": _do_scan_security_groups(session) if scan_security_groups else [],
    }

    total = sum(len(v) for v in result.values() if isinstance(v, list))
    logger.info(f"Scan complete — account={identity['account_id']} resources={total}")
    return result
