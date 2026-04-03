@echo off
echo ============================================
echo  PASHIMITRA - Karnataka Govt Livestock AI
echo ============================================
echo.

echo [1/3] Starting Python AI Service on port 8001...
start "Pashimitra AI Service" cmd /k "cd /d %~dp0backend\ai_service && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 4 /nobreak >nul

echo [2/3] Starting Node.js Backend on port 5000...
start "Pashimitra Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React Frontend...
start "Pashimitra Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo  All services starting...
echo  Frontend  : http://localhost:5173
echo  Backend   : http://localhost:5000
echo  AI Service: http://localhost:8001/docs
echo ============================================
echo.
pause
