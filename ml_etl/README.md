# Tax Refund Status ML & ETL Pipeline

This module contains the Machine Learning (ML) and Extract, Transform, Load (ETL) components for the Tax Refund Status Service.

## Overview

The ML & ETL pipeline performs the following tasks:

1. **ETL Process**: Extracts data from the online operational database, transforms it to calculate statistics for refund processing times, and loads it into the offline analytics database.

2. **Model Training**: Trains a machine learning model on the transformed data to predict tax refund processing times.

3. **Model Monitoring**: Continuously evaluates model performance, detects feature drift, and makes retraining recommendations.

4. **API Service**: Hosts the trained model and provides an API for making predictions.

## Directory Structure

```
ml_etl/
├── data/
│   ├── raw/           # Raw data extracted from online database
│   └── processed/     # Processed data for model training
│   └── schema.sql     # Database schema for offline analytics database
├── models/            # Trained ML models and metadata
├── logs/              # Log files
├── src/
│   ├── etl/           # ETL process code
│   ├── ml/            # ML model training, monitoring, and API code
│   └── main.py        # Main orchestration script
├── train_ml_model.sh  # Script to run ETL and train ML model
├── host_ml_model.sh   # Script to host the ML model API
└── requirements.txt   # Python dependencies
```

## Requirements

- Python 3.8+
- Dependencies listed in `requirements.txt`

## Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Using the Convenience Scripts

Two shell scripts are provided for easier usage:

#### 1. `train_ml_model.sh` - ETL, Monitoring, and ML Training

This script handles the data extraction, transformation, loading (ETL), model monitoring, and model training processes:

```
./ml_etl/train_ml_model.sh
```

This will:
- Set up the Python environment
- Initialize the database with sample data
- Run the ETL process to prepare data for training
- Run the model monitoring process
- Train the ML model
- Save the model to the models directory

Use this script when you want to:
- Initialize or refresh the database
- Process new data for training
- Train or retrain the ML model

#### 2. `host_ml_model.sh` - Model Hosting

This script starts the API server to host the latest trained model:

```
./ml_etl/host_ml_model.sh
```

This will:
- Verify that the model exists
- Set up the Python environment
- Start the ML API server in the foreground
- Serve prediction requests for tax refund processing times

Use this script when you want to:
- Host the ML model for inference
- Make the API available for prediction requests
- Test the model with new data

### Using Python Directly

If you need more control, you can use the Python script directly:

#### Running the ETL Process

```
python src/main.py --mode etl
```

This will:
- Extract data from the online database
- Transform it to calculate statistics
- Load it into the offline database

#### Running Model Monitoring

```
python src/main.py --mode monitor
```

This will:
- Extract prediction outcomes from the online database
- Store them in the PredictionOutcomes table
- Evaluate model performance
- Detect feature drift
- Make retraining recommendations

#### Training the ML Model

```
python src/main.py --mode train
```

This will:
- Load data from the offline database
- Train a machine learning model
- Save the trained model to the models directory

#### Starting the API Service

```
python src/main.py --mode api
```

This will:
- Load the trained model
- Start a FastAPI server to serve predictions

#### Running the Complete Pipeline

```
python src/main.py --mode all
```

This will run the ETL process, model monitoring, train the model, and start the API service.

#### Scheduling the Pipeline

```
python src/main.py --schedule --interval 24
```

This will schedule the ETL process and model training to run every 24 hours.

## Database Schema

The offline database includes the following tables:

1. **TrainingData**: Raw data for training and evaluation
2. **TransitionStatistics**: Aggregated statistics for feature engineering
3. **MLModels**: ML model metadata
4. **PredictionOutcomes**: Individual prediction results with actual outcomes
5. **ModelPerformance**: Aggregated performance metrics
6. **FeatureDrift**: Feature drift detection results
7. **RetrainingDecisions**: Records of retraining decisions

## API Endpoints

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
  "model_version": "1.0"
}
```

## Integration with Main Service

The main Tax Refund Status Service integrates with this ML & ETL pipeline by:

1. Providing access to the online database for the ETL process
2. Making API calls to the ML model service for predictions
3. Displaying the predictions to users in the UI

## Model Monitoring

The model monitoring component performs the following tasks:

1. **Prediction Outcome Collection**:
   - Extracts prediction data from the online database
   - Stores individual prediction outcomes in the PredictionOutcomes table
   - Tracks actual vs. predicted transition days

2. **Performance Evaluation**:
   - Compares predicted transition days with actual outcomes
   - Calculates accuracy within 3, 7, and 14 days
   - Evaluates confidence score correlation

3. **Feature Drift Detection**:
   - Compares feature distributions between training data and recent predictions
   - Uses statistical tests to identify significant drift
   - Calculates overall drift score

4. **Retraining Recommendations**:
   - Schedule-based: Recommends retraining after 30 days
   - Performance-based: Recommends retraining if accuracy drops below threshold
   - Drift-based: Recommends retraining if significant feature drift is detected

## Future Enhancements

- Implement more sophisticated ML models (e.g., neural networks)
- Add feature engineering to improve prediction accuracy
- Implement A/B testing for model comparison
- Add automated model retraining based on recommendations
- Containerize the ML & ETL pipeline for easier deployment