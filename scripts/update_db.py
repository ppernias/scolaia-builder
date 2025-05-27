#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para actualizar la estructura de la base de datos

Este script inicializa o actualiza la base de datos con las últimas modificaciones
en los modelos, incluyendo la nueva tabla de tokens revocados.
"""

import sys
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Añadir el directorio raíz al path para importar módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import init_db

def main():
    """
    Función principal que actualiza la base de datos
    """
    try:
        logger.info("Iniciando actualización de la base de datos...")
        init_db()
        logger.info("Base de datos actualizada correctamente.")
    except Exception as e:
        logger.error(f"Error al actualizar la base de datos: {e}")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
