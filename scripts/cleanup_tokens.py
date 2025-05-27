#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para limpiar tokens expirados de la lista negra

Este script elimina los tokens expirados de la base de datos para mantenerla optimizada.
Se recomienda ejecutarlo periódicamente mediante un cron job o tarea programada.
"""

import sys
import os
import logging
import argparse
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Añadir el directorio raíz al path para importar módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.services.token import clean_expired_tokens

def main():
    """
    Función principal que limpia los tokens expirados
    """
    parser = argparse.ArgumentParser(description='Limpiar tokens expirados de la lista negra')
    parser.add_argument('--verbose', '-v', action='store_true', help='Mostrar información detallada')
    args = parser.parse_args()
    
    try:
        logger.info("Iniciando limpieza de tokens expirados...")
        db = SessionLocal()
        
        # Limpiar tokens expirados
        count = clean_expired_tokens(db)
        
        if args.verbose:
            now = datetime.utcnow()
            logger.info(f"Fecha y hora actual: {now}")
        
        logger.info(f"Se eliminaron {count} tokens expirados de la lista negra.")
        logger.info("Limpieza completada correctamente.")
    except Exception as e:
        logger.error(f"Error al limpiar tokens expirados: {e}")
        return 1
    finally:
        db.close()
    return 0

if __name__ == "__main__":
    sys.exit(main())
