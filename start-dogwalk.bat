@echo off
setlocal
cd /d "%~dp0"
title Dogwalk Launcher

echo [1/4] Starting OSRM...
where docker >nul 2>&1 || (echo Docker CLI not found. & pause & exit /b 1)
docker compose up -d osrm-routed || (echo OSRM failed. Check Docker Desktop and osrm/data. & pause & exit /b 1)

echo [2/4] Starting FastAPI...
if exist "backend\api-python\.venv\Scripts\python.exe" (
  set "PYTHON_EXE=%CD%\backend\api-python\.venv\Scripts\python.exe"
) else if exist "backend\api-python\venv\Scripts\python.exe" (
  set "PYTHON_EXE=%CD%\backend\api-python\venv\Scripts\python.exe"
) else (
  set "PYTHON_EXE=python"
)
start "Dogwalk FastAPI" cmd /k "cd /d ""%CD%\backend\api-python"" && ""%PYTHON_EXE%"" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [3/4] Starting Node.js API...
where node >nul 2>&1 || (echo Node.js not found. & pause & exit /b 1)
start "Dogwalk Node API" cmd /k "cd /d ""%CD%\backend\walk-backend"" && node server.js"

echo [4/4] Starting Expo...
where npx >nul 2>&1 || (echo npx not found. & pause & exit /b 1)
start "Dogwalk Expo" cmd /k "cd /d ""%CD%\frontend"" && npx expo start"

echo.
echo Servers launched in separate windows.
echo Check each window for errors. This script does not install dependencies.
echo Set frontend/config/config.js SERVER_HOST to your laptop's current IPv4 address.
pause