from pydantic import BaseModel
from typing import List, Optional

class YAMLValidationRequest(BaseModel):
    yaml_content: str

class YAMLValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str] = []
