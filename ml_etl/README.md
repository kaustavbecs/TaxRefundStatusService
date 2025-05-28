# Tax Refund Status ML & ETL Pipeline

This module contains the Machine Learning (ML) and Extract, Transform, Load (ETL) components for the Tax Refund Status Service.

## Overview

The ML & ETL pipeline performs the following tasks:

1. **ETL Process**: Extracts data from the online operational database, transforms it to calculate statistics for refund processing times, and loads it into the offline analytics database.

2. **Model Training**: Trains a machine learning model on the transformed data to predict tax refund processing times.

3. **API Service**: Hosts the trained model and provides an API for making predictions.

## Directory Structure

```
ml_etl/
├── data/
│   ├── raw/           # Raw data extracted from online database
│   └── processed/     # Processed data for model training
├── models/            # Trained ML models
├── src/
│   ├── etl/           # ETL process code
│   ├── ml/            # ML model training and API code
│   └── main.py        # Main orchestration script
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

### Running the ETL Process

```
python src/main.py --mode etl
```

This will:
- Extract data from the online database
- Transform it to calculate statistics
- Load it into the offline database

### Training the ML Model

```
python src/main.py --mode train
```

This will:
- Load data from the offline database
- Train a machine learning model
- Save the trained model to the models directory

### Starting the API Service

```
python src/main.py --mode api
```

This will:
- Load the trained model
- Start a FastAPI server to serve predictions

### Running the Complete Pipeline

```
python src/main.py --mode all
```

This will run the ETL process, train the model, and start the API service.

### Scheduling the Pipeline

```
python src/main.py --schedule --interval 24
```

This will schedule the ETL process and model training to run every 24 hours.

## API Endpoints

- `GET /health`: Health check endpoint
- `GET /metadata`: Get model metadata
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

## Future Enhancements

- Implement more sophisticated ML models (e.g., neural networks)
- Add feature engineering to improve prediction accuracy
- Implement A/B testing for model comparison
- Add monitoring and alerting for model performance
- Containerize the ML & ETL pipeline for easier deployment