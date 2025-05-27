import yaml
import jsonschema
from typing import Dict, Any, Tuple, List, Optional
from pathlib import Path

from ..core.config import settings

def load_schema() -> Dict[str, Any]:
    """Load the schema.yaml file"""
    with open(settings.SCHEMA_PATH, 'r') as f:
        return yaml.safe_load(f)

def validate_yaml(yaml_content: str) -> Tuple[bool, Optional[List[str]]]:
    """Validate YAML content against the schema
    
    Args:
        yaml_content: YAML string to validate
        
    Returns:
        Tuple containing:
        - bool: True if valid, False otherwise
        - Optional[List[str]]: List of error messages if invalid, None if valid
    """
    try:
        # Parse YAML content
        yaml_data = yaml.safe_load(yaml_content)
        
        # Load schema
        schema = load_schema()
        
        # Validate against schema
        jsonschema.validate(instance=yaml_data, schema=schema)
        
        return True, None
    except yaml.YAMLError as e:
        return False, [f"YAML parsing error: {str(e)}"]
    except jsonschema.exceptions.ValidationError as e:
        # Format error message for better readability
        path = " > ".join([str(p) for p in e.path])
        message = f"Validation error at '{path}': {e.message}"
        return False, [message]
    except Exception as e:
        return False, [f"Unexpected error: {str(e)}"]
