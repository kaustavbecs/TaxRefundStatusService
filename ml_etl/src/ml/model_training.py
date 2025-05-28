#!/usr/bin/env python3
"""
ML Model Training for Tax Refund Status Service

This script trains a machine learning model to predict tax refund processing times
based on historical data from the offline database.
"""

import os
import json
import logging
import sqlite3
import joblib
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database and model paths
# Use absolute path to ensure the database can be found regardless of where the script is run from
OFFLINE_DB_PATH = os.environ.get('OFFLINE_DB_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/data/processed/tax_refund_analytics.db')))
MODEL_DIR = os.environ.get('MODEL_DIR', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/models')))

# Get current version number
def get_next_version():
    """Get the next version number based on existing model files"""
    version = 1
    # Check for existing model files
    if os.path.exists(MODEL_DIR):
        model_files = [f for f in os.listdir(MODEL_DIR) if f.startswith('refund_prediction_model_v') and f.endswith('.joblib')]
        if model_files:
            # Extract version numbers
            versions = [int(f.split('_v')[1].split('.')[0]) for f in model_files]
            if versions:
                version = max(versions) + 1
    return version

# Generate versioned model paths
VERSION = get_next_version()
MODEL_PATH = os.path.join(MODEL_DIR, f'refund_prediction_model_v{VERSION}.joblib')
MODEL_METADATA_PATH = os.path.join(MODEL_DIR, f'model_metadata_v{VERSION}.json')

# Ensure directories exist
os.makedirs(MODEL_DIR, exist_ok=True)

# Print paths for debugging
print(f"Offline DB path: {OFFLINE_DB_PATH}")
print(f"Model directory: {MODEL_DIR}")

# SQL query to get training data
TRAINING_DATA_QUERY = """
SELECT 
    SourceStatus,
    TargetStatus,
    FilingType,
    TaxYear,
    RefundAmountBucket,
    GeographicRegion,
    ProcessingCenter,
    FilingPeriod,
    MedianTransitionDays,
    AvgTransitionDays,
    P25TransitionDays,
    P75TransitionDays,
    SampleSize,
    SuccessRate
FROM 
    IRSTransitionEstimates
"""

def load_training_data() -> pd.DataFrame:
    """Load training data from the offline database."""
    logger.info("Loading training data from offline database")
    
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    df = pd.read_sql_query(TRAINING_DATA_QUERY, conn)
    conn.close()
    
    logger.info(f"Loaded {len(df)} records for training")
    return df

def preprocess_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Preprocess the data for model training."""
    logger.info("Preprocessing data for model training")
    
    if df.empty:
        logger.warning("No data to preprocess")
        return pd.DataFrame(), pd.Series()
    
    # Filter for specific transition (Processing -> Approved)
    df_filtered = df[(df['SourceStatus'] == 'Processing') & (df['TargetStatus'] == 'Approved')].copy()
    
    if df_filtered.empty:
        logger.warning("No relevant transitions found in data. Using all transitions instead.")
        # Use all transitions as a fallback
        df_filtered = df.copy()
        
        if df_filtered.empty:
            logger.warning("No transitions found in data at all")
            return pd.DataFrame(), pd.Series()
    
    # Features and target
    X = df_filtered.drop(['MedianTransitionDays', 'AvgTransitionDays', 'P25TransitionDays',
                         'P75TransitionDays', 'SourceStatus', 'TargetStatus'], axis=1)
    
    # Handle NaN values in the target variable
    y = df_filtered['MedianTransitionDays']
    
    # Check for NaN values
    if y.isna().any():
        logger.warning(f"Found {y.isna().sum()} NaN values in target variable. Dropping these rows.")
        # Get indices of non-NaN values
        valid_indices = ~y.isna()
        X = X[valid_indices]
        y = y[valid_indices]
        
        if len(y) == 0:
            logger.warning("No valid target values remain after dropping NaN values")
            return pd.DataFrame(), pd.Series()
    
    logger.info(f"Preprocessed data: {X.shape[0]} samples, {X.shape[1]} features")
    return X, y

def build_model_pipeline() -> Pipeline:
    """Build the ML model pipeline."""
    logger.info("Building model pipeline")
    
    # Define categorical and numerical features
    categorical_features = ['FilingType', 'RefundAmountBucket', 'GeographicRegion', 
                           'ProcessingCenter', 'FilingPeriod']
    numerical_features = ['TaxYear', 'SampleSize', 'SuccessRate']
    
    # Define preprocessing for categorical features
    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    # Define preprocessing for numerical features
    numerical_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    # Combine preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, categorical_features),
            ('num', numerical_transformer, numerical_features)
        ])
    
    # Create the model pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(random_state=42))
    ])
    
    return model_pipeline

def train_model(X: pd.DataFrame, y: pd.Series) -> Tuple[Pipeline, Dict[str, Any]]:
    """Train the ML model and return the trained model and performance metrics."""
    logger.info("Training model")
    
    if X.empty or y.empty:
        logger.warning("No data for training")
        return None, {}
    
    # Split data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Build model pipeline
    model_pipeline = build_model_pipeline()
    
    # Define hyperparameter grid
    param_grid = {
        'regressor__n_estimators': [50, 100],
        'regressor__max_depth': [None, 10, 20],
        'regressor__min_samples_split': [2, 5]
    }
    
    # Perform grid search
    grid_search = GridSearchCV(
        model_pipeline, 
        param_grid, 
        cv=3, 
        scoring='neg_mean_absolute_error',
        n_jobs=-1
    )
    
    # Train the model
    grid_search.fit(X_train, y_train)
    best_model = grid_search.best_estimator_
    
    # Evaluate the model
    y_pred = best_model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        'mae': mean_absolute_error(y_test, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
        'r2': r2_score(y_test, y_pred),
        'best_params': grid_search.best_params_,
        'feature_importance': dict(zip(X.columns, best_model.named_steps['regressor'].feature_importances_))
    }
    
    logger.info(f"Model training completed. MAE: {metrics['mae']:.2f}, RMSE: {metrics['rmse']:.2f}, R²: {metrics['r2']:.2f}")
    return best_model, metrics

def save_model(model: Pipeline, metrics: Dict[str, Any]) -> None:
    """Save the trained model and its metadata."""
    logger.info("Saving model and metadata")
    
    # Create model directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Save the model
    joblib.dump(model, MODEL_PATH)
    
    # Save model metadata
    metadata = {
        'version': VERSION,
        'created_at': datetime.now().isoformat(),
        'metrics': {k: v for k, v in metrics.items() if k != 'feature_importance'},
        'feature_importance': metrics.get('feature_importance', {}),
        'description': 'Tax refund processing time prediction model'
    }
    
    with open(MODEL_METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Also save a copy as the latest model for easy reference
    latest_model_path = os.path.join(MODEL_DIR, 'refund_prediction_model_latest.joblib')
    latest_metadata_path = os.path.join(MODEL_DIR, 'model_metadata_latest.json')
    
    try:
        # Copy the model file
        joblib.dump(model, latest_model_path)
        
        # Copy the metadata file
        with open(latest_metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Latest model saved to {latest_model_path}")
        logger.info(f"Latest model metadata saved to {latest_metadata_path}")
    except Exception as e:
        logger.warning(f"Failed to save latest model copy: {str(e)}")
    
    logger.info(f"Model v{VERSION} saved to {MODEL_PATH}")
    logger.info(f"Model v{VERSION} metadata saved to {MODEL_METADATA_PATH}")

def run_model_training() -> None:
    """Run the complete model training process."""
    logger.info("Starting model training process")
    
    try:
        # Load training data
        df = load_training_data()
        
        # Preprocess data
        X, y = preprocess_data(df)
        
        # Train model
        model, metrics = train_model(X, y)
        
        if model is not None:
            # Save model
            save_model(model, metrics)
            logger.info("Model training process completed successfully")
        else:
            logger.warning("Model training failed - no model was produced")
    
    except Exception as e:
        logger.error(f"Model training process failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_model_training()