#!/bin/bash

# Start ML ETL and API services
# This script runs the ETL process and starts the API server

# Exit immediately if a command exits with a non-zero status
set -e

# Set working directory to the script location
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# Create necessary directories
mkdir -p ml_etl/data/raw ml_etl/data/processed ml_etl/models

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "ml_etl/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv ml_etl/venv
fi

# Activate virtual environment
source ml_etl/venv/bin/activate

# Ensure pip and setuptools are up to date
echo "Updating pip and setuptools..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "Installing Python dependencies..."
pip install -r ml_etl/requirements.txt

# Initialize the online database first
echo "Initializing online database..."
cd service && npm run init-db && cd ..

# Run the complete pipeline with all steps
echo "Running ML ETL pipeline..."
python ml_etl/src/main.py --mode all

echo "ML services setup completed successfully"