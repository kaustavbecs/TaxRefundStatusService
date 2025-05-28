#!/bin/bash

# Train ML Model Script
# This script runs the ETL process and trains the ML model

# Exit immediately if a command exits with a non-zero status
set -e

# Set working directory to the script location
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# Create necessary directories
mkdir -p data/raw data/processed models

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Ensure pip and setuptools are up to date
echo "Updating pip and setuptools..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Store the original directory
ML_ETL_DIR="$(pwd)"

# Initialize the online database first
echo "Initializing online database..."
cd ../service && npm run init-db

# Return to the ml_etl directory
cd "$ML_ETL_DIR"
echo "Current directory: $(pwd)"

# Run the ETL and training steps
echo "Running ETL process..."
python "$ML_ETL_DIR/src/main.py" --mode etl

echo "Training ML model..."
python "$ML_ETL_DIR/src/main.py" --mode train

echo "ML model training completed successfully"