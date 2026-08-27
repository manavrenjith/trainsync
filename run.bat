@echo off
echo ========================================================
echo Starting KMRL AI Train Induction System...
echo ========================================================

echo Seeding database...
set PYTHONPATH=backend
python backend/app/data/seed.py

echo Launching FastAPI Backend Server on http://localhost:8000...
start cmd /k "set PYTHONPATH=backend && uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --reload"

echo Launching Vite React Dashboard on http://localhost:3000...
cd frontend
npm run dev -- --port 3000
