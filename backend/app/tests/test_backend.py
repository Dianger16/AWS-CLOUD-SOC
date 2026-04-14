import pytest
from fastapi.testclient import TestClient

class TestClientModel:
    def setup_method(self):
        from app.ml.risk_model import load_or_train_model
        self.model = load_or_train_model()

    def test_model_loads(self):
        assert self.model is not None

    def test_predict_high_risk(self):
        from app.ml.risk_model import predict_risk
        result = predict_risk({
            "public_access": 1,
            "open_ports":30,
            "encryption_enabled": 0,
            "iam_privilege_level": 3,
            "mfa_enabled": 0,
            "logging_enabled": 0,
        })
        assert "risk_score" in result
        assert "risk_level" in result
        assert 0.0 <= result["risk_score"] <= 1.0
        assert result["risk_level"] in ["Minimal","Low","Medium","High","Critical"]

    def test_predict_low_risk(self):
        from app.ml.risk_model import predict_risk
        result = predict_risk({
            "public_access": 0,
            "open_ports":0,
            "encryption_enabled": 1,
            "iam_privilege_level": 0,
            "mfa_enabled": 1,
            "logging_enabled": 1,
        })
        assert result["risk_score"] < 0.5, "Secure resource should have low risk score"

    def test_predict_batch(self):
        from app.ml.risk_model import predict_batch
        features = [
            {
                "public_access": 1, "open_ports": 10, "encryption_enabled": 0,
                "iam_privilege_level": 3, "mfa_enabled": 0, "logging_enabled": 0,
            },
            {
                "public_access": 0, "open_ports": 0, "encryption_enabled": 1,
                "iam_privilege_level": 0, "mfa_enabled": 1, "logging_enabled": 1,
            }
        ]
        results = predict_batch(features)
        assert len(results) == 2
        assert results[0]["risk_score"] > results[1]["risk_score"]

    def test_missing_features_default_to_zero(self):
        from app.ml.risk_model import predict_risk
        result = predict_risk({})
        assert "risk_score" in result
    
class TestMisconfigDetector:
    def _run(self, scan_data):
        from app.services.misconfig import detect_all
        return detect_all(scan_data)

    def test_public_s3_bucket_detected(self):
        findings = self._run({
            "s3_buckets": [{"name": "public-bucket", "is_public": True,
                          "encryption_enabled": True, "logging_enabled": True}],
            "security_groups": [], "iam_users": [], "iam_roles": [], "ec2_instances": [],
        })
        rule_ids = [f["rule_id"] for f in findings]
        assert "S3_001" in rule_ids
 
    def test_unencrypted_s3_detected(self):
        findings = self._run({
            "s3_buckets": [{"name": "enc-bucket", "is_public": False,
                            "encryption_enabled": False, "logging_enabled": True}],
            "security_groups": [], "iam_users": [], "iam_roles": [], "ec2_instances": [],
        })
        rule_ids = [f["rule_id"] for f in findings]
        assert "S3_002" in rule_ids
 
    def test_open_security_group_detected(self):
        findings = self._run({
            "s3_buckets": [],
            "security_groups": [{"group_id": "sg-001", "open_to_world": True, "inbound_rules": []}],
            "iam_users": [], "iam_roles": [], "ec2_instances": [],
        })
        rule_ids = [f["rule_id"] for f in findings]
        assert "SG_001" in rule_ids
 
    def test_iam_admin_user_detected(self):
        findings = self._run({
            "s3_buckets": [], "security_groups": [],
            "iam_users": [{"username": "superuser", "is_admin": True,
                           "has_mfa": True, "has_console_access": False}],
            "iam_roles": [], "ec2_instances": [],
        })
        rule_ids = [f["rule_id"] for f in findings]
        assert "IAM_001" in rule_ids
 
    def test_iam_no_mfa_detected(self):
        findings = self._run({
            "s3_buckets": [], "security_groups": [],
            "iam_users": [{"username": "noMFAuser", "is_admin": False,
                           "has_mfa": False, "has_console_access": True}],
            "iam_roles": [], "ec2_instances": [],
        })
        rule_ids = [f["rule_id"] for f in findings]
        assert "IAM_002" in rule_ids
 
    def test_secure_config_produces_no_critical_findings(self):
        findings = self._run({
            "s3_buckets": [{"name": "safe-bucket", "is_public": False,
                            "encryption_enabled": True, "logging_enabled": True}],
            "security_groups": [{"group_id": "sg-safe", "open_to_world": False, "inbound_rules": []}],
            "iam_users": [{"username": "secureuser", "is_admin": False,
                           "has_mfa": True, "has_console_access": True}],
            "iam_roles": [], "ec2_instances": [],
        })
        critical = [f for f in findings if f["severity"] == "Critical"]
        assert len(critical) == 0
 
    def test_findings_have_required_fields(self):
        findings = self._run({
            "s3_buckets": [{"name": "x", "is_public": True,
                            "encryption_enabled": False, "logging_enabled": False}],
            "security_groups": [], "iam_users": [], "iam_roles": [], "ec2_instances": [],
        })
        for f in findings:
            assert "asset_id" in f
            assert "severity" in f
            assert "rule_id" in f
            assert "remediation" in f
            assert "risk_score" in f
 
 
# ─────────────────────────────────────────────
# Log Anomaly Detection Tests
# ─────────────────────────────────────────────
 
class TestAnomalyDetection:
    def test_insufficient_events_returns_non_anomalous(self):
        from app.ml.anomaly_detection import detect_anomalies
        events = [{"api_call_count": 1, "failed_logins": 0, "hour_of_day": 10,
                   "is_new_region": False, "bytes_transferred": 0, "unique_resources": 1}]
        results = detect_anomalies(events)
        assert len(results) == 1
        assert results[0]["anomaly"] is False
 
    def test_anomaly_detected_in_batch(self):
        from app.ml.anomaly_detection import detect_anomalies
        import random
        random.seed(42)
 
        # 19 normal events + 1 extreme outlier
        events = [
            {"api_call_count": random.randint(1, 10), "failed_logins": 0,
             "hour_of_day": random.randint(8, 18), "is_new_region": False,
             "bytes_transferred": 1000, "unique_resources": 2}
            for _ in range(19)
        ]
        events.append({
            "api_call_count": 9999,   # extreme
            "failed_logins": 50,       # extreme
            "hour_of_day": 3,
            "is_new_region": True,
            "bytes_transferred": 5_000_000_000,
            "unique_resources": 200,
        })
        results = detect_anomalies(events)
        assert any(r["anomaly"] for r in results), "Extreme outlier should be detected"
 
    def test_all_results_have_anomaly_field(self):
        from app.ml.anomaly_detection import detect_anomalies
        events = [
            {"api_call_count": i, "failed_logins": 0, "hour_of_day": 12,
             "is_new_region": False, "bytes_transferred": 0, "unique_resources": 1}
            for i in range(15)
        ]
        results = detect_anomalies(events)
        assert all("anomaly" in r for r in results)
        assert all("anomaly_score" in r for r in results)
 
 
# ─────────────────────────────────────────────
# AI Advisor Tests
# ─────────────────────────────────────────────
 
class TestAIAdvisor:
    def test_known_rule_returns_recommendation(self):
        from app.services.ai_advisor import get_recommendation
        rec = get_recommendation("S3_001")
        assert "recommendation" in rec
        assert "risk" in rec
        assert rec["severity"] == "Critical"
 
    def test_unknown_rule_returns_generic(self):
        from app.services.ai_advisor import get_recommendation
        rec = get_recommendation("UNKNOWN_999")
        assert "recommendation" in rec
 
    def test_all_defined_rules_have_recommendations(self):
        from app.services.ai_advisor import RULE_RECOMMENDATIONS
        for rule_id, rec in RULE_RECOMMENDATIONS.items():
            assert "risk" in rec, f"{rule_id} missing 'risk'"
            assert "recommendation" in rec, f"{rule_id} missing 'recommendation'"
            assert "severity" in rec, f"{rule_id} missing 'severity'"
 
 
# ─────────────────────────────────────────────
# Helper Utilities Tests
# ─────────────────────────────────────────────
 
class TestHelpers:
    def test_severity_to_score(self):
        from app.utils.helpers import severity_to_score
        assert severity_to_score("Critical") == 1.0
        assert severity_to_score("High") == 0.75
        assert severity_to_score("Medium") == 0.5
        assert severity_to_score("Low") == 0.25
        assert severity_to_score("Info") == 0.1
        assert severity_to_score("unknown") == 0.0
 
    def test_score_to_severity(self):
        from app.utils.helpers import score_to_severity
        assert score_to_severity(0.95) == "Critical"
        assert score_to_severity(0.70) == "High"
        assert score_to_severity(0.45) == "Medium"
        assert score_to_severity(0.20) == "Low"
        assert score_to_severity(0.05) == "Info"
 
    def test_flatten_tags(self):
        from app.utils.helpers import flatten_tags
        tags = [{"Key": "env", "Value": "prod"}, {"Key": "team", "Value": "security"}]
        result = flatten_tags(tags)
        assert result == {"env": "prod", "team": "security"}
 
    def test_flatten_tags_none(self):
        from app.utils.helpers import flatten_tags
        assert flatten_tags(None) == {}
        assert flatten_tags([]) == {}
 
 
@pytest.fixture(scope="module")
def client():
    """Create a TestClient with SQLite in-memory database."""
    import os
    os.environ["DATABASE_URL"] = "sqlite:///./test_guardian.db"
    os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
 
    from app.main import app
    from app.database import init_db
    init_db()
 
    with TestClient(app) as c:
        yield c
 
    import os
    if os.path.exists("test_guardian.db"):
        os.remove("test_guardian.db")
 
 
@pytest.fixture(scope="module")
def auth_token(client):
    """Obtain a valid JWT token for testing."""
    response = client.post(
        "/auth/token",
        data={"username": "admin", "password": "guardian2024"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]
 
 
@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
 
 
class TestAuthEndpoints:
    def test_health_check(self, client):
        response = client.get("/auth/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
 
    def test_login_success(self, client):
        response = client.post(
            "/auth/token",
            data={"username": "admin", "password": "guardian2024"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
 
    def test_login_wrong_password(self, client):
        response = client.post(
            "/auth/token",
            data={"username": "admin", "password": "wrongpassword"},
        )
        assert response.status_code == 401
 
    def test_protected_endpoint_without_token(self, client):
        response = client.get("/alerts")
        assert response.status_code == 403
 
 
class TestRiskScoreEndpoints:
    def test_score_single_resource(self, client, auth_headers):
        response = client.post(
            "/risk-score/",
            headers=auth_headers,
            json={
                "resource_id": "test-bucket",
                "resource_type": "s3",
                "public_access": 1,
                "open_ports": 0,
                "encryption_enabled": 0,
                "iam_privilege_level": 0,
                "mfa_enabled": 0,
                "logging_enabled": 0,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "risk_score" in data
        assert "risk_level" in data
        assert data["resource_id"] == "test-bucket"
 
    def test_score_batch(self, client, auth_headers):
        response = client.post(
            "/risk-score/batch",
            headers=auth_headers,
            json={
                "resources": [
                    {"resource_id": "r1", "resource_type": "s3", "public_access": 1,
                     "open_ports": 0, "encryption_enabled": 0, "iam_privilege_level": 0,
                     "mfa_enabled": 0, "logging_enabled": 0},
                    {"resource_id": "r2", "resource_type": "ec2", "public_access": 0,
                     "open_ports": 0, "encryption_enabled": 1, "iam_privilege_level": 0,
                     "mfa_enabled": 0, "logging_enabled": 1},
                ]
            },
        )
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 2
 
    def test_model_info(self, client, auth_headers):
        response = client.get("/risk-score/model-info", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "model_type" in data
        assert "features" in data
 
 
class TestAlertEndpoints:
    def test_get_alerts_empty(self, client, auth_headers):
        response = client.get("/alerts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        assert "total" in data
 
    def test_analyze_logs_missing_body(self, client, auth_headers):
        response = client.post(
            "/analyze-logs",
            headers=auth_headers,
            json={"cloudtrail_events": [], "vpc_flow_records": []},
        )
        assert response.status_code == 422
 
    def test_analyze_logs_with_events(self, client, auth_headers):
        events = [
            {
                "eventTime": f"2024-01-15T{h:02d}:00:00Z",
                "eventName": "DescribeInstances",
                "userIdentity": {"arn": f"arn:aws:iam::123:user/user{h}"},
                "awsRegion": "us-east-1",
                "sourceIPAddress": "10.0.0.1",
            }
            for h in range(12)
        ]
        response = client.post(
            "/analyze-logs",
            headers=auth_headers,
            json={"cloudtrail_events": events, "persist_alerts": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_events_analyzed" in data
 
    def test_advisor_rule_based(self, client, auth_headers):
        response = client.post(
            "/advisor",
            headers=auth_headers,
            json={"rule_id": "SG_001"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "rule_based"
        assert "recommendation" in data
 
    def test_advisor_missing_input(self, client, auth_headers):
        response = client.post(
            "/advisor",
            headers=auth_headers,
            json={"resource_type": "S3 Bucket", "severity": "High"},
        )
        assert response.status_code == 422
 