#!/bin/bash

# Activar entorno virtual
source venv/bin/activate

# Iniciar la aplicación
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
