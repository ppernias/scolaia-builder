# ADLBuilder - Assistant Definition Language Builder

ADLBuilder es una aplicación web para crear y gestionar configuraciones de asistentes en formato YAML, siguiendo un esquema definido. Permite a los usuarios crear, editar, guardar y compartir definiciones de asistentes de manera estructurada.

## Características principales

- **Editor dual**: Modo simple para edición básica y modo avanzado para control total
- **Validación YAML**: Validación en tiempo real contra el esquema definido
- **Autenticación de usuarios**: Registro y login para guardar asistentes personales
- **Biblioteca de plantillas**: Colección de plantillas predefinidas para comenzar rápidamente
- **Importación/Exportación**: Soporte para importar y exportar archivos YAML
- **Arquitectura unificada**: Un solo servidor FastAPI que sirve tanto el backend como el frontend

## Estructura del proyecto

```
adlbuilder/
├── app/                           # Aplicación principal
│   ├── api/                       # HTTP endpoints (REST)
│   ├── core/                      # Configuración, DB, etc.
│   ├── services/                  # Lógica de negocio
│   ├── schemas/                   # Modelos Pydantic
│   ├── models/                    # Modelos SQLAlchemy
│   ├── static/                    # Archivos estáticos
│   │   ├── css/                   # Estilos
│   │   ├── js/                    # Módulos JavaScript
│   │   └── assets/                # Imágenes y otros recursos
│   ├── templates/                 # Plantillas HTML
│   └── main.py                    # Punto de entrada FastAPI
├── schema.yaml                    # Esquema ADL canónico
├── requirements.txt               # Dependencias Python
└── README.md                      # Documentación
```

## Requisitos

- Python 3.8+
- SQLite (o PostgreSQL para producción)

## Instalación y ejecución

### Instalación manual

1. Clona el repositorio:
   ```bash
   git clone https://github.com/yourusername/adlbuilder.git
   cd adlbuilder
   ```

2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Inicia la aplicación:
   ```bash
   uvicorn app.main:app --reload
   ```

4. Accede a la aplicación en http://localhost:8080

### Arranque del sistema

Para arrancar el sistema, simplemente ejecuta:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Esto iniciará el servidor FastAPI que sirve tanto el backend como el frontend en el puerto 8080 y estará accesible desde cualquier interfaz de red.

### Verificación del sistema

- Aplicación web: http://localhost:8000
- Documentación API: http://localhost:8000/docs (Swagger UI)

El sistema está correctamente iniciado cuando puedes acceder a la aplicación web.

## Desarrollo

### Servidor

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Base de datos

La aplicación está configurada para inicializar automáticamente la base de datos al arrancar. Esto significa que:

- La base de datos SQLite se crea automáticamente si no existe
- Las tablas necesarias se crean automáticamente al iniciar la aplicación
- El primer usuario que se registra recibe automáticamente privilegios de administrador
- El administrador puede gestionar usuarios desde el panel de administración

Para reiniciar manualmente la base de datos durante el desarrollo:

```bash
cd backend
python3 init_database.py --reset
```

### Frontend

El frontend utiliza HTML, CSS y JavaScript vanilla y es servido por FastAPI. Para modificar el frontend, edita los archivos en los directorios `app/static` y `app/templates` y recarga el navegador.

## Internacionalización (i18n)

La aplicación está preparada para soportar múltiples idiomas en el futuro. Actualmente, solo se incluye el idioma inglés, pero la estructura está diseñada para facilitar la adición de nuevos idiomas.

## Licencia

MIT
