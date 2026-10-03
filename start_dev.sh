#!/bin/bash

# Setup colors for log messages
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Handloom ERP Development Environment...${NC}"

# Start Main Backend (port 8000)
echo -e "${GREEN}Starting Main Backend on port 8000...${NC}"
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start CubeBook Backend (port 8001)
echo -e "${GREEN}Starting CubeBook Backend on port 8001...${NC}"
cd cubebook-back
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 &
CUBEBOOK_BACKEND_PID=$!

# Start Main Frontend (port 5173)
echo -e "${GREEN}Starting Main Frontend on port 5173...${NC}"
cd ../../frontend
npm run dev &
FRONTEND_PID=$!

# Start CubeBook Frontend (port 5174)
echo -e "${GREEN}Starting CubeBook Frontend on port 5174...${NC}"
cd cubebook-front
npm run dev &
CUBEBOOK_FRONTEND_PID=$!

echo -e "${GREEN}All services are running!${NC}"
echo "--------------------------------------------------"
echo "Main Frontend:      http://localhost:5173"
echo "Main Backend:       http://localhost:8000"
echo "CubeBook Frontend:  http://localhost:5174"
echo "CubeBook Backend:   http://localhost:8001"
echo "--------------------------------------------------"
echo "Press Ctrl+C to stop all services."

# Handle cleanup on exit
trap "echo -e '\nStopping all services...'; kill $BACKEND_PID $CUBEBOOK_BACKEND_PID $FRONTEND_PID $CUBEBOOK_FRONTEND_PID 2>/dev/null" EXIT
wait
