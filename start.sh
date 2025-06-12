#!/bin/bash

echo "Stopping any running instances of ADLMaker..."
# Buscar y detener procesos uvicorn existentes
pkill -f "uvicorn app.main:app" || echo "No running instances found."

# Esperar un momento para asegurar que los procesos se detengan
sleep 1

echo "Starting ADLMaker..."
# Activar entorno virtual
source venv/bin/activate

# Iniciar la aplicación
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
