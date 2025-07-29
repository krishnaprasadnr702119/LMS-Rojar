#!/bin/bash

# Start LMS Development Environment
# This script starts both backend and frontend servers

# Colors for console output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}======================================${RESET}"
echo -e "${BLUE}    Starting LMS Development Environment    ${RESET}"
echo -e "${BLUE}======================================${RESET}"

# Set base directory to the script location
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

# Ensure backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${RESET}"
    exit 1
fi

# Ensure frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${RESET}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.${RESET}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js.${RESET}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${RESET}"
    exit 1
fi

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    if command -v lsof &> /dev/null; then
        if lsof -i :$port -t &> /dev/null; then
            return 0  # Port is in use
        else
            return 1  # Port is not in use
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            return 0  # Port is in use
        else
            return 1  # Port is not in use
        fi
    else
        # No tools to check, assume it's free
        return 1
    fi
}

# Check and install Python dependencies
echo -e "${YELLOW}📦 Checking and installing Python dependencies...${RESET}"
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
VENV_DIR="$BACKEND_DIR/venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}🔨 Creating Python virtual environment...${RESET}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create Python virtual environment.${RESET}"
        exit 1
    fi
fi

# Activate virtual environment
echo -e "${YELLOW}🔄 Activating Python virtual environment...${RESET}"
source "$VENV_DIR/bin/activate"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to activate Python virtual environment.${RESET}"
    exit 1
fi

# Install Python dependencies if requirements.txt exists
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    echo -e "${YELLOW}📦 Installing Python dependencies...${RESET}"
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}⚠️ Failed to install some Python dependencies.${RESET}"
        # Continue anyway, as some might have been installed
    fi
else
    echo -e "${YELLOW}⚠️ No requirements.txt found. Installing essential packages...${RESET}"
    pip install flask flask_cors flask_sqlalchemy psycopg2-binary PyJWT python-dotenv
fi

# Install npm dependencies
echo -e "${YELLOW}📦 Installing npm dependencies...${RESET}"
cd "$FRONTEND_DIR"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}⚠️ Failed to install npm dependencies.${RESET}"
    # Continue anyway, as some might have been installed
fi

# Create .env file if it doesn't exist (copy from example)
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${RESET}"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo -e "${GREEN}✅ Created .env file. Please edit it with your settings.${RESET}"
fi

# Create uploads directory if it doesn't exist
UPLOADS_DIR="$BACKEND_DIR/uploads"
if [ ! -d "$UPLOADS_DIR" ]; then
    echo -e "${YELLOW}📁 Creating uploads directory...${RESET}"
    mkdir -p "$UPLOADS_DIR/courses"
    echo -e "${GREEN}✅ Created uploads directory.${RESET}"
fi

# Start backend
echo -e "${YELLOW}🚀 Starting backend server...${RESET}"
cd "$BACKEND_DIR"

# Use the Python script to start the backend
python3 start_backend.py

# Wait a moment for the backend to start
echo -e "${YELLOW}⏳ Waiting for backend to be fully ready...${RESET}"
sleep 2

# Check if backend is running
if is_port_in_use 5000; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:5000${RESET}"
else
    echo -e "${RED}❌ Backend failed to start on port 5000. Check logs for errors.${RESET}"
    # Try starting it directly for debugging
    echo -e "${YELLOW}🔄 Attempting to start backend directly for debugging...${RESET}"
    python3 app.py &
    sleep 2
fi

# Start frontend
echo -e "${YELLOW}🚀 Starting frontend development server...${RESET}"
cd "$FRONTEND_DIR"
npm run dev &

# Store the process ID
FRONTEND_PID=$!

echo -e "${GREEN}✅ Frontend development server started${RESET}"
echo -e "${GREEN}✅ Visit http://localhost:5173 in your browser${RESET}"
echo -e "${BLUE}======================================${RESET}"
echo -e "${YELLOW}🔄 Press Ctrl+C to stop both servers${RESET}"

# Function to clean up on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${RESET}"
    # Kill frontend process
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Stop backend
    cd "$BACKEND_DIR"
    python3 start_backend.py stop
    
    echo -e "${GREEN}✅ All servers stopped${RESET}"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done
