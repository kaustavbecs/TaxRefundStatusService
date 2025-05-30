# Enhanced Tax Refund Status ML & ETL Pipeline

This module contains the enhanced Machine Learning (ML) and Extract, Transform, Load (ETL) components for the Tax Refund Status Service, with improved model monitoring and retraining capabilities.

## Overview

The enhanced ML & ETL pipeline performs the following tasks:

1. **ETL Process**: Extracts data from the online operational database, transforms it into both raw training data and aggregated statistics, and loads it into the offline analytics database.

2. **Model Training**: Trains a machine learning model on the transformed data to predict tax refund processing times.

3. **Model Monitoring**: Continuously evaluates model performance, detects feature drift, and makes retraining recommendations.

4. **API Service**: Hosts the trained model and provides an API for making predictions.

## Key Enhancements

The enhanced pipeline includes several improvements over the original version:

1. **Improved Database Schema**:
   - Separation of raw training data from aggregated statistics
   - Proper model metadata and versioning
   - Performance metrics tracking
   - Feature drift detection
   - Retraining decision logging

2. **Model Monitoring**:
   - Continuous evaluation of model performance on recent predictions
   - Detection of feature drift between training data and recent predictions
   - Intelligent retraining recommendations based on schedule, performance, and drift

3. **Hybrid Retraining Framework**:
   - Schedule-based retraining (time-triggered)
   - Performance-based retraining (accuracy-triggered)
   - Drift-based retraining (feature distribution-triggered)

## Directory Structure

```
ml_etl/
├── data/
│   ├── raw/           # Raw data extracted from online database
│   ├── processed/     # Processed data for model training
│   └── schema.sql     # Database schema for offline analytics database
├── models/            # Trained ML models and metadata
├── logs/              # Log files
├── src/
│   ├── etl/
│   │   ├── etl_process.py       # Original ETL process
│   │   └── etl_process_new.py   # Enhanced ETL process
│   ├── ml/
│   │   ├── model_training.py       # Original model training
│   │   ├── model_training_new.py   # Enhanced model training
│   │   ├── model_api.py            # Original model API
│   │   ├── model_api_new.py        # Enhanced model API
│   │   └── model_monitoring.py     # New model monitoring component
│   ├── main.py        # Original orchestration script
│   └── main_new.py    # Enhanced orchestration script
├── train_ml_model.sh       # Original training script
├── train_ml_model_new.sh   # Enhanced training script
├── host_ml_model.sh        # Original hosting script
├── host_ml_model_new.sh    # Enhanced hosting script
└── requirements.txt        # Python dependencies
```

## Database Schema

The enhanced offline database includes the following tables:

1. **TrainingData**: Raw data for training and evaluation
   - Individual tax file records with actual transition days
   - Partitioned into training, validation, and test sets

2. **TransitionStatistics**: Aggregated statistics for feature engineering
   - Grouped by various dimensions (filing type, region, etc.)
   - Includes transition time statistics (mean, median, percentiles)

3. **MLModels**: ML model metadata
   - Model versions, algorithms, and hyperparameters
   - Training data size and dates

4. **ModelPerformance**: Performance metrics for each model evaluation
   - Accuracy, error metrics, and confidence score correlation
   - Separate records for validation, test, and production data

5. **FeatureDrift**: Feature drift detection results
   - Drift scores and significant features
   - Baseline and current period information

6. **RetrainingDecisions**: Records of retraining decisions
   - Schedule-based, performance-based, and drift-based triggers
   - Recommendations and reasons

7. **IRSTransitionEstimates**: Legacy table for backward compatibility

## Usage

### Using the Enhanced Scripts

Two shell scripts are provided for easier usage:

#### 1. `train_ml_model_new.sh` - ETL, Monitoring, and ML Training

This script handles the data extraction, transformation, loading (ETL), model monitoring, and model training processes:

```
./ml_etl/train_ml_model_new.sh
```

This will:
- Set up the Python environment
- Initialize the database schema
- Initialize the online database with sample data
- Run the ETL process to prepare data for training
- Run the model monitoring process
- Train the ML model
- Save the model to the models directory

#### 2. `host_ml_model_new.sh` - Model Hosting

This script starts the API server to host the latest trained model:

```
./ml_etl/host_ml_model_new.sh
```

This will:
- Verify that the model exists
- Set up the Python environment
- Start the ML API server in the foreground
- Serve prediction requests for tax refund processing times

### Using Python Directly

If you need more control, you can use the Python script directly:

#### Running the ETL Process

```
python src/main_new.py --mode etl
```

#### Running Model Monitoring

```
python src/main_new.py --mode monitor
```

#### Training the ML Model

```
python src/main_new.py --mode train
```

#### Starting the API Service

```
python src/main_new.py --mode api
```

#### Running the Complete Pipeline

```
python src/main_new.py --mode all
```

#### Scheduling the Pipeline

```
python src/main_new.py --schedule --interval 24
```

This will schedule the ETL process, model monitoring, and model training to run every 24 hours.

## API Endpoints

The enhanced API includes the following endpoints:

- `GET /health`: Health check endpoint with model and database status
- `GET /metadata`: Get model metadata
- `GET /performance`: Get model performance metrics
- `GET /drift`: Get feature drift information
- `POST /predict`: Make a prediction

### Example Prediction Request

```json
{
  "filing_type": "Individual",
  "tax_year": 2024,
  "refund_amount": 2500.0,
  "geographic_region": "Northeast",
  "processing_center": "Northeast Center",
  "filing_period": "Early",
  "source_status": "Processing",
  "target_status": "Approved"
}
```

### Example Prediction Response

```json
{
  "estimated_days": 21,
  "confidence_score": 0.85,
  "predicted_date": "2024-06-18",
  "model_version": "v5"
}
```

## Model Monitoring

The model monitoring component performs the following tasks:

1. **Performance Evaluation**:
   - Compares predicted transition days with actual outcomes
   - Calculates accuracy within 3, 7, and 14 days
   - Evaluates confidence score correlation

2. **Feature Drift Detection**:
   - Compares feature distributions between training data and recent predictions
   - Uses statistical tests to identify significant drift
   - Calculates overall drift score

3. **Retraining Recommendations**:
   - Schedule-based: Recommends retraining after 30 days
   - Performance-based: Recommends retraining if accuracy drops below threshold
   - Drift-based: Recommends retraining if significant feature drift is detected

## Hybrid Retraining Framework

The hybrid retraining framework uses three triggers to determine when to retrain the model:

1. **Schedule-Based Retraining**:
   - Regular cadence (e.g., monthly)
   - Ensures model stays current with latest data
   - Captures seasonal patterns and trends

2. **Performance-Based Retraining**:
   - Triggered when accuracy drops below threshold
   - Reactive approach based on observed performance
   - Addresses model degradation after it occurs

3. **Drift-Based Retraining**:
   - Proactive approach based on feature drift
   - Detects changes in tax filing patterns before they impact performance
   - Prevents performance degradation before it happens

## Integration with Main Service

The main Tax Refund Status Service integrates with this ML & ETL pipeline by:

1. Providing access to the online database for the ETL process
2. Making API calls to the ML model service for predictions
3. Displaying the predictions to users in the UI

## Future Enhancements

- Implement A/B testing for model comparison
- Add more sophisticated drift detection algorithms
- Implement automated model retraining based on recommendations
- Add explainability features to the API
- Containerize the ML & ETL pipeline for easier deployment