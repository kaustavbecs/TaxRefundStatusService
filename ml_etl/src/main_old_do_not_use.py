#!/usr/bin/env python3
"""
Main script for Tax Refund Status ML & ETL Pipeline

This script orchestrates the ETL process, model training, and API service.
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
from src.ml.model_training import run_model_training
from src.ml.model_api import run_api_server

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Tax Refund Status ML & ETL Pipeline')
    
    parser.add_argument(
        '--mode',
        type=str,
        choices=['etl', 'train', 'api', 'all'],
        default='all',
        help='Mode to run (etl, train, api, or all)'
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

def run_training():
    """Run the model training process."""
    logger.info("Starting model training process")
    try:
        run_model_training()
        logger.info("Model training process completed successfully")
        return True
    except Exception as e:
        logger.error(f"Model training process failed: {str(e)}")
        return False

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

def schedule_job(interval_hours):
    """Schedule the ETL and training processes to run periodically."""
    logger.info(f"Scheduling ETL and training to run every {interval_hours} hours")
    
    # This is a simple implementation using a loop and sleep
    # In a production environment, you would use a proper scheduler like cron or Airflow
    import time
    
    while True:
        # Run ETL
        etl_success = run_etl()
        
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
        # Schedule the ETL and training processes
        schedule_job(args.interval)
    else:
        # Run the specified mode
        if args.mode == 'etl' or args.mode == 'all':
            etl_success = run_etl()
            # If ETL failed and we're in 'all' mode, exit early
            if not etl_success and args.mode == 'all':
                logger.error("ETL process failed. Exiting without running training or API.")
                return
        
        if args.mode == 'train' or args.mode == 'all':
            run_training()
        
        if args.mode == 'api' or args.mode == 'all':
            run_api()

if __name__ == "__main__":
    main()