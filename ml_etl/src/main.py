#!/usr/bin/env python3
"""
Main script for Tax Refund Status ML & ETL Pipeline

This script orchestrates the ETL process, model training, and API service
using the new database schema and model monitoring capabilities.
"""

import os
import sys
import logging
import argparse
import subprocess
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add src directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import modules
from src.etl.etl_process import run_etl_process
logger.info("Using ETL process")

from src.ml.model_training import run_model_training
logger.info("Using model training process")

from src.ml.model_api import run_api_server
logger.info("Using model API server")

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Tax Refund Status ML & ETL Pipeline')
    
    parser.add_argument(
        '--mode',
        type=str,
        choices=['etl', 'train', 'api', 'all', 'monitor'],
        default='all',
        help='Mode to run (etl, train, api, monitor, or all)'
    )
    
    parser.add_argument(
        '--schedule',
        action='store_true',
        help='Schedule the ETL and training processes to run periodically'
    )
    
    parser.add_argument(
        '--interval',
        type=int,
        default=24,
        help='Interval in hours for scheduled runs (default: 24)'
    )
    
    parser.add_argument(
        '--force-retrain',
        action='store_true',
        help='Force model retraining even if not recommended'
    )
    
    return parser.parse_args()

def run_etl():
    """Run the ETL process."""
    logger.info("Starting ETL process")
    try:
        run_etl_process()
        logger.info("ETL process completed successfully")
        return True
    except Exception as e:
        logger.error(f"ETL process failed: {str(e)}")
        return False

def run_training(force=False):
    """Run the model training process."""
    logger.info("Starting model training process")
    try:
        # Check if we should run training based on retraining decisions
        if not force and should_skip_training():
            logger.info("Skipping training as it's not recommended at this time")
            return True
        
        run_model_training()
        logger.info("Model training process completed successfully")
        return True
    except Exception as e:
        logger.error(f"Model training process failed: {str(e)}")
        return False

def should_skip_training():
    """Check if training should be skipped based on retraining decisions."""
    try:
        import sqlite3
        
        # Database path
        db_path = os.environ.get('OFFLINE_DB_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/data/processed/tax_refund_analytics.db')))
        
        # Check if database exists
        if not os.path.exists(db_path):
            return False  # If no database, don't skip training
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if RetrainingDecisions table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='RetrainingDecisions'")
        if cursor.fetchone() is None:
            conn.close()
            return False  # If no table, don't skip training
        
        # Get latest retraining decision
        cursor.execute("""
        SELECT RetrainingRecommended, DecisionDate
        FROM RetrainingDecisions
        ORDER BY DecisionDate DESC
        LIMIT 1
        """)
        
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return False  # If no decisions, don't skip training
        
        retraining_recommended, decision_date = row
        
        # If decision is older than 7 days, ignore it
        decision_date = datetime.fromisoformat(decision_date)
        days_since_decision = (datetime.now() - decision_date).days
        
        if days_since_decision > 7:
            return False  # If decision is old, don't skip training
        
        # If retraining is recommended, don't skip
        if retraining_recommended:
            return False
        
        # If we get here, retraining is not recommended and decision is recent
        return True
    
    except Exception as e:
        logger.warning(f"Error checking retraining decisions: {str(e)}")
        return False  # If error, don't skip training

def run_api():
    """Run the API server."""
    logger.info("Starting API server")
    try:
        run_api_server()
        # Note: This will block until the server is stopped
        return True
    except Exception as e:
        logger.error(f"API server failed: {str(e)}")
        return False

def run_monitoring():
    """Run the model monitoring process."""
    logger.info("Starting model monitoring")
    try:
        # Import monitoring module dynamically
        try:
            from src.ml.model_monitoring import run_model_monitoring
            run_model_monitoring()
            logger.info("Model monitoring completed successfully")
            return True
        except ImportError:
            logger.warning("Model monitoring module not found")
            logger.info("Model monitoring is not yet implemented")
            return False
    except Exception as e:
        logger.error(f"Model monitoring failed: {str(e)}")
        return False

def schedule_job(interval_hours, include_monitoring=True):
    """Schedule the ETL, training, and monitoring processes to run periodically."""
    logger.info(f"Scheduling jobs to run every {interval_hours} hours")
    
    # This is a simple implementation using a loop and sleep
    # In a production environment, you would use a proper scheduler like cron or Airflow
    import time
    
    while True:
        # Run ETL
        etl_success = run_etl()
        
        # Run monitoring if enabled
        if include_monitoring and etl_success:
            run_monitoring()
        
        # Run training if ETL was successful
        if etl_success:
            run_training()
        
        # Sleep for the specified interval
        logger.info(f"Sleeping for {interval_hours} hours until next run")
        time.sleep(interval_hours * 3600)

def main():
    """Main function."""
    args = parse_args()
    
    if args.schedule:
        # Schedule the ETL, training, and monitoring processes
        schedule_job(args.interval, include_monitoring=True)
    else:
        # Run the specified mode
        if args.mode == 'etl' or args.mode == 'all':
            etl_success = run_etl()
            # If ETL failed and we're in 'all' mode, exit early
            if not etl_success and args.mode == 'all':
                logger.error("ETL process failed. Exiting without running training or API.")
                return
        
        if args.mode == 'monitor' or args.mode == 'all':
            run_monitoring()
        
        if args.mode == 'train' or args.mode == 'all':
            run_training(force=args.force_retrain)
        
        if args.mode == 'api' or args.mode == 'all':
            run_api()

if __name__ == "__main__":
    main()