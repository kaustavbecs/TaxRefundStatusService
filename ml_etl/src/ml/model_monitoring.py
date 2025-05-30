#!/usr/bin/env python3
"""
Model Monitoring for Tax Refund Status Service

This script monitors the performance of the deployed ML model by:
1. Evaluating prediction accuracy against actual outcomes
2. Detecting feature drift
3. Making retraining recommendations
"""

import os
import json
import logging
import sqlite3
import uuid
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from sklearn.metrics import mean_absolute_error
from scipy.stats import ks_2samp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database paths
OFFLINE_DB_PATH = os.environ.get('OFFLINE_DB_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/data/processed/tax_refund_analytics.db')))
MODEL_DIR = os.environ.get('MODEL_DIR', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_etl/models')))

# Print paths for debugging
print(f"Offline DB path: {OFFLINE_DB_PATH}")
print(f"Model directory: {MODEL_DIR}")

def get_active_model_id() -> Optional[str]:
    """Get the ID of the currently active model."""
    try:
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        cursor = conn.cursor()
        
        # Check if MLModels table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='MLModels'")
        if cursor.fetchone() is None:
            conn.close()
            return None
        
        # Get active model
        cursor.execute("SELECT ModelID FROM MLModels WHERE IsActive = 1 LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return row[0]
        
        # If no active model found, try to get the latest model metadata
        latest_metadata_path = os.path.join(MODEL_DIR, 'model_metadata_latest.json')
        if os.path.exists(latest_metadata_path):
            with open(latest_metadata_path, 'r') as f:
                metadata = json.load(f)
                return metadata.get('model_id')
        
        return None
    except Exception as e:
        logger.error(f"Error getting active model ID: {str(e)}")
        return None

def get_model_metadata(model_id: str) -> Dict[str, Any]:
    """Get metadata for the specified model."""
    try:
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        cursor = conn.cursor()
        
        # Check if MLModels table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='MLModels'")
        if cursor.fetchone() is None:
            conn.close()
            
            # Try to get metadata from file
            model_version = model_id.split('-')[-1]
            metadata_path = os.path.join(MODEL_DIR, f'model_metadata_v{model_version}.json')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    return json.load(f)
            
            # Try latest metadata
            latest_metadata_path = os.path.join(MODEL_DIR, 'model_metadata_latest.json')
            if os.path.exists(latest_metadata_path):
                with open(latest_metadata_path, 'r') as f:
                    return json.load(f)
            
            return {}
        
        # Get model metadata
        cursor.execute("""
        SELECT 
            ModelID, ModelVersion, Algorithm, Hyperparameters, 
            FeatureList, TrainingDataSize, TrainingStartDate
        FROM 
            MLModels
        WHERE 
            ModelID = ?
        """, (model_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {}
        
        # Parse JSON fields
        hyperparameters = json.loads(row[3]) if row[3] else {}
        feature_list = json.loads(row[4]) if row[4] else []
        
        return {
            'model_id': row[0],
            'version': row[1],
            'algorithm': row[2],
            'hyperparameters': hyperparameters,
            'feature_list': feature_list,
            'training_data_size': row[5],
            'training_date': row[6]
        }
    except Exception as e:
        logger.error(f"Error getting model metadata: {str(e)}")
        return {}

def get_recent_predictions_with_outcomes(days: int = 30) -> pd.DataFrame:
    """Get recent predictions with actual outcomes for evaluation."""
    try:
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        
        # Calculate cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Query to get prediction outcomes
        query = """
        SELECT
            OutcomeID,
            PredictionID,
            TaxFileID,
            ConfidenceScore,
            ModelVersion,
            PredictedAvailabilityDate,
            PredictedTransitionDays,
            ActualTransitionDays,
            ErrorDays,
            InputFeatures,
            CreatedAt
        FROM
            PredictionOutcomes
        WHERE
            CreatedAt > ?
        ORDER BY
            CreatedAt DESC
        LIMIT 100
        """
        
        df = pd.read_sql_query(query, conn, params=(cutoff_date,))
        conn.close()
        
        if df.empty:
            logger.warning("No recent prediction outcomes found")
            return pd.DataFrame()
        
        # Parse InputFeatures JSON
        df['InputFeatures'] = df['InputFeatures'].apply(lambda x: json.loads(x) if x else {})
        
        logger.info(f"Found {len(df)} recent prediction outcomes")
        return df
    except Exception as e:
        logger.error(f"Error getting recent predictions with outcomes: {str(e)}")
        return pd.DataFrame()

def evaluate_model_performance(predictions_df: pd.DataFrame) -> Dict[str, Any]:
    """Evaluate model performance on recent predictions."""
    if predictions_df.empty:
        logger.warning("No data for performance evaluation")
        return {}
    
    try:
        # Calculate error metrics if ErrorDays doesn't exist
        if 'ErrorDays' not in predictions_df.columns:
            predictions_df['ErrorDays'] = predictions_df['PredictedTransitionDays'] - predictions_df['ActualTransitionDays']
        
        predictions_df['AbsErrorDays'] = predictions_df['ErrorDays'].abs()
        
        # Calculate performance metrics
        metrics = {
            'sample_size': len(predictions_df),
            'mae': predictions_df['AbsErrorDays'].mean(),
            'rmse': np.sqrt((predictions_df['ErrorDays'] ** 2).mean()),
            'accuracy_within_3_days': (predictions_df['AbsErrorDays'] <= 3).mean(),
            'accuracy_within_7_days': (predictions_df['AbsErrorDays'] <= 7).mean(),
            'accuracy_within_14_days': (predictions_df['AbsErrorDays'] <= 14).mean(),
            'mean_confidence_score': predictions_df['ConfidenceScore'].mean(),
            'confidence_score_correlation': predictions_df[['ConfidenceScore', 'AbsErrorDays']].corr().iloc[0, 1] * -1,
            'evaluation_date': datetime.now().isoformat()
        }
        
        # Calculate metrics by model version
        metrics_by_version = {}
        for version, group in predictions_df.groupby('ModelVersion'):
            metrics_by_version[version] = {
                'sample_size': len(group),
                'mae': group['AbsErrorDays'].mean(),
                'accuracy_within_7_days': (group['AbsErrorDays'] <= 7).mean()
            }
        
        metrics['metrics_by_version'] = metrics_by_version
        
        logger.info(f"Performance evaluation: MAE={metrics['mae']:.2f}, Accuracy within 7 days={metrics['accuracy_within_7_days']:.2f}")
        return metrics
    except Exception as e:
        logger.error(f"Error evaluating model performance: {str(e)}")
        return {}

def get_training_data_sample() -> pd.DataFrame:
    """Get a sample of the training data for drift detection."""
    try:
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        
        query = """
        SELECT
            FilingType, TaxYear, ClaimedRefundAmount, GeographicRegion,
            ProcessingCenter, FilingPeriod
        FROM
            TrainingData
        WHERE
            DataPartition = 'training'
        ORDER BY
            RANDOM()
        LIMIT 1000
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        return df
    except Exception as e:
        logger.error(f"Error getting training data sample: {str(e)}")
        return pd.DataFrame()

def extract_features_from_predictions(predictions_df: pd.DataFrame) -> pd.DataFrame:
    """Extract features from prediction input features for drift detection."""
    if predictions_df.empty:
        return pd.DataFrame()
    
    try:
        # Extract features from InputFeatures JSON
        features = []
        for _, row in predictions_df.iterrows():
            input_features = row['InputFeatures']
            if isinstance(input_features, dict):
                # Extract first value from each feature (since they're lists)
                feature_dict = {k: v[0] if isinstance(v, list) and len(v) > 0 else v 
                               for k, v in input_features.items()}
                features.append(feature_dict)
        
        if not features:
            return pd.DataFrame()
        
        # Convert to DataFrame
        features_df = pd.DataFrame(features)
        
        # Select only common features for drift detection
        common_features = ['FilingType', 'TaxYear', 'GeographicRegion', 
                          'ProcessingCenter', 'FilingPeriod']
        
        # Filter columns that exist
        common_features = [f for f in common_features if f in features_df.columns]
        
        if not common_features:
            return pd.DataFrame()
        
        return features_df[common_features]
    except Exception as e:
        logger.error(f"Error extracting features from predictions: {str(e)}")
        return pd.DataFrame()

def detect_feature_drift(training_df: pd.DataFrame, recent_df: pd.DataFrame) -> Dict[str, Any]:
    """Detect drift in feature distributions between training and recent data."""
    if training_df.empty or recent_df.empty:
        logger.warning("No data for drift detection")
        return {
            'drift_detected': False,
            'drift_score': 0.0,
            'significant_features': [],
            'detection_date': datetime.now().isoformat()
        }
    
    try:
        # Ensure we have common columns
        common_cols = [col for col in training_df.columns if col in recent_df.columns]
        
        if not common_cols:
            logger.warning("No common columns for drift detection")
            return {
                'drift_detected': False,
                'drift_score': 0.0,
                'significant_features': [],
                'detection_date': datetime.now().isoformat()
            }
        
        # Calculate drift for each feature
        drift_scores = {}
        significant_features = []
        
        for col in common_cols:
            if pd.api.types.is_numeric_dtype(training_df[col]) and pd.api.types.is_numeric_dtype(recent_df[col]):
                # For numeric features, use Kolmogorov-Smirnov test
                ks_stat, p_value = ks_2samp(training_df[col].dropna(), recent_df[col].dropna())
                drift_scores[col] = ks_stat
                
                # If p-value is small, drift is significant
                if p_value < 0.05:
                    significant_features.append(col)
            else:
                # For categorical features, compare distribution
                train_dist = training_df[col].value_counts(normalize=True).to_dict()
                recent_dist = recent_df[col].value_counts(normalize=True).to_dict()
                
                # Calculate Jensen-Shannon divergence (simplified)
                categories = set(train_dist.keys()) | set(recent_dist.keys())
                js_div = 0.0
                
                for cat in categories:
                    p = train_dist.get(cat, 0)
                    q = recent_dist.get(cat, 0)
                    if p > 0 and q > 0:
                        js_div += 0.5 * (p * np.log(p/q) + q * np.log(q/p))
                
                drift_scores[col] = min(1.0, js_div)
                
                # If divergence is large, drift is significant
                if js_div > 0.1:
                    significant_features.append(col)
        
        # Calculate overall drift score
        overall_drift_score = sum(drift_scores.values()) / len(drift_scores) if drift_scores else 0.0
        
        # Determine if drift is detected
        drift_detected = len(significant_features) > 0 and overall_drift_score > 0.1
        
        result = {
            'drift_detected': drift_detected,
            'drift_score': overall_drift_score,
            'feature_drift_scores': drift_scores,
            'significant_features': significant_features,
            'detection_date': datetime.now().isoformat()
        }
        
        logger.info(f"Drift detection: score={overall_drift_score:.2f}, detected={drift_detected}, significant features={significant_features}")
        return result
    except Exception as e:
        logger.error(f"Error detecting feature drift: {str(e)}")
        return {
            'drift_detected': False,
            'drift_score': 0.0,
            'significant_features': [],
            'detection_date': datetime.now().isoformat()
        }

def make_retraining_recommendation(
    performance_metrics: Dict[str, Any],
    drift_results: Dict[str, Any],
    model_metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """Make a recommendation on whether to retrain the model."""
    try:
        # Default recommendation
        recommendation = {
            'retraining_recommended': False,
            'schedule_based_retraining': False,
            'performance_based_retraining': False,
            'drift_based_retraining': False,
            'recommendation_reason': 'No retraining needed at this time',
            'decision_date': datetime.now().isoformat()
        }
        
        # Check if model metadata is available
        if not model_metadata:
            recommendation['retraining_recommended'] = True
            recommendation['schedule_based_retraining'] = True
            recommendation['recommendation_reason'] = 'No model metadata available, recommend initial training'
            return recommendation
        
        # 1. Schedule-based retraining
        training_date = model_metadata.get('training_date') or model_metadata.get('created_at')
        if training_date:
            try:
                training_date = datetime.fromisoformat(training_date)
                days_since_training = (datetime.now() - training_date).days
                
                # If model is older than 30 days, recommend retraining
                if days_since_training > 30:
                    recommendation['retraining_recommended'] = True
                    recommendation['schedule_based_retraining'] = True
                    recommendation['recommendation_reason'] = f'Model is {days_since_training} days old, recommend scheduled retraining'
            except:
                logger.warning(f"Could not parse training date: {training_date}")
        
        # 2. Performance-based retraining
        if performance_metrics:
            accuracy_within_7_days = performance_metrics.get('accuracy_within_7_days', 0.0)
            
            # If accuracy is below threshold, recommend retraining
            if accuracy_within_7_days < 0.7:
                recommendation['retraining_recommended'] = True
                recommendation['performance_based_retraining'] = True
                recommendation['recommendation_reason'] = f'Model accuracy within 7 days is {accuracy_within_7_days:.2f}, below threshold of 0.7'
        
        # 3. Drift-based retraining
        if drift_results:
            drift_detected = drift_results.get('drift_detected', False)
            
            # If drift is detected, recommend retraining
            if drift_detected:
                recommendation['retraining_recommended'] = True
                recommendation['drift_based_retraining'] = True
                significant_features = drift_results.get('significant_features', [])
                recommendation['recommendation_reason'] = f'Feature drift detected in {", ".join(significant_features)}'
        
        return recommendation
    except Exception as e:
        logger.error(f"Error making retraining recommendation: {str(e)}")
        return {
            'retraining_recommended': False,
            'schedule_based_retraining': False,
            'performance_based_retraining': False,
            'drift_based_retraining': False,
            'recommendation_reason': f'Error making recommendation: {str(e)}',
            'decision_date': datetime.now().isoformat()
        }

def store_prediction_outcomes(predictions_df: pd.DataFrame) -> bool:
    """Store prediction outcomes in the database."""
    try:
        if predictions_df.empty:
            logger.warning("No prediction outcomes to store")
            return False
            
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        cursor = conn.cursor()
        
        # Check if PredictionOutcomes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PredictionOutcomes'")
        has_outcomes_table = cursor.fetchone() is not None
        
        if not has_outcomes_table:
            logger.warning("PredictionOutcomes table does not exist")
            conn.close()
            return False
            
        # Store each prediction outcome
        outcomes_stored = 0
        for _, row in predictions_df.iterrows():
            outcome_id = f"outcome-{uuid.uuid4()}"
            
            # Check if this prediction outcome already exists
            cursor.execute(
                "SELECT COUNT(*) FROM PredictionOutcomes WHERE PredictionID = ?",
                (row['PredictionID'],)
            )
            if cursor.fetchone()[0] > 0:
                continue  # Skip if already exists
                
            cursor.execute('''
            INSERT INTO PredictionOutcomes (
                OutcomeID, PredictionID, TaxFileID, ConfidenceScore, ModelVersion,
                PredictedAvailabilityDate, PredictedTransitionDays, ActualTransitionDays,
                ErrorDays, InputFeatures, CreatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                outcome_id,
                row['PredictionID'],
                row['TaxFileID'],
                row['ConfidenceScore'],
                row['ModelVersion'],
                row['PredictedAvailabilityDate'],
                row['PredictedTransitionDays'],
                row['ActualTransitionDays'],
                row['ErrorDays'],
                json.dumps(row['InputFeatures']),
                datetime.now().isoformat()
            ))
            outcomes_stored += 1
            
        conn.commit()
        conn.close()
        
        logger.info(f"Stored {outcomes_stored} prediction outcomes")
        return True
    except Exception as e:
        logger.error(f"Error storing prediction outcomes: {str(e)}")
        return False

def store_monitoring_results(
    model_id: str,
    performance_metrics: Dict[str, Any],
    drift_results: Dict[str, Any],
    recommendation: Dict[str, Any]
) -> bool:
    """Store monitoring results in the database."""
    try:
        conn = sqlite3.connect(OFFLINE_DB_PATH)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ModelPerformance'")
        has_performance_table = cursor.fetchone() is not None
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='FeatureDrift'")
        has_drift_table = cursor.fetchone() is not None
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='RetrainingDecisions'")
        has_decisions_table = cursor.fetchone() is not None
        
        # Store performance metrics
        performance_id = None
        if has_performance_table and performance_metrics:
            performance_id = f"perf-{uuid.uuid4()}"
            cursor.execute('''
            INSERT INTO ModelPerformance (
                PerformanceID, ModelID, EvaluationDate, DataPartition,
                EvaluationPeriod, SampleSize, MeanAbsoluteErrorDays,
                AccuracyWithin7Days, ConfidenceScoreCorrelation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                performance_id,
                model_id,
                performance_metrics.get('evaluation_date', datetime.now().isoformat()),
                'production',
                f"Recent {performance_metrics.get('sample_size', 0)} predictions",
                performance_metrics.get('sample_size', 0),
                performance_metrics.get('mae', 0.0),
                performance_metrics.get('accuracy_within_7_days', 0.0),
                performance_metrics.get('confidence_score_correlation', 0.0)
            ))
            logger.info(f"Stored performance metrics with ID {performance_id}")
        
        # Store drift results
        drift_id = None
        if has_drift_table and drift_results:
            drift_id = f"drift-{uuid.uuid4()}"
            cursor.execute('''
            INSERT INTO FeatureDrift (
                DriftID, ModelID, DetectionDate, FeatureDriftScore,
                DriftDetected, SignificantFeatures, SampleSize,
                BaselineStartDate, BaselineEndDate, CurrentStartDate, CurrentEndDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                drift_id,
                model_id,
                drift_results.get('detection_date', datetime.now().isoformat()),
                drift_results.get('drift_score', 0.0),
                1 if drift_results.get('drift_detected', False) else 0,
                json.dumps(drift_results.get('significant_features', [])),
                drift_results.get('sample_size', 0),
                (datetime.now() - timedelta(days=90)).isoformat(),
                (datetime.now() - timedelta(days=30)).isoformat(),
                (datetime.now() - timedelta(days=30)).isoformat(),
                datetime.now().isoformat()
            ))
            logger.info(f"Stored drift results with ID {drift_id}")
        
        # Store retraining recommendation
        if has_decisions_table and recommendation:
            decision_id = f"decision-{uuid.uuid4()}"
            cursor.execute('''
            INSERT INTO RetrainingDecisions (
                DecisionID, ModelID, DecisionDate, ScheduleBasedRetraining,
                PerformanceBasedRetraining, DriftBasedRetraining,
                RetrainingRecommended, RecommendationReason, LastTrainingDate,
                PerformanceMetricID, DriftMetricID, DecisionMadeBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                decision_id,
                model_id,
                recommendation.get('decision_date', datetime.now().isoformat()),
                1 if recommendation.get('schedule_based_retraining', False) else 0,
                1 if recommendation.get('performance_based_retraining', False) else 0,
                1 if recommendation.get('drift_based_retraining', False) else 0,
                1 if recommendation.get('retraining_recommended', False) else 0,
                recommendation.get('recommendation_reason', ''),
                datetime.now().isoformat(),  # Placeholder for last training date
                performance_id,
                drift_id,
                'model_monitoring'
            ))
            logger.info(f"Stored retraining recommendation with ID {decision_id}")
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error storing monitoring results: {str(e)}")
        return False

def run_model_monitoring() -> bool:
    """Run the complete model monitoring process."""
    logger.info("Starting model monitoring process")
    
    try:
        # Get active model ID
        model_id = get_active_model_id()
        if not model_id:
            logger.warning("No active model found")
            return False
        
        logger.info(f"Monitoring model {model_id}")
        
        # Get model metadata
        model_metadata = get_model_metadata(model_id)
        
        # Get recent predictions with outcomes from online database
        # This would normally be a separate ETL process that copies data from online to offline
        # For this example, we'll simulate it by directly querying the online database
        online_db_path = os.environ.get('ONLINE_DB_PATH', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../service/db/tax_refund.db')))
        
        try:
            # Connect to online database
            online_conn = sqlite3.connect(online_db_path)
            
            # Calculate cutoff date
            cutoff_date = (datetime.now() - timedelta(days=30)).isoformat()
            
            # Query to get predictions with outcomes
            query = """
            SELECT
                p.PredictionID,
                p.TaxFileID,
                p.ConfidenceScore,
                p.ModelVersion,
                p.PredictedAvailabilityDate,
                p.InputFeatures,
                p.CreatedAt as PredictionDate,
                e1.StatusUpdateDate as SourceDate,
                e2.StatusUpdateDate as TargetDate,
                julianday(e2.StatusUpdateDate) - julianday(e1.StatusUpdateDate) as ActualTransitionDays,
                julianday(p.PredictedAvailabilityDate) - julianday(e1.StatusUpdateDate) as PredictedTransitionDays
            FROM
                TaxRefundPredictions p
            JOIN
                TaxProcessingEvents e1 ON p.TaxFileID = e1.TaxFileID AND e1.NewStatus = 'Processing'
            JOIN
                TaxProcessingEvents e2 ON p.TaxFileID = e2.TaxFileID AND e2.NewStatus = 'Approved' AND e1.StatusUpdateDate < e2.StatusUpdateDate
            WHERE
                p.CreatedAt > ? AND
                p.TaxFileID != 'api-request'
            ORDER BY
                p.CreatedAt DESC
            """
            
            online_df = pd.read_sql_query(query, online_conn, params=(cutoff_date,))
            online_conn.close()
            
            if not online_df.empty:
                # Parse InputFeatures JSON
                online_df['InputFeatures'] = online_df['InputFeatures'].apply(lambda x: json.loads(x) if x else {})
                
                # Calculate error days
                online_df['ErrorDays'] = online_df['PredictedTransitionDays'] - online_df['ActualTransitionDays']
                
                # Store prediction outcomes in offline database
                store_prediction_outcomes(online_df)
                
                logger.info(f"Processed {len(online_df)} prediction outcomes from online database")
            else:
                logger.warning("No recent predictions with outcomes found in online database")
        except Exception as e:
            logger.error(f"Error processing online database data: {str(e)}")
        
        # Now get prediction outcomes from offline database
        predictions_df = get_recent_predictions_with_outcomes()
        
        # Evaluate model performance
        performance_metrics = evaluate_model_performance(predictions_df)
        
        # Get training data sample
        training_df = get_training_data_sample()
        
        # Extract features from recent predictions
        recent_features_df = extract_features_from_predictions(predictions_df)
        
        # Detect feature drift
        drift_results = detect_feature_drift(training_df, recent_features_df)
        
        # Make retraining recommendation
        recommendation = make_retraining_recommendation(
            performance_metrics, drift_results, model_metadata
        )
        
        # Store monitoring results
        store_monitoring_results(
            model_id, performance_metrics, drift_results, recommendation
        )
        
        logger.info("Model monitoring completed successfully")
        return True
    except Exception as e:
        logger.error(f"Model monitoring failed: {str(e)}")
        return False

if __name__ == "__main__":
    run_model_monitoring()