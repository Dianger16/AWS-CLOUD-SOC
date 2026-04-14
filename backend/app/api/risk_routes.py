from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.services.risk_model import predict_risk, predict_batch, get_model
from app.security.auth import get_current_user, TokenData
from app.utils.logger import get_logger

router = APIRouter(prefix="/risk", tags=["Risk Analysis"])
logger = get_logger(__name__)

class ResourceFeatures(BaseModel):
    resource_id: str = Field(..., example="i-0abc123def456")
    resource_type: str = Field(..., example="ec2")
    public_access: int = Field(0, ge=0, le=1, example=1)
    open_ports: int = Field(0, ge=0, le=65535, example=3)
    encryption_enabled: int = Field(0, ge=0, le=1, example=0)
    iam_privilege_level: int = Field(0, ge=0, le=3, example=2)
    mfa_enabled: int = Field(0, ge=0, le=1, example=1)
    logging_enabled: int = Field(0, ge=0, le=1, example=1)

@router.post("/predict", summary="Predict risk for a single resource")
async def predict_single_risk(
    features: ResourceFeatures,
    current_user: TokenData = Depends(get_current_user),
) -> Dict[str, Any]:
    try:
        results = predict_risk(features.dict())
        return {
            "resource_id": features.resource_id,
            "resource_type": features.resource_type,
            **results
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk prediction failed: {str(e)}",
        )

@router.post("/predict-batch", summary="Predict risk for multiple resources")
async def predict_batch_risk(
    feature_list: List[ResourceFeatures],
    current_user: TokenData = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    try:
        input_data = [f.dict() for f in feature_list]
        scores = predict_batch(input_data)
        
        results = []
        for i, score in enumerate(scores):
            results.append({
                "resource_id": feature_list[i].resource_id,
                "resource_type": feature_list[i].resource_type,
                **score
            })
        return results
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch risk prediction failed: {str(e)}",
        )