from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from pathlib import Path

# Importar módulos de la aplicación
from app.core.config import settings
from app.core.database import get_db, Base, engine, init_db
from app.api import auth, users, assistants, validate, templates as template_api, admin

# Inicializar la base de datos (crear tablas si no existen)
init_db()

# Inicializar la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Configurar plantillas Jinja2
templates = Jinja2Templates(directory="app/templates")

# Incluir routers para la API
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(assistants.router, prefix=f"{settings.API_V1_STR}/assistants", tags=["assistants"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(validate.router, prefix=f"{settings.API_V1_STR}/validate", tags=["validation"])
app.include_router(template_api.router, prefix=f"{settings.API_V1_STR}/templates", tags=["templates"])

# Crear directorio de plantillas si no existe
os.makedirs(os.path.join(os.path.dirname(__file__), "templates"), exist_ok=True)

# Ruta principal - Renderizar la página de inicio
@app.get("/", tags=["pages"])
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Ruta para verificar el estado de la aplicación
@app.get("/health", tags=["system"])
async def health_check(db: Session = Depends(get_db)):
    # Intentar ejecutar una consulta simple para verificar la conexión a la base de datos
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status,
        "version": settings.PROJECT_NAME + " v1.0.0"
    }

# Iniciar la aplicación con Uvicorn si se ejecuta directamente
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
