# #!/bin/bash
# # Script to set up and run the LMS application

# echo "Setting up LMS application..."

# # Navigate to backend directory
# cd backend

# # Check if virtual environment exists, create if not
# if [ ! -d "../.venv" ]; then
#     echo "Creating virtual environment..."
#     python -m venv ../.venv
# fi

# # Activate virtual environment
# source ../.venv/bin/activate

# # Install backend dependencies
# echo "Installing backend dependencies..."
# pip install -r requirements.txt

# # Navigate to frontend directory
# cd ../frontend

# # Install frontend dependencies
# echo "Installing frontend dependencies..."
# npm install

# echo "Setup complete!"
# echo "To run the application:"
# echo "1. In one terminal: cd backend && ../.venv/bin/python app.py"
# echo "2. In another terminal: cd frontend && npm run dev"
