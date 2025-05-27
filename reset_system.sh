#!/bin/bash

# Script para reiniciar completamente el sistema ADLBuilder

echo "=== Reiniciando el sistema ADLBuilder ==="

# Detener los procesos existentes
echo "Deteniendo procesos existentes..."
pkill -f "python3 -m uvicorn main:app" || true
pkill -f "python3 -m http.server 3000" || true

# Reiniciar la base de datos
echo "Reiniciando la base de datos..."
cd /root/adlbuilder/backend
python3 init_database.py --reset

if [ $? -ne 0 ]; then
    echo "Error al reiniciar la base de datos. Abortando."
    exit 1
fi

# Iniciar el backend
echo "Iniciando el backend..."
cd /root/adlbuilder/backend
python3 -m uvicorn main:app --host 0.0.0.0 --reload &
backend_pid=$!

# Esperar a que el backend esté listo
echo "Esperando a que el backend esté listo..."
sleep 5

# Iniciar el frontend
echo "Iniciando el frontend..."
cd /root/adlbuilder/frontend
python3 -m http.server 3000 &
frontend_pid=$!

echo "=== Sistema ADLBuilder reiniciado correctamente ==="
echo "Backend PID: $backend_pid"
echo "Frontend PID: $frontend_pid"
echo "Accede a la aplicación en: http://localhost:3000"

# Mantener el script en ejecución para que los procesos no se cierren
echo "Presiona Ctrl+C para detener todos los procesos"
wait
