#!/bin/bash

# Script para iniciar el sistema ADLBuilder

echo "=== Iniciando el sistema ADLBuilder ==="

# Detener los procesos existentes si están en ejecución
echo "Verificando si hay procesos existentes..."
pkill -f "python3 -m uvicorn main:app" || true
pkill -f "python3 -m http.server 3000" || true

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

echo "=== Sistema ADLBuilder iniciado correctamente ==="
echo "Backend PID: $backend_pid"
echo "Frontend PID: $frontend_pid"
echo "Accede a la aplicación en: http://localhost:3000"
echo "Documentación API: http://localhost:8000/docs"

# Mantener el script en ejecución para que los procesos no se cierren
echo "Presiona Ctrl+C para detener todos los procesos"
wait
