-- Tax Refund Analytics Database Schema

-- Raw data for training and evaluation
CREATE TABLE IF NOT EXISTS TrainingData (
    RecordID TEXT PRIMARY KEY,
    TaxFileID TEXT,
    FilingType TEXT,
    TaxYear INTEGER,
    TaxCategories TEXT,  -- JSON
    DeductionCategories TEXT,  -- JSON
    ClaimedRefundAmount DECIMAL,
    GeographicRegion TEXT,
    ProcessingCenter TEXT,
    FilingPeriod TEXT,
    SourceStatus TEXT,
    TargetStatus TEXT,
    ActualTransitionDays INTEGER,
    DataPartition TEXT,  -- 'training', 'validation', or 'test'
    ETLJobID TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated statistics for feature engineering
CREATE TABLE IF NOT EXISTS TransitionStatistics (
    StatID TEXT PRIMARY KEY,
    SegmentKey TEXT,  -- Composite key of dimensions used for grouping
    FilingType TEXT,
    TaxYear INTEGER,
    GeographicRegion TEXT,
    ProcessingCenter TEXT,
    FilingPeriod TEXT,
    SourceStatus TEXT,
    TargetStatus TEXT,
    RefundAmountBucket TEXT,  -- Added this column to match ETL process
    AvgTransitionDays DECIMAL,
    MedianTransitionDays INTEGER,
    P25TransitionDays INTEGER,
    P75TransitionDays INTEGER,
    MinTransitionDays INTEGER,
    MaxTransitionDays INTEGER,
    SampleSize INTEGER,
    SuccessRate DECIMAL,
    ComputationDate TIMESTAMP,
    ETLJobID TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML model metadata
CREATE TABLE IF NOT EXISTS MLModels (
    ModelID TEXT PRIMARY KEY,
    ModelVersion TEXT,
    Algorithm TEXT,
    Hyperparameters TEXT,  -- JSON
    FeatureList TEXT,  -- JSON
    TrainingDataSize INTEGER,
    TrainingStartDate TIMESTAMP,
    TrainingEndDate TIMESTAMP,
    CreatedBy TEXT,
    IsActive BOOLEAN,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model performance metrics
CREATE TABLE IF NOT EXISTS ModelPerformance (
    PerformanceID TEXT PRIMARY KEY,
    ModelID TEXT,
    EvaluationDate TIMESTAMP,
    DataPartition TEXT,  -- 'validation', 'test', or 'production'
    EvaluationPeriod TEXT,  -- e.g., '2025-05-01 to 2025-05-31'
    SampleSize INTEGER,
    MeanAbsoluteErrorDays DECIMAL,
    AccuracyWithin7Days DECIMAL,
    ConfidenceScoreCorrelation DECIMAL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ModelID) REFERENCES MLModels(ModelID)
);

-- Feature drift detection
CREATE TABLE IF NOT EXISTS FeatureDrift (
    DriftID TEXT PRIMARY KEY,
    ModelID TEXT,
    DetectionDate TIMESTAMP,
    FeatureDriftScore DECIMAL,
    DriftDetected BOOLEAN,
    SignificantFeatures TEXT,  -- JSON
    SampleSize INTEGER,
    BaselineStartDate TIMESTAMP,
    BaselineEndDate TIMESTAMP,
    CurrentStartDate TIMESTAMP,
    CurrentEndDate TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ModelID) REFERENCES MLModels(ModelID)
);

-- Retraining decisions
CREATE TABLE IF NOT EXISTS RetrainingDecisions (
    DecisionID TEXT PRIMARY KEY,
    ModelID TEXT,
    DecisionDate TIMESTAMP,
    ScheduleBasedRetraining BOOLEAN,
    PerformanceBasedRetraining BOOLEAN,
    DriftBasedRetraining BOOLEAN,
    RetrainingRecommended BOOLEAN,
    RecommendationReason TEXT,
    LastTrainingDate TIMESTAMP,
    PerformanceMetricID TEXT,  -- Reference to ModelPerformance
    DriftMetricID TEXT,  -- Reference to FeatureDrift
    DecisionMadeBy TEXT,  -- 'automatic' or 'manual'
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ModelID) REFERENCES MLModels(ModelID),
    FOREIGN KEY (PerformanceMetricID) REFERENCES ModelPerformance(PerformanceID),
    FOREIGN KEY (DriftMetricID) REFERENCES FeatureDrift(DriftID)
);

-- Legacy table for backward compatibility
CREATE TABLE IF NOT EXISTS IRSTransitionEstimates (
    EstimateID TEXT PRIMARY KEY,
    SourceStatus TEXT,
    TargetStatus TEXT,
    FilingType TEXT,
    TaxYear INTEGER,
    TaxCategories TEXT,
    DeductionCategories TEXT,
    RefundAmountBucket TEXT,
    GeographicRegion TEXT,
    ProcessingCenter TEXT,
    FilingPeriod TEXT,
    AvgTransitionDays DECIMAL,
    MedianTransitionDays INTEGER,
    P25TransitionDays INTEGER,
    P75TransitionDays INTEGER,
    MinTransitionDays INTEGER,
    MaxTransitionDays INTEGER,
    SampleSize INTEGER,
    SuccessRate DECIMAL,
    ComputationDate TIMESTAMP,
    DataPeriodStart DATE,
    DataPeriodEnd DATE,
    ETLJobID TEXT,
    DataQualityScore DECIMAL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);