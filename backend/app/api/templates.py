from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Dict
import yaml
import os
from pathlib import Path

from ..core.database import get_db
from ..schemas.assistant import Assistant, AssistantCreate
from ..services.assistant import create_assistant
from ..api.deps import get_current_user
from ..models.user import User

router = APIRouter()

# Directory where template YAML files are stored
TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"

@router.get("/", response_model=List[Dict[str, Any]])
async def list_templates() -> Any:
    """List all available assistant templates"""
    templates = []
    
    # Create templates directory if it doesn't exist
    if not TEMPLATES_DIR.exists():
        TEMPLATES_DIR.mkdir(parents=True)
        return templates
    
    # List all YAML files in the templates directory
    for file_path in TEMPLATES_DIR.glob("*.yaml"):
        try:
            with open(file_path, "r") as f:
                content = yaml.safe_load(f)
                
                # Extract basic info from the template
                template_info = {
                    "id": file_path.stem,
                    "title": content.get("metadata", {}).get("description", {}).get("title", "Untitled"),
                    "summary": content.get("metadata", {}).get("description", {}).get("summary", ""),
                    "educational_level": content.get("metadata", {}).get("description", {}).get("educational_level", []),
                    "use_cases": content.get("metadata", {}).get("description", {}).get("use_cases", []),
                    "keywords": content.get("metadata", {}).get("description", {}).get("keywords", [])
                }
                
                templates.append(template_info)
        except Exception as e:
            # Skip invalid templates
            continue
    
    return templates

@router.get("/{template_id}", response_model=Dict[str, Any])
async def get_template(template_id: str) -> Any:
    """Get a specific template by ID"""
    template_path = TEMPLATES_DIR / f"{template_id}.yaml"
    
    if not template_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    try:
        with open(template_path, "r") as f:
            yaml_content = f.read()
            content = yaml.safe_load(yaml_content)
            
            return {
                "id": template_id,
                "title": content.get("metadata", {}).get("description", {}).get("title", "Untitled"),
                "yaml_content": yaml_content
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading template: {str(e)}"
        )

@router.post("/{template_id}/clone", response_model=Assistant)
async def clone_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Clone a template into a new assistant"""
    template_path = TEMPLATES_DIR / f"{template_id}.yaml"
    
    if not template_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    try:
        with open(template_path, "r") as f:
            yaml_content = f.read()
            content = yaml.safe_load(yaml_content)
            
            title = content.get("metadata", {}).get("description", {}).get("title", "Untitled")
            
            # Create a new assistant based on the template
            assistant_in = AssistantCreate(
                title=f"{title} (from template)",
                yaml_content=yaml_content,
                is_public=False,
                tags=["template"]
            )
            
            return create_assistant(db, assistant_in=assistant_in, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cloning template: {str(e)}"
        )
