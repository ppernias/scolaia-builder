import os
import logging
from pathlib import Path
from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Asegurar que el directorio para la base de datos existe
def ensure_db_directory_exists():
    # Extraer la ruta del archivo de la URL de la base de datos
    db_path = settings.SQLITE_DATABASE_URL.replace('sqlite:///', '')
    
    # Si es una ruta relativa, convertirla a absoluta
    if not os.path.isabs(db_path):
        db_path = os.path.join(os.getcwd(), db_path)
    
    # Obtener el directorio que contiene el archivo de la base de datos
    db_dir = os.path.dirname(db_path)
    
    # Crear el directorio si no existe
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
        logger.info(f"Directorio para la base de datos creado: {db_dir}")
    
    return db_path

# Asegurar que el directorio existe
db_file_path = ensure_db_directory_exists()

# Crear el motor de la base de datos
engine = create_engine(
    settings.SQLITE_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Crear la sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crear la base para los modelos
Base = declarative_base()

# Función para inicializar la base de datos
def init_db():
    # Importar todos los modelos aquí para que SQLAlchemy los conozca
    from ..models import user, assistant
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    logger.info("Base de datos inicializada correctamente")
    
    # Verificar si las tablas se crearon correctamente
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    logger.info(f"Tablas creadas: {tables}")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
