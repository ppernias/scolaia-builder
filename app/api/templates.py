from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Dict
import os
import yaml

from ..core.database import get_db
from ..schemas.assistant import Assistant

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_templates() -> Any:
    """Get all available templates"""
    templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    templates = []
    
    # Ensure directory exists
    if not os.path.exists(templates_dir):
        os.makedirs(templates_dir)
        return templates
    
    # List all YAML files in templates directory
    for filename in os.listdir(templates_dir):
        if filename.endswith(".yaml") or filename.endswith(".yml"):
            try:
                filepath = os.path.join(templates_dir, filename)
                with open(filepath, "r") as f:
                    content = f.read()
                    yaml_data = yaml.safe_load(content)
                    
                    # Extract metadata
                    title = yaml_data.get("metadata", {}).get("description", {}).get("title", filename)
                    description = yaml_data.get("metadata", {}).get("description", {}).get("summary", "")
                    tags = yaml_data.get("metadata", {}).get("tags", [])
                    
                    templates.append({
                        "id": filename.replace(".yaml", "").replace(".yml", ""),
                        "title": title,
                        "description": description,
                        "tags": tags,
                        "content": content
                    })
            except Exception as e:
                # Skip invalid templates
                continue
    
    return templates

@router.get("/{template_id}", response_model=Dict[str, Any])
async def get_template(template_id: str) -> Any:
    """Get a specific template by ID"""
    templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    
    # Try both .yaml and .yml extensions
    for ext in [".yaml", ".yml"]:
        filepath = os.path.join(templates_dir, f"{template_id}{ext}")
        if os.path.exists(filepath):
            try:
                with open(filepath, "r") as f:
                    content = f.read()
                    yaml_data = yaml.safe_load(content)
                    
                    # Extract metadata
                    title = yaml_data.get("metadata", {}).get("description", {}).get("title", template_id)
                    description = yaml_data.get("metadata", {}).get("description", {}).get("summary", "")
                    tags = yaml_data.get("metadata", {}).get("tags", [])
                    
                    return {
                        "id": template_id,
                        "title": title,
                        "description": description,
                        "tags": tags,
                        "content": content
                    }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error reading template: {str(e)}"
                )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Template not found"
    )
