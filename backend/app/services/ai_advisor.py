from typing import Dict, Optional
from app.core.config import settings 
from app.utils.logger import get_logger

logger = get_logger(__name__)

RULE_RECOMMENDATIONS: Dict[str, Dict] = {
    "S3_001": {
        "risk": "Publicly accessible S3 buckets can expose sensitive data to anyone on the internet.",
        "recommendation": (
            "1. Enable Block Public Access at the account and bucket level.\n"
            "2. Audit and remove any public-read or public-read-write ACLs.\n"
            "3. Review bucket policies for overly permissive Principal: '*' statements.\n"
            "4. Enable S3 Access Analyzer to continuously monitor for public access.\n"
            "5. If public access is intentional (e.g. static site), ensure only non-sensitive "
              " content is stored and consider CloudFront with signed URLs instead."
        ),
        "severity": "Critical",
        "effort": "Low",
        "priority": 1,
    },
    "S3_002": {
        "risk": "Unencrypted S3 data is at risk if AWS infrastructure is compromised or misconfigured.",
        "recommendation": (
            "1. Enable default server-side encryption (SSE-S3 or SSE-KMS) on the bucket.\n"
            "2. Use SSE-KMS with a customer-managed key for regulated data.\n"
            "3. Enforce encryption via a bucket policy that denies PutObject without encryption headers.\n"
            "4. Enable AWS Config rule 's3-bucket-server-side-encryption-enabled' for drift detection."
        ),
        "severity": "High",
        "effort": "Low",
        "priority": 2,
    },
    "S3_003": {
        "risk": "Without access logging, it is impossible to detect data exfiltration or unauthorized access.",
        "recommendation": (
            "1. Enable S3 server access logging and deliver to a separate, write-only logging bucket.\n"
            "2. Alternatively, use AWS CloudTrail data events for S3 (provides API-level logging).\n"
            "3. Set up Amazon Macie to detect sensitive data access patterns."
        ),
        "severity": "Medium",
        "effort": "Low",
        "priority": 3,
    },
    "SG_001": {
        "risk": (
            "Security groups with 0.0.0.0/0 rules expose services to the entire internet, "
            "enabling port scanning, brute-force attacks, and exploitation."
        ),
        "recommendation": (
            "1. Replace 0.0.0.0/0 with specific trusted IP ranges or security group references.\n"
            "2. Move SSH (22) and RDP (3389) access behind a VPN or bastion host.\n"
            "3. Use AWS Systems Manager Session Manager to eliminate SSH/RDP entirely.\n"
            "4. Enable VPC Flow Logs to monitor traffic to affected instances.\n"
            "5. Apply the principle of least privilege — open only the ports the service requires."
        ),
        "severity": "Critical",
        "effort": "Medium",
        "priority": 1,
    },
    "IAM_001": {
        "risk": (
            "AdministratorAccess grants full control over all AWS services and resources. "
            "Compromise of this account has catastrophic blast radius."
        ),
        "recommendation": (
            "1. Remove AdministratorAccess and replace with scoped, least-privilege policies.\n"
            "2. Use IAM Access Analyzer to generate least-privilege policies from activity.\n"
            "3. Enable AWS Organizations SCPs to restrict dangerous actions at the account level.\n"
            "4. Require MFA for all privileged actions using a Condition in IAM policies.\n"
            "5. Audit with AWS Trusted Advisor and Security Hub."
        ),
        "severity": "Critical",
        "effort": "High",
        "priority": 1,
    },
    "IAM_002": {
        "risk": "Without MFA, compromised passwords give attackers full console access.",
        "recommendation": (
            "1. Enable MFA for all IAM users with console access immediately.\n"
            "2. Enforce MFA via an IAM policy that denies all actions unless MFA is present.\n"
            "3. Consider migrating to AWS IAM Identity Center (SSO) with federated MFA.\n"
            "4. For service accounts, use IAM roles instead of user credentials."
        ),
        "severity": "High",
        "effort": "Low",
        "priority": 2,
    },
    "IAM_003": {
        "risk": "An IAM role with AdministratorAccess can be assumed to gain full AWS control.",
        "recommendation": (
            "1. Replace AdministratorAccess with scoped task-specific policies.\n"
            "2. Review trust policies — limit which services/accounts can assume the role.\n"
            "3. Enable CloudTrail to log all AssumeRole API calls.\n"
            "4. Set up GuardDuty to detect anomalous role usage patterns."
        ),
        "severity": "High",
        "effort": "Medium",
        "priority": 2,
    },
    "EC2_001": {
        "risk": "A public EC2 instance without an IAM profile may use hard-coded credentials.",
        "recommendation": (
            "1. Attach an IAM instance profile with least-privilege permissions.\n"
            "2. Rotate or remove any hard-coded credentials.\n"
            "3. Use AWS Secrets Manager or Parameter Store for application secrets.\n"
            "4. Enable IMDSv2 (token-required mode) to protect instance metadata."
        ),
        "severity": "Medium",
        "effort": "Low",
        "priority": 3,
    },
    "EC2_002": {
        "risk": "Instance access methods are undocumented, complicating incident response.",
        "recommendation": (
            "1. Use AWS Systems Manager Session Manager for keyless, audited shell access.\n"
            "2. Document the access method for all running instances.\n"
            "3. Ensure CloudTrail logs all SSM session activity."
        ),
        "severity": "Low",
        "effort": "Low",
        "priority": 4,
    },
}
    
    
def get_recommendation(rule_id: str, context: Optional[Dict] = None) -> Dict:
    rec = RULE_RECOMMENDATIONS.get(rule_id)
    if rec:
        logger.debug(f"Returning rule-based recommendation for {rule_id}.")
        return rec
    
    return {
        "risk": "A security misconfiguration was detected that may expose your infrastructure.",
        "recommendation": (
            "Review the affected resource against the AWS Security Best Practices guide. "
            "Apply least-privilege access, enable encryption, and ensure logging is active."
        ),
        "severity": "Medium",
        "effort": "Medium",
        "priority": 3,
    }

async def get_llm_recommendation(
    issue_description: str,
    resource_type: str,
    severity: str,
    ) -> str:
    if not settings.OPENAI_API_KEY:
        logger.info("OPENAI_API_KEY not set; using rule-based recommendations.")
        return (
            "Enable least-privilege access, encryption, and audit logging"
            "for this resource. Consult the AWS Security Best Practices guide."
        )

    try: 
        import httpx

        prompt = (
            f"You are a cloud security expert.\n\n"
            f"A security scan found the following issue:\n"
            f"Resource Type: {resource_type}\n"
            f"Severity: {severity}\n"
            f"Issue: {issue_description}\n\n"
            f"Provide a concise, numbered remediation plan (max 5 steps) that a "
            f"cloud engineer can follow immediately. Include AWS CLI commands where helpful."
        )

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 400,
                    "temperature": 0.2,
                }, 
            )
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"LLM recommendation failed: {e}")
        return get_recommendation("GENERIC")["recommendation"]

