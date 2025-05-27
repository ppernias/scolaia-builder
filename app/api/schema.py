from fastapi import APIRouter, HTTPException, Depends
import yaml
import os
import sys
from pathlib import Path
from sqlalchemy.orm import Session

from ..core.database import get_db
from .auth import get_current_active_user
from ..models.user import User

router = APIRouter()

@router.get("/")
async def get_schema(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene el esquema YAML para el editor de asistentes"""
    try:
        print(f"Schema requested by user: {current_user.email} (ID: {current_user.id})")
        
        # Try multiple possible locations for the schema file
        possible_paths = [
            # Direct path from current file
            Path(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..', 'schema.yaml'))),
            # Absolute path from root
            Path('/root/adlbuilder/schema.yaml'),
            # Path relative to current working directory
            Path(os.path.join(os.getcwd(), 'schema.yaml')),
        ]
        
        schema_path = None
        for path in possible_paths:
            print(f"Checking schema path: {path}")
            if path.exists():
                schema_path = path
                print(f"Found schema file at: {schema_path}")
                break
        
        if not schema_path:
            paths_tried = '\n'.join([str(p) for p in possible_paths])
            error_msg = f"Schema file not found. Tried the following paths:\n{paths_tried}"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        print(f"Schema file exists, size: {os.path.getsize(schema_path)} bytes")
        
        # Leer y parsear el archivo YAML con mejor manejo de errores
        try:
            with open(schema_path, "r", encoding='utf-8') as file:
                content = file.read()
                print(f"Read {len(content)} bytes from schema file")
                
                if not content.strip():
                    raise ValueError("Schema file is empty")
                    
                schema = yaml.safe_load(content)
                
                if not schema:
                    raise ValueError("Schema parsed as None or empty object")
                    
                print(f"Schema parsed successfully, top-level keys: {list(schema.keys())}")
                return schema
                
        except yaml.YAMLError as yaml_err:
            error_msg = f"YAML parsing error: {str(yaml_err)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
            
        except Exception as file_err:
            error_msg = f"Error reading schema file: {str(file_err)}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
            
    except HTTPException:
        # Re-raise HTTP exceptions as they already have the proper format
        raise
        
    except Exception as e:
        print(f"Unexpected error loading schema: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading schema: {str(e)}")

