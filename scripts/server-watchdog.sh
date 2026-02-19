#!/bin/bash
#
# Server Watchdog - Keep Mission Control running
# Run this to ensure the dev server is always up
#

PORT=3005
PID_FILE="/tmp/mission-control.pid"

check_server() {
    curl -s http://localhost:$PORT/api/debug-auth > /dev/null 2>&1
    return $?
}

start_server() {
    echo "[$(date)] Starting Mission Control server..."
    cd /Users/gilesparnell/Documents/VSStudio/awe2m8-local
    
    # Kill any existing processes on the port
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    
    # Start fresh
    PORT=$PORT npm run dev > /tmp/mission-control.log 2>&1 &
    echo $! > $PID_FILE
    
    # Wait for it to be ready
    sleep 5
    
    if check_server; then
        echo "[$(date)] ✅ Server is running on http://localhost:$PORT"
        return 0
    else
        echo "[$(date)] ❌ Server failed to start"
        return 1
    fi
}

# Check if running
if check_server; then
    echo "[$(date)] ✅ Server is already running"
    exit 0
else
    echo "[$(date)] ⚠️  Server not responding, restarting..."
    start_server
fi
