from fastapi import APIRouter, HTTPException, status
from typing import Any, Dict, List

from ..schemas.validation import YAMLValidationRequest, YAMLValidationResponse
from ..services.yaml_validator import validate_yaml

router = APIRouter()

@router.post("/", response_model=YAMLValidationResponse)
async def validate_yaml_content(
    validation_request: YAMLValidationRequest
) -> Any:
    """Validate YAML content against the schema"""
    is_valid, errors = validate_yaml(validation_request.yaml_content)
    
    return {
        "is_valid": is_valid,
        "errors": errors if not is_valid else []
    }
