#!/bin/bash

# Host ML Model Script
# This script starts the API server to host the latest trained ML model

# Exit immediately if a command exits with a non-zero status
set -e

# Set working directory to the script location
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Python virtual environment not found. Please run train_ml_model.sh first."
    exit 1
fi

# Check if model exists
if [ ! -f "models/refund_prediction_model_latest.joblib" ]; then
    echo "ML model not found. Please run train_ml_model.sh first to train the model."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Ensure dependencies are installed
echo "Checking Python dependencies..."
pip install -r requirements.txt > /dev/null

# Start the API server
echo "Starting ML API server..."
python src/main.py --mode api

# Note: The API server will run in the foreground until stopped with Ctrl+C