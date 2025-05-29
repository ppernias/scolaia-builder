from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import URL
from sqlalchemy.orm import Session
import os
from pathlib import Path

class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if "X-Forwarded-Proto" in request.headers:
            request.scope["scheme"] = request.headers["X-Forwarded-Proto"]
        
        if "X-Forwarded-Host" in request.headers:
            request.scope["headers"] = [
                (k, v) if k != b"host" else (b"host", request.headers["X-Forwarded-Host"].encode())
                for k, v in request.scope["headers"]
            ]
        
        response = await call_next(request)
        return response

# Importar módulos de la aplicación
from app.core.config import settings
from app.core.database import get_db, Base, engine, init_db
from app.api import auth, users, assistants, validate, templates as template_api, admin, schema

# Inicializar la base de datos (crear tablas si no existen)
init_db()

# Inicializar la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar middlewares
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[settings.ALLOWED_HOSTS] if settings.ALLOWED_HOSTS else ["*"]
)

app.add_middleware(ProxyHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"https://{settings.ALLOWED_HOSTS}", f"http://{settings.ALLOWED_HOSTS}"] if settings.ALLOWED_HOSTS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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
app.include_router(schema.router, prefix=f"{settings.API_V1_STR}/schema", tags=["schema"])

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
