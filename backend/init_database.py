# Script para inicializar la base de datos

import os
import sys
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def init_database():
    try:
        # Importar los mu00f3dulos necesarios
        from app.core.database import init_db
        
        # Inicializar la base de datos
        logger.info("Iniciando la inicializaciu00f3n de la base de datos...")
        init_db()
        logger.info("Base de datos inicializada correctamente.")
        
        return True
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {e}")
        return False

def reset_database():
    try:
        # Importar los mu00f3dulos necesarios
        from app.core.config import settings
        import sqlite3
        
        # Extraer la ruta del archivo de la base de datos
        db_path = settings.SQLITE_DATABASE_URL.replace('sqlite:///', '')
        
        # Si es una ruta relativa, convertirla a absoluta
        if not os.path.isabs(db_path):
            db_path = os.path.join(os.getcwd(), db_path)
        
        # Verificar si el archivo existe
        if os.path.exists(db_path):
            # Eliminar el archivo
            os.remove(db_path)
            logger.info(f"Archivo de base de datos eliminado: {db_path}")
        
        # Inicializar la base de datos nuevamente
        return init_database()
    except Exception as e:
        logger.error(f"Error al reiniciar la base de datos: {e}")
        return False

if __name__ == "__main__":
    # Verificar si se pasa el argumento --reset
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        logger.info("Reiniciando la base de datos...")
        success = reset_database()
    else:
        logger.info("Inicializando la base de datos...")
        success = init_database()
    
    # Salir con cu00f3digo de estado apropiado
    sys.exit(0 if success else 1)
