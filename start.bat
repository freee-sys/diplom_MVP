@echo off
REM Start backend
echo Starting backend server...
cd backend
pip install -r requirements.txt
start python app.py

REM Wait for backend to start
timeout /t 3

REM Start frontend
echo Starting frontend...
cd ..\frontend
npm install
npm start

pause
