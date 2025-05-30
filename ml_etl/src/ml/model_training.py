#!/usr/bin/env python3
"""
ML Model Training for Tax Refund Status Service

This script trains a machine learning model to predict tax refund processing times
based on historical data from the offline database. It also records model metadata,
performance metrics, and retraining decisions.
"""

import os
import json
import logging
import sqlite3
import joblib
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
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

# SQL queries
TRAINING_DATA_QUERY = """
SELECT 
    FilingType,
    TaxYear,
    ClaimedRefundAmount,
    GeographicRegion,
    ProcessingCenter,
    FilingPeriod,
    SourceStatus,
    TargetStatus,
    ActualTransitionDays
FROM 
    TrainingData
WHERE
    DataPartition = 'training'
"""

VALIDATION_DATA_QUERY = """
SELECT 
    FilingType,
    TaxYear,
    ClaimedRefundAmount,
    GeographicRegion,
    ProcessingCenter,
    FilingPeriod,
    SourceStatus,
    TargetStatus,
    ActualTransitionDays
FROM 
    TrainingData
WHERE
    DataPartition = 'validation'
"""

TEST_DATA_QUERY = """
SELECT 
    FilingType,
    TaxYear,
    ClaimedRefundAmount,
    GeographicRegion,
    ProcessingCenter,
    FilingPeriod,
    SourceStatus,
    TargetStatus,
    ActualTransitionDays
FROM 
    TrainingData
WHERE
    DataPartition = 'test'
"""


def load_training_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load training, validation, and test data from the offline database."""
    logger.info("Loading data from offline database")
    
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    
    try:
        training_df = pd.read_sql_query(TRAINING_DATA_QUERY, conn)
        validation_df = pd.read_sql_query(VALIDATION_DATA_QUERY, conn)
        test_df = pd.read_sql_query(TEST_DATA_QUERY, conn)
        
        logger.info(f"Loaded {len(training_df)} training records, {len(validation_df)} validation records, and {len(test_df)} test records")
        
        conn.close()
        return training_df, validation_df, test_df
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        conn.close()
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

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
    
    # Create refund amount buckets if not already present
    if 'RefundAmountBucket' not in df_filtered.columns:
        df_filtered['RefundAmountBucket'] = pd.cut(
            df_filtered['ClaimedRefundAmount'],
            bins=[0, 1000, 3000, 5000, float('inf')],
            labels=['0-1000', '1000-3000', '3000-5000', '5000+']
        )
    
    # Features and target
    X = df_filtered.drop(['SourceStatus', 'TargetStatus', 'ActualTransitionDays'], axis=1)
    
    # Handle NaN values in the target variable
    y = df_filtered['ActualTransitionDays']
    
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

def build_model_pipeline(X: pd.DataFrame) -> Pipeline:
    """Build the ML model pipeline."""
    logger.info("Building model pipeline")
    
    # Identify categorical and numerical features
    categorical_features = []
    numerical_features = []
    
    for col in X.columns:
        if X[col].dtype == 'object' or X[col].dtype.name == 'category':
            categorical_features.append(col)
        else:
            numerical_features.append(col)
    
    logger.info(f"Categorical features: {categorical_features}")
    logger.info(f"Numerical features: {numerical_features}")
    
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

def train_model(X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series) -> Tuple[Pipeline, Dict[str, Any]]:
    """Train the ML model and return the trained model and performance metrics."""
    logger.info("Training model")
    
    if X_train.empty or y_train.empty:
        logger.warning("No data for training")
        return None, {}
    
    # Build model pipeline
    model_pipeline = build_model_pipeline(X_train)
    
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
    
    # Evaluate the model on validation set
    y_val_pred = best_model.predict(X_val)
    
    # Calculate metrics
    metrics = {
        'mae': mean_absolute_error(y_val, y_val_pred),
        'rmse': np.sqrt(mean_squared_error(y_val, y_val_pred)),
        'r2': r2_score(y_val, y_val_pred),
        'best_params': grid_search.best_params_,
        'accuracy_within_7_days': np.mean(np.abs(y_val - y_val_pred) <= 7),
        'feature_importance': dict(zip(X_train.columns, best_model.named_steps['regressor'].feature_importances_))
    }
    
    logger.info(f"Model training completed. MAE: {metrics['mae']:.2f}, RMSE: {metrics['rmse']:.2f}, R²: {metrics['r2']:.2f}")
    logger.info(f"Accuracy within 7 days: {metrics['accuracy_within_7_days']:.2f}")
    return best_model, metrics

def evaluate_model(model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
    """Evaluate the model on the test set."""
    logger.info("Evaluating model on test set")
    
    if X_test.empty or y_test.empty or model is None:
        logger.warning("No data for evaluation or no model")
        return {}
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        'mae': mean_absolute_error(y_test, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
        'r2': r2_score(y_test, y_pred),
        'accuracy_within_3_days': np.mean(np.abs(y_test - y_pred) <= 3),
        'accuracy_within_7_days': np.mean(np.abs(y_test - y_pred) <= 7),
        'accuracy_within_14_days': np.mean(np.abs(y_test - y_pred) <= 14)
    }
    
    logger.info(f"Test set evaluation: MAE: {metrics['mae']:.2f}, RMSE: {metrics['rmse']:.2f}, R²: {metrics['r2']:.2f}")
    logger.info(f"Accuracy within 3 days: {metrics['accuracy_within_3_days']:.2f}")
    logger.info(f"Accuracy within 7 days: {metrics['accuracy_within_7_days']:.2f}")
    logger.info(f"Accuracy within 14 days: {metrics['accuracy_within_14_days']:.2f}")
    
    return metrics

def save_model(model: Pipeline, train_metrics: Dict[str, Any], test_metrics: Dict[str, Any], X_train: pd.DataFrame) -> str:
    """Save the trained model, its metadata, and performance metrics."""
    logger.info("Saving model and metadata")
    
    # Create model directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Generate model ID
    model_id = f"model-{VERSION}"
    
    # Save the model
    joblib.dump(model, MODEL_PATH)
    
    # Save model metadata
    metadata = {
        'model_id': model_id,
        'version': VERSION,
        'created_at': datetime.now().isoformat(),
        'algorithm': 'RandomForestRegressor',
        'hyperparameters': train_metrics.get('best_params', {}),
        'feature_list': list(X_train.columns),
        'training_metrics': {k: v for k, v in train_metrics.items() if k not in ['best_params', 'feature_importance']},
        'test_metrics': test_metrics,
        'feature_importance': train_metrics.get('feature_importance', {}),
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
    
    return model_id

def record_model_in_db(model_id: str, metadata: Dict[str, Any]) -> None:
    """Record the model metadata in the database."""
    logger.info(f"Recording model {model_id} in database")
    
    try:
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        cursor = conn.cursor()
        
        # Check if MLModels table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='MLModels'")
        if cursor.fetchone() is None:
            logger.warning("MLModels table does not exist, skipping database recording")
            conn.close()
            return
        
        # Insert model metadata
        cursor.execute('''
        INSERT INTO MLModels (
            ModelID, ModelVersion, Algorithm, Hyperparameters, FeatureList,
            TrainingDataSize, TrainingStartDate, TrainingEndDate, CreatedBy, IsActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            model_id,
            f"v{metadata['version']}",
            metadata['algorithm'],
            json.dumps(metadata['hyperparameters']),
            json.dumps(metadata['feature_list']),
            metadata.get('training_data_size', 0),
            metadata['created_at'],
            metadata['created_at'],
            'ml_pipeline',
            True
        ))
        
        # Deactivate previous models
        cursor.execute('''
        UPDATE MLModels SET IsActive = 0 WHERE ModelID != ?
        ''', (model_id,))
        
        # Insert performance metrics
        performance_id = f"perf-{model_id}"
        cursor.execute('''
        INSERT INTO ModelPerformance (
            PerformanceID, ModelID, EvaluationDate, DataPartition,
            EvaluationPeriod, SampleSize, MeanAbsoluteErrorDays,
            AccuracyWithin7Days, ConfidenceScoreCorrelation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            performance_id,
            model_id,
            metadata['created_at'],
            'test',
            f"{datetime.now().date().isoformat()} evaluation",
            metadata.get('test_metrics', {}).get('sample_size', 0),
            metadata.get('test_metrics', {}).get('mae', 0),
            metadata.get('test_metrics', {}).get('accuracy_within_7_days', 0),
            metadata.get('test_metrics', {}).get('r2', 0)
        ))
        
        # Insert retraining decision
        decision_id = f"decision-{model_id}"
        cursor.execute('''
        INSERT INTO RetrainingDecisions (
            DecisionID, ModelID, DecisionDate, ScheduleBasedRetraining,
            PerformanceBasedRetraining, DriftBasedRetraining,
            RetrainingRecommended, RecommendationReason, LastTrainingDate,
            PerformanceMetricID, DecisionMadeBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            decision_id,
            model_id,
            metadata['created_at'],
            True,  # Schedule-based
            False,  # Performance-based
            False,  # Drift-based
            True,  # Recommended
            'Initial training or scheduled retraining',
            metadata['created_at'],
            performance_id,
            'ml_pipeline'
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"Model {model_id} recorded in database")
    except Exception as e:
        logger.error(f"Error recording model in database: {str(e)}")

def run_model_training() -> None:
    """Run the complete model training process."""
    logger.info("Starting model training process")
    
    try:
        # Load training data
        training_df, validation_df, test_df = load_training_data()
        
        # Preprocess data
        X_train, y_train = preprocess_data(training_df)
        X_val, y_val = preprocess_data(validation_df)
        X_test, y_test = preprocess_data(test_df)
        
        if X_train.empty or y_train.empty:
            logger.warning("No training data available")
            return
        
        # Train model
        model, train_metrics = train_model(X_train, y_train, X_val, y_val)
        
        if model is not None:
            # Evaluate model on test set
            test_metrics = evaluate_model(model, X_test, y_test)
            
            # Add sample sizes to metrics
            train_metrics['training_data_size'] = len(X_train)
            test_metrics['sample_size'] = len(X_test)
            
            # Save model
            model_id = save_model(model, train_metrics, test_metrics, X_train)
            
            # Record model in database
            record_model_in_db(model_id, {
                'version': VERSION,
                'created_at': datetime.now().isoformat(),
                'algorithm': 'RandomForestRegressor',
                'hyperparameters': train_metrics.get('best_params', {}),
                'feature_list': list(X_train.columns),
                'training_data_size': len(X_train),
                'test_metrics': test_metrics
            })
            
            logger.info("Model training process completed successfully")
        else:
            logger.warning("Model training failed - no model was produced")
    
    except Exception as e:
        logger.error(f"Model training process failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_model_training()