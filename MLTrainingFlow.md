# Tax Refund Prediction ML Pipeline

This document outlines the complete machine learning pipeline for the Tax Refund Status Service, from data extraction to model monitoring and retraining.

## 1. Data Flow Overview

```
┌─────────────────┐     ETL     ┌─────────────────┐    Training    ┌─────────────────┐
│  Online DB      │────────────▶│  Offline DB     │───────────────▶│  ML Model       │
│  (Operational)  │             │  (Analytics)    │               │  Training       │
└─────────────────┘             └─────────────────┘               └─────────────────┘
                                                                          │
                                                                          │
                                                                          ▼
┌─────────────────┐             ┌─────────────────┐               ┌─────────────────┐
│  User Interface │◀────────────│  Model          │◀──────────────│  Model          │
│  (Predictions)  │  Inference  │  Hosting        │   Deployment  │  Artifacts      │
└─────────────────┘             └─────────────────┘               └─────────────────┘
        │                               ▲                                 
        │                               │                                 
        └───────────────────────────────┼─────────────────────────────────
                                        │
                                        │
                                ┌───────┴───────┐
                                │  Monitoring   │
                                │  & Evaluation │
                                └───────┬───────┘
                                        │
                                        │ Retrigger
                                        ▼
                                ┌───────────────┐
                                │  Retraining   │
                                │  Decision     │
                                └───────────────┘
```

## 2. ETL Process

### 2.1 Data Extraction

The ETL process begins by extracting data from the Online Database:

- **Source Tables**:
  - `TaxFiles`: Basic tax filing information
  - `TaxProcessingEvents`: Status changes and processing events
  - `TaxRefundPredictions`: Previous predictions and their outcomes

- **Extraction Logic**:
  - Joins `TaxProcessingEvents` to identify status transitions
  - Correlates with `TaxFiles` for contextual information
  - Includes `TaxRefundPredictions` to evaluate prediction accuracy

### 2.2 Data Transformation

The extracted data undergoes several transformations:

- **Feature Engineering**:
  - Creates `RefundAmountBucket` categories
  - Determines `FilingPeriod` (Early, Mid, Late)
  - Calculates `TransitionDays` between status changes

- **Statistical Aggregation**:
  - Groups by relevant dimensions (status, filing type, region, etc.)
  - Calculates transition time statistics (mean, median, percentiles)
  - Computes success rates and sample sizes

### 2.3 Data Loading

Transformed data is loaded into the Offline Database:

- **Target Table**: `IRSTransitionEstimates`
  - Contains aggregated statistics about transition times
  - Includes metadata about the ETL process
  - Serves as the primary training data source

- **Related Table**: `ModelPerformanceMetrics`
  - Populated during model evaluation
  - Used for monitoring and retraining decisions

## 3. Model Training Process

### 3.1 Training Data Preparation

- **Data Source**: `IRSTransitionEstimates` table in the Offline DB
- **Feature Selection**:
  - **Tax Information**:
    - TaxCategories (JSON): Income types, sources, and amounts
    - DeductionCategories (JSON): Claimed deductions and credits
  - **Filing Attributes**:
    - Filing type (e.g., individual, joint, business)
    - Tax year
    - Geographic region
  - **Processing Information**:
    - Refund amount bucket
    - Processing center
    - Filing period
  - **Historical Patterns**:
    - Previous success rates
    - Sample sizes from similar cases
- **Target Variable**: `MedianTransitionDays`

### 3.2 Model Architecture

- **Algorithm**: Random Forest Regressor
  - Handles non-linear relationships
  - Robust to outliers
  - Provides feature importance

- **Preprocessing Pipeline**:
  - JSON parsing for TaxCategories and DeductionCategories
  - Feature extraction from nested JSON structures
  - One-hot encoding for categorical features
  - Standardization for numerical features

### 3.3 Model Versioning

- Each trained model is versioned and stored
- Metadata is saved alongside the model
- Latest model is also stored as a reference point

## 4. Model Hosting and Deployment

### 4.1 Model Artifacts

- Trained model is serialized and stored
- Model metadata is saved with version information
- Preprocessing pipeline is included for consistent transformations

### 4.2 Deployment Process

- Model is deployed to a hosting environment
- API endpoints are created for prediction requests
- Health checks ensure model availability

### 4.3 Inference Service

- Handles prediction requests from the user interface
- Applies preprocessing to input data
- Returns predictions with confidence scores

## 5. Model Monitoring Framework

### 5.1 Performance Tracking

The system continuously evaluates model performance using the `ModelPerformanceMetrics` table:

- **Basic Metrics**:
  - Mean and median absolute error (days)
  - Accuracy within 3, 7, and 14 days
  - Confidence score correlation

- **Segment Analysis**:
  - Performance by refund amount
  - Performance by geographic region
  - Performance by filing type
  - Performance by tax category combinations

### 5.2 Feature Drift Detection and the Time Lag Problem

Feature drift detection addresses a critical challenge in refund prediction - the time lag between predictions and outcomes:

- **The Time Lag Challenge**:
  - When a prediction is made (e.g., "refund in 21 days"), you must wait those 21+ days to verify accuracy
  - During this waiting period, you continue making new predictions for other users
  - By the time you discover performance degradation, many potentially inaccurate predictions have already been made

- **Feature Drift Detection**:
  - Changes in the distribution of input features
  - Example: Sudden increase in certain deduction types or geographic regions
  - Detected by comparing recent feature distributions against training data
  - Can be identified immediately, before waiting for refund outcomes

- **Early Warning System**:
  - Feature drift detection serves as a leading indicator, while performance metrics are lagging indicators
  - Can detect changes in tax filing patterns before they impact refund processing
  - Allows for proactive model updates rather than reactive fixes after performance degrades

### 5.3 Monitoring Process

1. Daily job analyzes new tax filings for feature drift
2. Compares recent predictions with actual outcomes for performance metrics
3. Updates the `ModelPerformanceMetrics` table
4. Generates alerts if metrics fall below thresholds or significant feature drift is detected

## 6. Hybrid Retraining Framework

The system uses a hybrid approach to determine when to retrain the model:

### 6.1 Schedule-Based Retraining

- **Regular Cadence**: Monthly retraining
  - Ensures model stays current with latest data
  - Captures seasonal patterns and trends

### 6.2 Performance-Based Retraining

Triggers retraining based on metrics in `ModelPerformanceMetrics`:

- **Accuracy Threshold**:
  - Retrains if `AccuracyWithin7Days` drops below 70%
  - Retrains if error metrics show increasing trend

### 6.3 Drift-Based Retraining

Proactive retraining based on feature drift detection:

- **When to Use**: Even when current performance metrics look good
- **Why It Matters**: Prevents performance degradation before it happens
- **Example Scenario**:
  - IRS introduces new tax credits in January
  - Feature drift detection notices a significant increase in these credits in tax filings
  - Proactive retraining occurs before these new patterns affect performance
  - Prevents weeks of potentially inaccurate predictions for these new tax situations

### 6.4 Retraining Decision Logic

The `RetrainingRecommended` and `AlgorithmChangeRecommended` fields are updated based on:

1. Time since last retraining (`LastRetrainingDate`)
2. Performance metrics trends
3. Feature drift detection results
4. Segment analysis findings

## 7. Feedback Loop

### 7.1 Prediction Storage

Each prediction is stored in the `TaxRefundPredictions` table:

- Includes confidence score and model version
- Stores input features for later analysis
- Links to tax file for outcome tracking

### 7.2 Outcome Collection

As refunds are processed:

- `TaxProcessingEvents` records status changes
- Actual completion dates are captured
- These are compared with predicted dates

### 7.3 Continuous Improvement

The feedback loop enables:

1. Validation of model accuracy
2. Identification of systematic biases
3. Discovery of new predictive features
4. Refinement of confidence scoring

## 8. Implementation Considerations

### 8.1 Scheduled Jobs

- **ETL Job**: Runs daily to update offline database
- **Monitoring Job**: Runs daily to evaluate recent predictions
- **Retraining Evaluation**: Runs weekly to assess retraining needs
- **Model Retraining**: Runs monthly or when triggered by evaluation

### 8.2 Monitoring Dashboard

A dashboard visualizes:

- Performance trends over time
- Segment analysis heatmaps
- Feature drift indicators and alerts
- Model version comparisons

## 9. Table Relationships and Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  TaxFiles       │─────│  TaxProcessing  │─────│  TaxRefund      │
│  (Online DB)    │     │  Events         │     │  Predictions    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ETL Process                             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  IRSTransition  │
│  Estimates      │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Model Training │
│  (Hybrid)       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Model Hosting  │
│  & Deployment   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Monitoring     │
│  & Evaluation   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Model          │
│  Performance    │
│  Metrics        │
└─────────────────┘
         │
         └─────────────────┐
                           ▼
                   ┌───────────────┐
                   │  Retraining   │
                   │  Decision     │
                   └───────────────┘
```

This diagram illustrates how data flows sequentially through the ML pipeline, from the online database through ETL, training, hosting, monitoring, and finally back to retraining decisions.