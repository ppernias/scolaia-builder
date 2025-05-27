from fastapi import APIRouter, HTTPException, status
from typing import Any, Dict

from ..services.yaml_validator import validate_yaml

router = APIRouter()

@router.post("/yaml")
async def validate_yaml_content(yaml_content: Dict[str, str]) -> Any:
    """Validate YAML content against the schema"""
    if "content" not in yaml_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No YAML content provided"
        )
    
    is_valid, errors = validate_yaml(yaml_content["content"])
    
    return {
        "valid": is_valid,
        "errors": errors
    }
