-- Tax Refund Status Service Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    UserID TEXT PRIMARY KEY,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TaxFiles table
CREATE TABLE IF NOT EXISTS TaxFiles (
    TaxFileID TEXT PRIMARY KEY,
    UserID TEXT,
    TaxYear INTEGER,
    FilingType TEXT,
    DateOfFiling TIMESTAMP,
    TaxCategories TEXT,  -- JSON
    DeductionCategories TEXT,  -- JSON
    ClaimedRefundAmount DECIMAL,
    GeographicRegion TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- TaxProcessingEvents table
CREATE TABLE IF NOT EXISTS TaxProcessingEvents (
    EventID TEXT PRIMARY KEY,
    TaxFileID TEXT,
    OldStatus TEXT,
    NewStatus TEXT,
    StatusDetails TEXT,
    StatusUpdateDate TIMESTAMP,
    UpdateSource TEXT,
    ActionRequired TEXT,
    ProcessingCenter TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TaxFileID) REFERENCES TaxFiles(TaxFileID)
);

-- TaxRefundPredictions table
CREATE TABLE IF NOT EXISTS TaxRefundPredictions (
    PredictionID TEXT PRIMARY KEY,
    TaxFileID TEXT,
    ConfidenceScore DECIMAL,
    ModelVersion TEXT,
    PredictedAvailabilityDate DATE,
    InputFeatures TEXT,  -- JSON
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TaxFileID) REFERENCES TaxFiles(TaxFileID)
);

-- IRSTransitionEstimates table (for AI model training)
CREATE TABLE IF NOT EXISTS IRSTransitionEstimates (
    EstimateID TEXT PRIMARY KEY,
    SourceStatus TEXT,
    TargetStatus TEXT,
    FilingType TEXT,
    TaxYear INTEGER,
    TaxCategories TEXT,  -- JSON
    DeductionCategories TEXT,  -- JSON
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