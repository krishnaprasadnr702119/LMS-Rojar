#!/usr/bin/env python3
"""
Script to check if the backend is running and start it if needed
"""
import os
import sys
import socket
import subprocess
import time
import signal
import psutil

# Configuration
BACKEND_PORT = 5000
BACKEND_HOST = '127.0.0.1'
BACKEND_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.py')
CHECK_INTERVAL = 2  # seconds

def is_port_in_use(port, host='127.0.0.1'):
    """Check if a port is in use by trying to bind to it"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((host, port))
            return False
        except socket.error:
            return True

def find_process_using_port(port):
    """Find the process using a given port"""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            connections = proc.connections()
            for conn in connections:
                if conn.laddr.port == port:
                    return proc
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            pass
    return None

def is_backend_running():
    """Check if the backend is already running"""
    # Method 1: Check if port is in use
    if is_port_in_use(BACKEND_PORT, BACKEND_HOST):
        print(f"✅ Backend appears to be running on port {BACKEND_PORT}")
        return True
    
    print(f"❌ Backend is NOT running on port {BACKEND_PORT}")
    return False

def start_backend():
    """Start the Flask backend"""
    print(f"🚀 Starting backend from {BACKEND_SCRIPT}...")
    
    # Check if app.py exists
    if not os.path.exists(BACKEND_SCRIPT):
        print(f"❌ ERROR: Backend script not found at {BACKEND_SCRIPT}")
        sys.exit(1)

    # Set up the Python executable path
    python_executable = sys.executable
    
    # Start the backend process
    try:
        # Use nohup to keep the process running even if this script exits
        backend_process = subprocess.Popen(
            [python_executable, BACKEND_SCRIPT],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=os.environ.copy(),
            # Detach the process so it continues running after this script ends
            start_new_session=True
        )
        
        print(f"⏳ Backend process started with PID {backend_process.pid}")
        print(f"⏳ Waiting for backend to be ready...")
        
        # Wait for the backend to start (poll the port)
        timeout = 30  # seconds
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            time.sleep(1)
            if is_port_in_use(BACKEND_PORT, BACKEND_HOST):
                print(f"✅ Backend is now running on port {BACKEND_PORT}")
                return True
            print(".", end="", flush=True)
            
            # Check if the process has exited
            if backend_process.poll() is not None:
                stdout, stderr = backend_process.communicate()
                print(f"\n❌ Backend process exited with code {backend_process.returncode}")
                print(f"STDOUT: {stdout.decode('utf-8', errors='replace')}")
                print(f"STDERR: {stderr.decode('utf-8', errors='replace')}")
                return False
        
        print(f"\n⚠️ Timeout waiting for backend to start on port {BACKEND_PORT}")
        return False
        
    except Exception as e:
        print(f"❌ Failed to start backend: {str(e)}")
        return False

def stop_backend():
    """Stop the backend if it's running"""
    proc = find_process_using_port(BACKEND_PORT)
    if proc:
        print(f"⏹️ Stopping backend process (PID {proc.pid})...")
        try:
            proc.terminate()
            proc.wait(timeout=5)
            print("✅ Backend stopped")
            return True
        except Exception as e:
            print(f"❌ Failed to stop backend gracefully: {str(e)}")
            try:
                proc.kill()
                print("✅ Backend killed")
                return True
            except Exception as e:
                print(f"❌ Failed to kill backend: {str(e)}")
                return False
    else:
        print("❓ No backend process found to stop")
        return True

def main():
    # Check if arguments were provided
    if len(sys.argv) > 1:
        if sys.argv[1] == "stop":
            stop_backend()
            sys.exit(0)
        elif sys.argv[1] == "restart":
            stop_backend()
            time.sleep(1)
            if not is_backend_running():
                start_backend()
            sys.exit(0)
    
    # Default: check and start if needed
    if not is_backend_running():
        print("🔄 Backend is not running, starting it now...")
        start_backend()
    else:
        print("✅ Backend is already running")

if __name__ == "__main__":
    main()
