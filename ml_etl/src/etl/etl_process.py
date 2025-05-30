#!/usr/bin/env python3
"""
ETL Process for Tax Refund Status Service

This script extracts data from the online database, transforms it for both
raw training data and aggregated statistics, and loads it into the offline
database for ML model training and monitoring.
"""

import os
import uuid
import logging
import sqlite3
import json
import random
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
SCHEMA_PATH = os.environ.get('SCHEMA_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/data/schema.sql')))

# Ensure directories exist
os.makedirs(os.path.dirname(OFFLINE_DB_PATH), exist_ok=True)

# Print paths for debugging
print(f"Online DB path: {ONLINE_DB_PATH}")
print(f"Offline DB path: {OFFLINE_DB_PATH}")
print(f"Schema path: {SCHEMA_PATH}")

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
    logger.info("Setting up offline database...")
    
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
    
    # Check if schema file exists
    if os.path.exists(SCHEMA_PATH):
        logger.info(f"Applying schema from {SCHEMA_PATH}")
        with open(SCHEMA_PATH, 'r') as f:
            schema_sql = f.read()
            conn.executescript(schema_sql)
    else:
        logger.warning(f"Schema file not found at {SCHEMA_PATH}. Creating tables manually.")
        # Create tables manually if schema file doesn't exist
        cursor = conn.cursor()
        
        # Create TrainingData table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS TrainingData (
            RecordID TEXT PRIMARY KEY,
            TaxFileID TEXT,
            FilingType TEXT,
            TaxYear INTEGER,
            TaxCategories TEXT,
            DeductionCategories TEXT,
            ClaimedRefundAmount DECIMAL,
            GeographicRegion TEXT,
            ProcessingCenter TEXT,
            FilingPeriod TEXT,
            SourceStatus TEXT,
            TargetStatus TEXT,
            ActualTransitionDays INTEGER,
            DataPartition TEXT,
            ETLJobID TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create TransitionStatistics table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS TransitionStatistics (
            StatID TEXT PRIMARY KEY,
            SegmentKey TEXT,
            FilingType TEXT,
            TaxYear INTEGER,
            GeographicRegion TEXT,
            ProcessingCenter TEXT,
            FilingPeriod TEXT,
            SourceStatus TEXT,
            TargetStatus TEXT,
            AvgTransitionDays DECIMAL,
            MedianTransitionDays INTEGER,
            P25TransitionDays INTEGER,
            P75TransitionDays INTEGER,
            MinTransitionDays INTEGER,
            MaxTransitionDays INTEGER,
            SampleSize INTEGER,
            SuccessRate DECIMAL,
            ComputationDate TIMESTAMP,
            ETLJobID TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Removed IRSTransitionEstimates table as it's not in EntityModel.MD
        
        # Create MLModels table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS MLModels (
            ModelID TEXT PRIMARY KEY,
            ModelVersion TEXT,
            Algorithm TEXT,
            Hyperparameters TEXT,
            FeatureList TEXT,
            TrainingDataSize INTEGER,
            TrainingStartDate TIMESTAMP,
            TrainingEndDate TIMESTAMP,
            CreatedBy TEXT,
            IsActive BOOLEAN,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create ModelPerformance table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ModelPerformance (
            PerformanceID TEXT PRIMARY KEY,
            ModelID TEXT,
            EvaluationDate TIMESTAMP,
            DataPartition TEXT,
            EvaluationPeriod TEXT,
            SampleSize INTEGER,
            MeanAbsoluteErrorDays DECIMAL,
            AccuracyWithin7Days DECIMAL,
            ConfidenceScoreCorrelation DECIMAL,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ModelID) REFERENCES MLModels(ModelID)
        )
        ''')
        
        # Create FeatureDrift table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS FeatureDrift (
            DriftID TEXT PRIMARY KEY,
            ModelID TEXT,
            DetectionDate TIMESTAMP,
            FeatureDriftScore DECIMAL,
            DriftDetected BOOLEAN,
            SignificantFeatures TEXT,
            SampleSize INTEGER,
            BaselineStartDate TIMESTAMP,
            BaselineEndDate TIMESTAMP,
            CurrentStartDate TIMESTAMP,
            CurrentEndDate TIMESTAMP,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ModelID) REFERENCES MLModels(ModelID)
        )
        ''')
        
        # Create RetrainingDecisions table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS RetrainingDecisions (
            DecisionID TEXT PRIMARY KEY,
            ModelID TEXT,
            DecisionDate TIMESTAMP,
            ScheduleBasedRetraining BOOLEAN,
            PerformanceBasedRetraining BOOLEAN,
            DriftBasedRetraining BOOLEAN,
            RetrainingRecommended BOOLEAN,
            RecommendationReason TEXT,
            LastTrainingDate TIMESTAMP,
            PerformanceMetricID TEXT,
            DriftMetricID TEXT,
            DecisionMadeBy TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ModelID) REFERENCES MLModels(ModelID),
            FOREIGN KEY (PerformanceMetricID) REFERENCES ModelPerformance(PerformanceID),
            FOREIGN KEY (DriftMetricID) REFERENCES FeatureDrift(DriftID)
        )
        ''')
    
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

def transform_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Transform the data into training data and aggregated statistics."""
    logger.info("Transforming data")
    
    if df.empty:
        logger.warning("No data to transform")
        return pd.DataFrame(), pd.DataFrame()
    
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
    
    # Create ETL job ID
    etl_job_id = str(uuid.uuid4())
    
    # 1. Prepare training data
    training_data = df.copy()
    
    # Convert JSON columns back to strings for storage
    training_data['TaxCategories'] = training_data['TaxCategories'].apply(json.dumps)
    training_data['DeductionCategories'] = training_data['DeductionCategories'].apply(json.dumps)
    
    # Add additional columns
    # Use UUIDs for RecordIDs to ensure uniqueness across ETL runs
    training_data['RecordID'] = [f'record-{uuid.uuid4()}' for _ in range(len(training_data))]
    training_data['ActualTransitionDays'] = training_data['TransitionDays'].astype(int)
    
    # Assign data partitions (80% training, 10% validation, 10% test)
    partitions = ['training'] * 80 + ['validation'] * 10 + ['test'] * 10
    random.shuffle(partitions)
    training_data['DataPartition'] = [partitions[i % len(partitions)] for i in range(len(training_data))]
    
    training_data['ETLJobID'] = etl_job_id
    training_data['CreatedAt'] = datetime.now().isoformat()
    
    # Select columns for TrainingData table
    training_data = training_data[[
        'RecordID', 'TaxFileID', 'FilingType', 'TaxYear', 'TaxCategories', 'DeductionCategories',
        'ClaimedRefundAmount', 'GeographicRegion', 'ProcessingCenter', 'FilingPeriod',
        'SourceStatus', 'TargetStatus', 'ActualTransitionDays', 'DataPartition', 'ETLJobID', 'CreatedAt'
    ]]
    
    # 2. Prepare aggregated statistics
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
    
    # Create segment key (composite key for grouping)
    stats_df['SegmentKey'] = stats_df.apply(
        lambda row: f"{row['SourceStatus']}-{row['TargetStatus']}-{row['FilingType']}-{row['GeographicRegion']}-{row['FilingPeriod']}",
        axis=1
    )
    
    # Add metadata
    now = datetime.now()
    stats_df['ComputationDate'] = now.isoformat()
    stats_df['ETLJobID'] = etl_job_id
    stats_df['CreatedAt'] = now.isoformat()
    # Use UUIDs for StatIDs to ensure uniqueness across ETL runs
    stats_df['StatID'] = [f'stat-{uuid.uuid4()}' for _ in range(len(stats_df))]
    
    # Removed legacy format as it's not in EntityModel.MD
    
    logger.info(f"Transformed data into {len(training_data)} training records and {len(stats_df)} aggregated statistics")
    return training_data, stats_df

def load_data(training_data: pd.DataFrame, stats_df: pd.DataFrame, legacy_df=None) -> None:
    """Load the transformed data into the offline database."""
    logger.info("Loading data into offline database")
    
    if (training_data is None or training_data.empty) and (stats_df is None or stats_df.empty):
        logger.warning("No data to load")
        return
    
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    
    # Load training data
    if not training_data.empty:
        # Clear existing data (optional - you might want to keep historical data)
        # conn.execute("DELETE FROM TrainingData")
        
        # Insert new data
        training_data.to_sql('TrainingData', conn, if_exists='append', index=False)
        logger.info(f"Loaded {len(training_data)} records into TrainingData table")
    
    # Load aggregated statistics
    if not stats_df.empty:
        # Clear existing data
        # conn.execute("DELETE FROM TransitionStatistics")
        
        # Insert new data
        stats_df.to_sql('TransitionStatistics', conn, if_exists='append', index=False)
        logger.info(f"Loaded {len(stats_df)} records into TransitionStatistics table")
    
    # Removed IRSTransitionEstimates loading as it's not in EntityModel.MD
    
    conn.commit()
    conn.close()
    
    logger.info("Data loading completed successfully")

def run_etl_process() -> None:
    """Run the complete ETL process."""
    logger.info("Starting ETL process")
    
    try:
        # Create offline database if it doesn't exist
        create_offline_db()
        
        # Extract data from online database
        raw_data = extract_data()
        
        # Transform data
        training_data, stats_df = transform_data(raw_data)
        
        # Load data into offline database
        load_data(training_data, stats_df)
        
        logger.info("ETL process completed successfully")
    except Exception as e:
        logger.error(f"ETL process failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_etl_process()