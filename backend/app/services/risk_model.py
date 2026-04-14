"""
ml/risk_model.py — Machine learning risk scoring model.
 
Uses a Random Forest classifier trained on simulated cloud asset features
to assign a continuous risk score (0.0–1.0) to each resource.
 
Features:
  - public_access       (0/1)   — is the resource internet-exposed?
  - open_ports          (0–100) — number of inbound security group rules open to world
  - encryption_enabled  (0/1)   — is data encrypted at rest?
  - iam_privilege_level (0–3)   — 0=none, 1=read, 2=write, 3=admin
  - mfa_enabled         (0/1)   — is MFA enforced (IAM) or equivalent control in place?
  - logging_enabled     (0/1)   — is audit logging active?
 
The model is trained once at startup with synthetic data and cached in memory.
In production, replace synthetic data with labeled historical findings.
"""

import numpy as np 
import joblib
import os 
from typing import Dict, List, Any
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.pipeline import Pipeline
from app.utils.logger import get_logger

logger = get_logger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

FEATURES = [
    "public_access",
    "open_ports",
    "encryption_enabled",
    "iam_privilege_level",
    "mfa_enabled",
    "logging_enabled",
]

def _generate_training_data():
  np.random.seed(42)
  n = 2000

  public_access = np.random.randint(0,2,n)
  open_ports = np.random.randint(0,50,n)
  encryption_enabled = np.random.randint(0,2,n)
  iam_privilege_level = np.random.randint(0,4,n)
  mfa_enabled = np.random.randint(0,2,n)
  logging_enabled = np.random.randint(0,2,n)

  X = np.column_stack([
      public_access,
      open_ports,
      encryption_enabled,
      iam_privilege_level,
      mfa_enabled,
      logging_enabled,
  ])

  y =(
       (public_access == 1) &
       (
        (encryption_enabled == 0) |
        (iam_privilege_level == 3) |
        (open_ports > 20)
       )
  ).astype(int)

  return X,y

def train_model() -> Pipeline:
    logger.info("Training risk model on synthetic data...")
    X,y = _generate_training_data()

    pipeline = Pipeline([
      ("scaler", MinMaxScaler()),
      ("clf", RandomForestClassifier(
          n_estimators=100,
          max_depth=8,
          class_weight="balanced",
          random_state=42,
      ))
    ])
    pipeline.fit(X,y)

    joblib.dump(pipeline, MODEL_PATH)
    logger.info(f"Risk model trained and saved to {MODEL_PATH}")
    return pipeline

def load_or_train_model() -> Pipeline:
    if os.path.exists(MODEL_PATH):
       logger.info("Loading trained risk model from disk.")
       return joblib.load(MODEL_PATH)
    return train_model()

_model: Pipeline = None

def get_model() -> Pipeline:
    global _model
    if _model is None:
       _model = load_or_train_model()
    return _model

def predict_risk(features: Dict) -> Dict:
  model = get_model()
  row = np.array([[features.get(f,0) for f in FEATURES]], dtype=float)

  proba = model.predict_proba(row)[0]
  risk_score = float(proba[1])

  risk_level = _score_to_level(risk_score)
  return {"risk_score": round(risk_score, 3), "risk_level": risk_level}

def predict_batch(feature_list: List[Dict]) -> List[Dict]:
  model = get_model()
  X = np.array([[f.get(feat, 0) for feat in FEATURES] for f in feature_list], dtype=float)
  probas = model.predict_proba(X)[:, 1]
  return [
    {"risk_score": round(float(p),3), "risk_level": _score_to_level(float(p))}
    for p in probas
  ]

def _score_to_level(score: float) -> str:
    if score >= 0.8:
        return "Critical"
    elif score >= 0.6:
        return "High"
    elif score >= 0.4:
        return "Medium"
    elif score >= 0.2:
        return "Low"
    return "Minimal"

def score_all_resources(scan_results: Dict[str, Any]) -> List[Dict]:
    """
    Map all scanned resources to feature dicts and run batch prediction.
    Returns a list of scored items: {"asset_id": str, "risk_score": float, "risk_level": str}
    """
    feature_list = []
    metadata_list = []

    # Map EC2 instances
    for inst in scan_results.get("ec2_instances", []):
        f = {
            "public_access": 1 if inst.get("is_public") else 0,
            "open_ports": len(inst.get("security_groups", [])), 
            "encryption_enabled": 0, 
            "iam_privilege_level": 1 if inst.get("iam_instance_profile") else 0,
            "mfa_enabled": 0,
            "logging_enabled": 1, 
        }
        feature_list.append(f)
        metadata_list.append({"asset_id": inst.get("instance_id"), "type": "ec2"})

    # Map S3 Buckets
    for bucket in scan_results.get("s3_buckets", []):
        f = {
            "public_access": 1 if bucket.get("is_public") else 0,
            "open_ports": 0,
            "encryption_enabled": 1 if bucket.get("encryption_enabled") else 0,
            "iam_privilege_level": 0,
            "mfa_enabled": 0,
            "logging_enabled": 1 if bucket.get("logging_enabled") else 0,
        }
        feature_list.append(f)
        metadata_list.append({"asset_id": bucket.get("name"), "type": "s3"})

    # Map IAM Users
    for user in scan_results.get("iam_users", []):
        f = {
            "public_access": 0,
            "open_ports": 0,
            "encryption_enabled": 0,
            "iam_privilege_level": 3 if user.get("is_admin") else 2,
            "mfa_enabled": 1 if user.get("has_mfa") else 0,
            "logging_enabled": 1,
        }
        feature_list.append(f)
        metadata_list.append({"asset_id": user.get("username"), "type": "iam_user"})

    if not feature_list:
        return []

    scores = predict_batch(feature_list)
    
    # Merge scores with metadata
    results = []
    for i, score in enumerate(scores):
        results.append({
            "asset_id": metadata_list[i]["asset_id"],
            "resource_type": metadata_list[i]["type"],
            **score
        })
    
    return results



