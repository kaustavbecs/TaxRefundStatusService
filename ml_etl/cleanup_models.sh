#!/bin/bash

# Script to clean up old model artifacts
# This script removes old model files and database entries to start fresh

# Exit immediately if a command exits with a non-zero status
set -e

# Set working directory to the script location
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# Define paths
MODELS_DIR="./models"
DB_PATH="./data/processed/tax_refund_analytics.db"

echo "Cleaning up old model artifacts..."

# Remove model files
if [ -d "$MODELS_DIR" ]; then
    echo "Removing model files from $MODELS_DIR"
    rm -f "$MODELS_DIR"/refund_prediction_model_*.joblib
    rm -f "$MODELS_DIR"/model_metadata_*.json
    rm -f "$MODELS_DIR"/refund_prediction_model_latest.joblib
    rm -f "$MODELS_DIR"/model_metadata_latest.json
else
    echo "Models directory not found, creating it"
    mkdir -p "$MODELS_DIR"
fi

# Clean up database entries if the database exists
if [ -f "$DB_PATH" ]; then
    echo "Cleaning up model entries from database"
    sqlite3 "$DB_PATH" <<EOF
-- Delete model-related records from tables
DELETE FROM MLModels;
DELETE FROM ModelPerformance;
DELETE FROM FeatureDrift;
DELETE FROM RetrainingDecisions;
EOF
    echo "Database entries cleaned"
else
    echo "Database not found, it will be created during training"
fi

echo "Cleanup completed successfully"