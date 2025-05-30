#!/usr/bin/env python3
"""
ML Model API for Tax Refund Status Service

This script provides a FastAPI service to host the trained ML model
and serve predictions for tax refund processing times.
"""

import os
import json
import logging
import joblib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import uvicorn
from fastapi import FastAPI, HTTPException, Query, Depends
from pydantic import BaseModel, Field

# Configure logging
import os
import sys
from logging.handlers import RotatingFileHandler

# Create logs directory if it doesn't exist
logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/logs'))
os.makedirs(logs_dir, exist_ok=True)

# Configure logging to both console and file
log_file_path = os.path.join(logs_dir, 'model_api.log')

# Create handlers
console_handler = logging.StreamHandler(sys.stdout)
file_handler = RotatingFileHandler(
    log_file_path,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    mode='a'  # Append mode
)

# Create formatters and add them to handlers
log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
console_formatter = logging.Formatter(log_format)
file_formatter = logging.Formatter(log_format)
console_handler.setFormatter(console_formatter)
file_handler.setFormatter(file_formatter)

# Get the logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add handlers to logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Prevent propagation to avoid duplicate logs
logger.propagate = False

logger.info(f"Logging to file: {log_file_path}")

# Model paths
MODEL_DIR = os.environ.get('MODEL_DIR', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/models')))
LATEST_MODEL_PATH = os.path.join(MODEL_DIR, 'refund_prediction_model_latest.joblib')
LATEST_METADATA_PATH = os.path.join(MODEL_DIR, 'model_metadata_latest.json')

# Ensure directories exist
os.makedirs(MODEL_DIR, exist_ok=True)

# Print paths for debugging
print(f"Model directory: {MODEL_DIR}")
print(f"Latest model path: {LATEST_MODEL_PATH}")

# Create FastAPI app
app = FastAPI(
    title="Tax Refund Prediction API",
    description="API for predicting tax refund processing times",
    version="1.0.0"
)

# Load model and metadata
model = None
model_metadata = None
model_version = "unknown"
model_id = None

# Input and output models
class PredictionRequest(BaseModel):
    filing_type: str = Field(..., description="Type of tax filing (e.g., 'Individual', 'Joint')")
    tax_year: int = Field(..., description="Tax year")
    refund_amount: float = Field(..., description="Claimed refund amount")
    geographic_region: str = Field(..., description="Geographic region (e.g., 'Northeast', 'West')")
    processing_center: str = Field(..., description="Processing center")
    filing_period: Optional[str] = Field(None, description="Filing period (Early, Mid, Late)")
    source_status: str = Field("Processing", description="Current status of the tax filing")
    target_status: str = Field("Approved", description="Target status for prediction")

class PredictionResponse(BaseModel):
    estimated_days: int = Field(..., description="Estimated number of days for processing")
    confidence_score: float = Field(..., description="Confidence score of the prediction (0-1)")
    predicted_date: str = Field(..., description="Predicted date of completion")
    model_version: str = Field(..., description="Version of the model used for prediction")



@app.on_event("startup")
async def startup_event():
    """Load the model and metadata on startup."""
    global model, model_metadata, model_version, model_id
    
    try:
        # Check for model directory
        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR, exist_ok=True)
            logger.info(f"Created model directory at {MODEL_DIR}")
        
        # First try to load the latest model
        if os.path.exists(LATEST_MODEL_PATH):
            logger.info(f"Loading latest model from {LATEST_MODEL_PATH}")
            model = joblib.load(LATEST_MODEL_PATH)
            
            # Load latest metadata
            if os.path.exists(LATEST_METADATA_PATH):
                logger.info(f"Loading latest model metadata from {LATEST_METADATA_PATH}")
                with open(LATEST_METADATA_PATH, 'r') as f:
                    model_metadata = json.load(f)
                model_version = f"v{model_metadata.get('version', 'latest')}"
                model_id = model_metadata.get('model_id', f"model-{model_metadata.get('version', 'latest')}")
            else:
                model_version = "latest"
                model_metadata = {"version": "latest"}
                model_id = "model-latest"
                
            logger.info(f"Successfully loaded latest model ({model_version})")
        else:
            # If latest model doesn't exist, find the highest version
            logger.warning(f"Latest model not found at {LATEST_MODEL_PATH}, looking for versioned models")
            
            # Find all versioned model files
            versioned_models = []
            for file in os.listdir(MODEL_DIR):
                if file.startswith('refund_prediction_model_v') and file.endswith('.joblib'):
                    version = int(file.split('_v')[1].split('.')[0])
                    versioned_models.append((version, os.path.join(MODEL_DIR, file)))
            
            if versioned_models:
                # Sort by version (highest first)
                versioned_models.sort(reverse=True)
                highest_version, highest_model_path = versioned_models[0]
                
                logger.info(f"Loading highest version model (v{highest_version}) from {highest_model_path}")
                model = joblib.load(highest_model_path)
                
                # Load corresponding metadata
                metadata_path = os.path.join(MODEL_DIR, f'model_metadata_v{highest_version}.json')
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        model_metadata = json.load(f)
                    model_id = model_metadata.get('model_id', f"model-{highest_version}")
                else:
                    model_metadata = {"version": highest_version}
                    model_id = f"model-{highest_version}"
                
                model_version = f"v{highest_version}"
                logger.info(f"Successfully loaded model {model_version}")
            else:
                logger.warning(f"No model files found in {MODEL_DIR}")
    
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        model = None
        model_metadata = {"version": "unknown", "error": str(e)}
        model_id = None

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    # Check for available models
    available_models = []
    if os.path.exists(MODEL_DIR):
        for file in os.listdir(MODEL_DIR):
            if file.startswith('refund_prediction_model_v') and file.endswith('.joblib'):
                version = file.split('_v')[1].split('.')[0]
                available_models.append(f"v{version}")
    
    has_latest = os.path.exists(LATEST_MODEL_PATH)
    
    return {
        "status": "ok" if model is not None else "error",
        "model_loaded": model is not None,
        "model_version": model_version,
        "model_id": model_id,
        "latest_available": has_latest,
        "available_versions": available_models,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/metadata")
async def get_metadata():
    """Get model metadata."""
    if model_metadata is None:
        raise HTTPException(status_code=404, detail="Model metadata not found")
    
    return model_metadata


def determine_refund_amount_bucket(amount: float) -> str:
    """Determine the refund amount bucket based on the amount."""
    if amount < 1000:
        return "0-1000"
    elif amount < 3000:
        return "1000-3000"
    elif amount < 5000:
        return "3000-5000"
    else:
        return "5000+"

def determine_filing_period(filing_date: Optional[datetime] = None) -> str:
    """Determine the filing period based on the filing date."""
    if filing_date is None:
        filing_date = datetime.now()
    
    month = filing_date.month
    
    if month <= 2:  # January-February
        return "Early"
    elif month <= 4:  # March-April
        return "Mid"
    else:  # May-December
        return "Late"

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Predict tax refund processing time."""
    global model, model_metadata, model_version, model_id
    
    # If no model is available, return error
    if model is None:
        raise HTTPException(status_code=503, detail="No model available for prediction")
    
    try:
        # Prepare input data
        refund_amount_bucket = determine_refund_amount_bucket(request.refund_amount)
        filing_period = request.filing_period or determine_filing_period()
        
        # Create feature dataframe
        input_data = {
            'FilingType': [request.filing_type],
            'TaxYear': [request.tax_year],
            'RefundAmountBucket': [refund_amount_bucket],
            'GeographicRegion': [request.geographic_region],
            'ProcessingCenter': [request.processing_center],
            'FilingPeriod': [filing_period],
            'ClaimedRefundAmount': [request.refund_amount]
        }
        
        # Add any additional features needed by the model
        if model_metadata and 'feature_list' in model_metadata:
            feature_list = model_metadata['feature_list']

        # Log input features
        logger.info(f"Prediction request received with features:")
        for feature, value in input_data.items():
            logger.info(f"  {feature}: {value[0]}")
        
        import pandas as pd
        input_df = pd.DataFrame(input_data)
        
        # Make prediction using the model
        predicted_days = int(model.predict(input_df)[0])
        
        # Calculate prediction-specific confidence score using the RandomForestRegressor
        try:
            # Access the RandomForestRegressor from the pipeline
            # Based on model_training.py, the structure is:
            # Pipeline(steps=[('preprocessor', ColumnTransformer(...)), ('regressor', RandomForestRegressor(...))])
            rf = model.named_steps['regressor']
            
            # Transform the input data using the preprocessor
            preprocessor = model.named_steps['preprocessor']
            transformed_data = preprocessor.transform(input_df)
            
            # Get predictions from all trees in the forest
            tree_predictions = [tree.predict(transformed_data)[0] for tree in rf.estimators_]
            
            # Calculate standard deviation of predictions across trees
            # Higher variance/std_dev means lower confidence
            mean_prediction = sum(tree_predictions) / len(tree_predictions)
            variance = sum((pred - mean_prediction) ** 2 for pred in tree_predictions) / len(tree_predictions)
            std_dev = variance ** 0.5
            
            # Convert std_dev to a confidence score (0.5-0.95)
            # Lower std_dev = higher confidence
            max_expected_std = 3.0  # Adjust based on your data's scale
            confidence_score = 0.95 - min(0.45, (std_dev / max_expected_std) * 0.45)
            
            # Round to 2 decimal places for readability
            confidence_score = round(confidence_score, 2)
            
            logger.info(f"Tree prediction std dev: {std_dev:.2f}, resulting in confidence: {confidence_score}")
            
        except Exception as e:
            # Fallback to metadata-based confidence if anything goes wrong
            logger.warning(f"Error calculating prediction-specific confidence: {str(e)}")
            confidence_score = 0.85  # Default
            if model_metadata and 'test_metrics' in model_metadata and 'r2' in model_metadata['test_metrics']:
                # Use R² as a basis for confidence
                confidence_score = min(0.95, max(0.5, 0.5 + model_metadata['test_metrics']['r2'] * 0.5))
        
        # Calculate predicted date
        today = datetime.now()
        predicted_date = (today + timedelta(days=predicted_days)).date().isoformat()
        
        # Create response
        response = {
            "estimated_days": predicted_days,
            "confidence_score": confidence_score,
            "predicted_date": predicted_date,
            "model_version": model_version
        }
        
        # Log prediction outcome
        logger.info(f"Prediction outcome:")
        logger.info(f"  Estimated Days: {predicted_days}")
        logger.info(f"  Confidence Score: {confidence_score:.2f}")
        logger.info(f"  Predicted Date: {predicted_date}")
        logger.info(f"  Model Version: {model_version}")
        
        # Prediction storage is handled by the service
        
        return response
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

def run_api_server():
    """Run the API server."""
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "9090"))  # Use 9090 as default port
    
    # Kill any existing process using the port
    try:
        import platform
        import subprocess
        
        logger.info(f"Checking for processes using port {port}")
        
        if platform.system() == "Windows":
            # Windows command
            cmd = f"for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :{port}') do taskkill /F /PID %a"
            subprocess.run(cmd, shell=True, stderr=subprocess.DEVNULL)
        else:
            # Unix/Mac command
            cmd = f"lsof -i tcp:{port} | grep LISTEN | awk '{{print $2}}' | xargs kill -9"
            subprocess.run(cmd, shell=True, stderr=subprocess.DEVNULL)
            
        logger.info(f"Killed any processes using port {port}")
    except Exception as e:
        logger.warning(f"Error killing processes on port {port}: {str(e)}")
    
    # Start the API server
    logger.info(f"Starting API server on port {port}")
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    run_api_server()