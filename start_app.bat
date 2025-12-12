@echo off
echo ==========================================
echo Starting SyncDeck Application
echo ==========================================

:: Start Backend
echo Starting Backend Server...
start "SyncDeck Backend" cmd /k "uvicorn backend.main:app --reload"

:: Start Frontend
echo Starting Frontend Server...
cd frontend
start "SyncDeck Frontend" cmd /k "npm run dev"

echo ==========================================
echo Application started!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ==========================================
pause
