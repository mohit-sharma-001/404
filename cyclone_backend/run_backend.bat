@echo off
echo Starting VayuNetra Cyclone AI Backend Server...
cd /d "%~dp0"
set PYTHONPATH=.
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
