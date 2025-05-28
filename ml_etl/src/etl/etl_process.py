#!/usr/bin/env python3
"""
ETL Process for Tax Refund Status Service

This script extracts data from the online database, transforms it to calculate
statistics for refund processing times, and loads it into the offline database
for ML model training.
"""

import os
import uuid
import logging
import sqlite3
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database paths
# Use absolute path to ensure the database can be found regardless of where the script is run from
ONLINE_DB_PATH = os.environ.get('ONLINE_DB_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../service/db/tax_refund.db')))
OFFLINE_DB_PATH = os.environ.get('OFFLINE_DB_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/data/processed/tax_refund_analytics.db')))

# Ensure directories exist
os.makedirs(os.path.dirname(OFFLINE_DB_PATH), exist_ok=True)

# Print paths for debugging
print(f"Online DB path: {ONLINE_DB_PATH}")
print(f"Offline DB path: {OFFLINE_DB_PATH}")

# SQL queries
EXTRACT_EVENTS_QUERY = """
SELECT 
    tpe1.TaxFileID,
    tpe1.OldStatus as SourceStatus,
    tpe1.NewStatus as TargetStatus,
    tpe1.StatusUpdateDate as SourceDate,
    tpe2.StatusUpdateDate as TargetDate,
    tpe1.ProcessingCenter,
    tf.FilingType,
    tf.TaxYear,
    tf.TaxCategories,
    tf.DeductionCategories,
    tf.ClaimedRefundAmount,
    tf.GeographicRegion
FROM 
    TaxProcessingEvents tpe1
JOIN 
    TaxProcessingEvents tpe2 ON tpe1.TaxFileID = tpe2.TaxFileID AND tpe1.NewStatus = tpe2.OldStatus
JOIN 
    TaxFiles tf ON tpe1.TaxFileID = tf.TaxFileID
ORDER BY 
    tpe1.TaxFileID, tpe1.StatusUpdateDate
"""

def create_offline_db() -> None:
    """Create the offline database schema if it doesn't exist."""
    logger.info("Checking offline database...")
    
    # Check if database file exists
    db_exists = os.path.exists(OFFLINE_DB_PATH)
    if db_exists:
        logger.info(f"Offline database already exists at {OFFLINE_DB_PATH}")
    else:
        logger.info(f"Offline database does not exist. Creating at {OFFLINE_DB_PATH}")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(OFFLINE_DB_PATH), exist_ok=True)
    
    # Connect to database (creates it if it doesn't exist)
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='IRSTransitionEstimates'")
    table_exists = cursor.fetchone() is not None
    
    if table_exists:
        logger.info("IRSTransitionEstimates table already exists")
    else:
        logger.info("Creating IRSTransitionEstimates table")
        # Create IRSTransitionEstimates table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS IRSTransitionEstimates (
            EstimateID TEXT PRIMARY KEY,
            SourceStatus TEXT,
            TargetStatus TEXT,
            FilingType TEXT,
            TaxYear INTEGER,
            TaxCategories TEXT,
            DeductionCategories TEXT,
            RefundAmountBucket TEXT,
            GeographicRegion TEXT,
            ProcessingCenter TEXT,
            FilingPeriod TEXT,
            AvgTransitionDays REAL,
            MedianTransitionDays INTEGER,
            P25TransitionDays INTEGER,
            P75TransitionDays INTEGER,
            MinTransitionDays INTEGER,
            MaxTransitionDays INTEGER,
            SampleSize INTEGER,
            SuccessRate REAL,
            ComputationDate TIMESTAMP,
            DataPeriodStart DATE,
            DataPeriodEnd DATE,
            ETLJobID TEXT,
            DataQualityScore REAL,
            CreatedAt TIMESTAMP
        )
        ''')
        
        logger.info("IRSTransitionEstimates table created successfully")
    
    conn.commit()
    conn.close()
    logger.info("Offline database setup completed successfully")

def extract_data() -> pd.DataFrame:
    """Extract data from the online database."""
    logger.info("Extracting data from online database")
    
    # Check if online database exists
    if not os.path.exists(ONLINE_DB_PATH):
        logger.error(f"Online database not found at {ONLINE_DB_PATH}")
        logger.error("Please run the service init-db script first to create the online database")
        return pd.DataFrame()  # Return empty DataFrame
    
    try:
        conn = sqlite3.connect(ONLINE_DB_PATH)
        df = pd.read_sql_query(EXTRACT_EVENTS_QUERY, conn)
        conn.close()
        
        logger.info(f"Extracted {len(df)} records from online database")
        return df
    except Exception as e:
        logger.error(f"Error extracting data from online database: {str(e)}")
        return pd.DataFrame()  # Return empty DataFrame on error

def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    """Transform the data to calculate statistics."""
    logger.info("Transforming data")
    
    if df.empty:
        logger.warning("No data to transform")
        return pd.DataFrame()
    
    # Calculate transition days
    df['SourceDate'] = pd.to_datetime(df['SourceDate'])
    df['TargetDate'] = pd.to_datetime(df['TargetDate'])
    df['TransitionDays'] = (df['TargetDate'] - df['SourceDate']).dt.total_seconds() / (24 * 3600)
    
    # Create refund amount buckets
    df['RefundAmountBucket'] = pd.cut(
        df['ClaimedRefundAmount'],
        bins=[0, 1000, 3000, 5000, float('inf')],
        labels=['0-1000', '1000-3000', '3000-5000', '5000+']
    )
    
    # Determine filing period (Early, Mid, Late)
    df['FilingMonth'] = df['SourceDate'].dt.month
    df['FilingPeriod'] = pd.cut(
        df['FilingMonth'],
        bins=[0, 2, 4, 12],
        labels=['Early', 'Mid', 'Late']
    )
    
    # Parse JSON columns
    df['TaxCategories'] = df['TaxCategories'].apply(lambda x: json.loads(x) if x else {})
    df['DeductionCategories'] = df['DeductionCategories'].apply(lambda x: json.loads(x) if x else {})
    
    # Group by relevant dimensions
    groupby_cols = [
        'SourceStatus', 'TargetStatus', 'FilingType', 'TaxYear',
        'GeographicRegion', 'ProcessingCenter', 'FilingPeriod', 'RefundAmountBucket'
    ]
    
    # Calculate statistics
    stats_df = df.groupby(groupby_cols).agg(
        AvgTransitionDays=('TransitionDays', 'mean'),
        MedianTransitionDays=('TransitionDays', lambda x: int(np.median(x))),
        P25TransitionDays=('TransitionDays', lambda x: int(np.percentile(x, 25))),
        P75TransitionDays=('TransitionDays', lambda x: int(np.percentile(x, 75))),
        MinTransitionDays=('TransitionDays', lambda x: int(np.min(x))),
        MaxTransitionDays=('TransitionDays', lambda x: int(np.max(x))),
        SampleSize=('TransitionDays', 'count'),
    ).reset_index()
    
    # Calculate success rate (percentage of transitions completed within expected time)
    # For this example, we'll use a simple heuristic: transitions completed within the 75th percentile
    
    # Create a temporary dataframe with success rates
    success_rates = {}
    for name, group in df.groupby(groupby_cols):
        success_rates[name] = (group['TransitionDays'] <= np.percentile(group['TransitionDays'], 75)).mean()
    
    # Assign a default success rate
    stats_df['SuccessRate'] = 0.75
    
    # Update success rates for each row based on its group
    for i, row in stats_df.iterrows():
        group_key = tuple(row[col] for col in groupby_cols)
        if group_key in success_rates:
            stats_df.at[i, 'SuccessRate'] = success_rates[group_key]
    
    # Convert TaxCategories and DeductionCategories back to JSON strings
    # For simplicity in this example, we'll just use placeholder values
    stats_df['TaxCategories'] = '{"income": "W2"}'
    stats_df['DeductionCategories'] = '{"mortgage": "yes"}'
    
    # Add metadata
    now = datetime.now()
    stats_df['ComputationDate'] = now.isoformat()
    stats_df['DataPeriodStart'] = (now - timedelta(days=90)).date().isoformat()
    stats_df['DataPeriodEnd'] = now.date().isoformat()
    stats_df['ETLJobID'] = str(uuid.uuid4())
    stats_df['DataQualityScore'] = 0.95  # Placeholder
    stats_df['CreatedAt'] = now.isoformat()
    stats_df['EstimateID'] = [f'estimate-{i+1:03d}' for i in range(len(stats_df))]
    
    logger.info(f"Transformed data into {len(stats_df)} aggregated records")
    return stats_df

def load_data(df: pd.DataFrame) -> None:
    """Load the transformed data into the offline database."""
    logger.info("Loading data into offline database")
    
    if df.empty:
        logger.warning("No data to load")
        return
    
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    
    # Clear existing data
    conn.execute("DELETE FROM IRSTransitionEstimates")
    
    # Insert new data
    df.to_sql('IRSTransitionEstimates', conn, if_exists='append', index=False)
    
    conn.commit()
    conn.close()
    
    logger.info(f"Loaded {len(df)} records into offline database")

def run_etl_process() -> None:
    """Run the complete ETL process."""
    logger.info("Starting ETL process")
    
    try:
        # Create offline database if it doesn't exist
        create_offline_db()
        
        # Extract data from online database
        raw_data = extract_data()
        
        # Transform data
        transformed_data = transform_data(raw_data)
        
        # Load data into offline database
        load_data(transformed_data)
        
        logger.info("ETL process completed successfully")
    except Exception as e:
        logger.error(f"ETL process failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_etl_process()