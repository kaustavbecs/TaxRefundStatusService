#!/bin/bash

# Script to drop both online and offline databases
# This script only drops the databases, you need to run other scripts manually

# Exit immediately if a command exits with a non-zero status
set -e

# Set working directory to the script location
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# Define database paths
OFFLINE_DB_PATH="data/processed/tax_refund_analytics.db"
SERVICE_DB_PATH="../service/db/tax_refund.db"

echo "=== Dropping databases ==="

# Drop offline database
if [ -f "$OFFLINE_DB_PATH" ]; then
    echo "Removing offline database: $OFFLINE_DB_PATH"
    rm -f "$OFFLINE_DB_PATH"
    echo "Offline database removed"
else
    echo "Offline database not found at: $OFFLINE_DB_PATH"
fi

# Drop online database
if [ -f "$SERVICE_DB_PATH" ]; then
    echo "Removing online database: $SERVICE_DB_PATH"
    rm -f "$SERVICE_DB_PATH"
    echo "Online database removed"
else
    echo "Online database not found at: $SERVICE_DB_PATH"
fi

echo "Databases dropped successfully"
echo "Next steps:"
echo "1. Initialize service database: cd ../service && npm run init-db"
echo "2. Run ETL and train ML model: ./train_ml_model.sh"
echo "3. Host ML model: ./host_ml_model.sh"