#!/bin/bash

echo "=== Starting Bloom Project ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd "$(dirname "$0")/server"
npm install
if [ $? -ne 0 ]; then
  echo "Backend npm install failed"
  exit 1
fi

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd "$(dirname "$0")/frontend"
npm install
if [ $? -ne 0 ]; then
  echo "Frontend npm install failed"
  exit 1
fi

# Start backend in background
echo -e "${GREEN}Starting backend server on port 4000...${NC}"
cd "$(dirname "$0")/server"
npm run dev > /tmp/bloom-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo ""

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting frontend server on port 8080...${NC}"
cd "$(dirname "$0")/frontend"
npm run dev > /tmp/bloom-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
echo ""

echo -e "${GREEN}=== Project Started ===${NC}"
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:8080"
echo ""
echo "Logs:"
echo "  Backend:  /tmp/bloom-backend.log"
echo "  Frontend: /tmp/bloom-frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
