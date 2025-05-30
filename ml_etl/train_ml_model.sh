#!/bin/bash

# Train ML Model Script (New Version)
# This script runs the ETL process and trains the ML model using the new database schema

# Exit immediately if a command exits with a non-zero status
set -e

# Set working directory to the script location
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# Create necessary directories
mkdir -p data/raw data/processed models logs

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

# Initialize the database schema
echo "Initializing database schema..."
if [ -f "$ML_ETL_DIR/data/schema.sql" ]; then
    # Create the database directory if it doesn't exist
    mkdir -p "$ML_ETL_DIR/data/processed"
    
    # Check if the database already exists
    if [ ! -f "$ML_ETL_DIR/data/processed/tax_refund_analytics.db" ]; then
        echo "Creating new analytics database..."
        sqlite3 "$ML_ETL_DIR/data/processed/tax_refund_analytics.db" < "$ML_ETL_DIR/data/schema.sql"
    else
        echo "Analytics database already exists, applying schema updates..."
        sqlite3 "$ML_ETL_DIR/data/processed/tax_refund_analytics.db" < "$ML_ETL_DIR/data/schema.sql"
    fi
else
    echo "Schema file not found, will create tables during ETL process"
fi

# Initialize the online database first
echo "Initializing online database..."
cd ../service && npm run init-db

# Return to the ml_etl directory
cd "$ML_ETL_DIR"
echo "Current directory: $(pwd)"

# Run the ETL process
echo "Running ETL process..."
if [ -f "$ML_ETL_DIR/src/main_new.py" ]; then
    python "$ML_ETL_DIR/src/main_new.py" --mode etl
else
    python "$ML_ETL_DIR/src/main.py" --mode etl
fi

# Run the model monitoring process (if available)
echo "Running model monitoring..."
if [ -f "$ML_ETL_DIR/src/main_new.py" ]; then
    python "$ML_ETL_DIR/src/main_new.py" --mode monitor
fi

# Train the ML model
echo "Training ML model..."
if [ -f "$ML_ETL_DIR/src/main_new.py" ]; then
    python "$ML_ETL_DIR/src/main_new.py" --mode train
else
    python "$ML_ETL_DIR/src/main.py" --mode train
fi

echo "ML model training completed successfully"