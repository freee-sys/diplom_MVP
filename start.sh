#!/bin/bash

# Start backend
echo "Starting backend server..."
cd backend
pip install -r requirements.txt
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

# Keep scripts running
wait $BACKEND_PID $FRONTEND_PID
