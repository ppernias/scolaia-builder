import yaml
import json
import jsonschema
from typing import Tuple, List, Dict, Any
import os

from ..core.config import settings

def load_schema() -> Dict[str, Any]:
    """Carga el esquema YAML desde el archivo"""
    try:
        with open(settings.SCHEMA_PATH, 'r') as f:
            schema = yaml.safe_load(f)
        return schema
    except Exception as e:
        raise Exception(f"Error al cargar el esquema: {str(e)}")

def validate_yaml(yaml_content: str) -> Tuple[bool, List[str]]:
    """Valida el contenido YAML contra el esquema"""
    errors = []
    
    try:
        # Cargar el contenido YAML
        content = yaml.safe_load(yaml_content)
        
        # Cargar el esquema
        schema = load_schema()
        
        # Validar contra el esquema
        jsonschema.validate(content, schema)
        
        return True, []
    except yaml.YAMLError as e:
        errors.append(f"Error de formato YAML: {str(e)}")
        return False, errors
    except jsonschema.exceptions.ValidationError as e:
        errors.append(f"Error de validación contra el esquema: {e.message}")
        return False, errors
    except Exception as e:
        errors.append(f"Error inesperado: {str(e)}")
        return False, errors
