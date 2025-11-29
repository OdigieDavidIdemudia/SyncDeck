@echo off
echo ==========================================
echo Starting Task Tracker Application
echo ==========================================

:: Start Backend
echo Starting Backend Server...
start "Task Tracker Backend" cmd /k "uvicorn backend.main:app --reload"

:: Start Frontend
echo Starting Frontend Server...
cd frontend
start "Task Tracker Frontend" cmd /k "npm run dev"

echo ==========================================
echo Application started!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ==========================================
pause
