Slide 1: Tax Refund DB (Online)
Real-Time Operational Database

Table: Users
=====
UserID: UUID (PK)
SSN: String (Encrypted, Unique)
CreatedAt: Timestamp
UpdatedAt: Timestamp


Table: TaxFiles
====
TaxFileID: UUID (PK)
UserID: UUID (FK)
TaxYear: Integer
FilingType: Enum
DateOfFiling: Timestamp
TaxCategories: JSON
DeductionCategories: JSON
ClaimedRefundAmount: Decimal
GeographicRegion: String
CreatedAt: Timestamp

Table: TaxProcessingEvents
====
EventID: UUID (PK)
TaxFileID: UUID (FK)
OldStatus: String
NewStatus: String
StatusDetails: Text
StatusUpdateDate: Timestamp
UpdateSource: String
ActionRequired: Text
ProcessingCenter: String
CreatedAt: Timestamp

Table: TaxRefundPredictions
====
PredictionID: UUID (PK)
TaxFileID: UUID (FK)
ConfidenceScore: Decimal
ModelVersion: String
PredictedAvailabilityDate: Date
InputFeatures: JSON
CreatedAt: Timestamp


Slide 2: Tax Refund Analytics DB (Offline)
AI Training & Analytics Database

# Raw data for training and evaluation
Table: TrainingData
====
RecordID: UUID (PK)
TaxFileID: UUID
FilingType: Enum
TaxYear: Integer
TaxCategories: JSON
DeductionCategories: JSON
ClaimedRefundAmount: Decimal
GeographicRegion: String
ProcessingCenter: String
FilingPeriod: String
SourceStatus: String
TargetStatus: String
ActualTransitionDays: Integer
DataPartition: String  # 'training', 'validation', or 'test'
ETLJobID: UUID
CreatedAt: Timestamp

# Aggregated statistics for feature engineering
Table: TransitionStatistics
====
StatID: UUID (PK)
SegmentKey: String  # Composite key of dimensions used for grouping
FilingType: Enum
TaxYear: Integer
GeographicRegion: String
ProcessingCenter: String
FilingPeriod: String
SourceStatus: String
TargetStatus: String
AvgTransitionDays: Decimal
MedianTransitionDays: Integer
P25TransitionDays: Integer
P75TransitionDays: Integer
MinTransitionDays: Integer
MaxTransitionDays: Integer
SampleSize: Integer
SuccessRate: Decimal
ComputationDate: Timestamp
ETLJobID: UUID
CreatedAt: Timestamp

# ML model metadata
Table: MLModels
====
ModelID: UUID (PK)
ModelVersion: String
Algorithm: String
Hyperparameters: JSON
FeatureList: JSON
TrainingDataSize: Integer
TrainingStartDate: Timestamp
TrainingEndDate: Timestamp
CreatedBy: String
IsActive: Boolean
CreatedAt: Timestamp

# Model performance metrics
Table: ModelPerformance
====
PerformanceID: UUID (PK)
ModelID: UUID (FK)
EvaluationDate: Timestamp
DataPartition: String  # 'validation', 'test', or 'production'
EvaluationPeriod: String  # e.g., '2025-05-01 to 2025-05-31'
SampleSize: Integer
MeanAbsoluteErrorDays: Decimal
AccuracyWithin7Days: Decimal
ConfidenceScoreCorrelation: Decimal
CreatedAt: Timestamp

# Feature drift detection
Table: FeatureDrift
====
DriftID: UUID (PK)
ModelID: UUID (FK)
DetectionDate: Timestamp
FeatureDriftScore: Decimal
DriftDetected: Boolean
SignificantFeatures: JSON
SampleSize: Integer
BaselineStartDate: Timestamp
BaselineEndDate: Timestamp
CurrentStartDate: Timestamp
CurrentEndDate: Timestamp
CreatedAt: Timestamp

# Prediction outcomes for model monitoring
Table: PredictionOutcomes
====
OutcomeID: UUID (PK)
PredictionID: UUID
TaxFileID: UUID
ConfidenceScore: Decimal
ModelVersion: String
PredictedAvailabilityDate: Date
PredictedTransitionDays: Integer
ActualTransitionDays: Integer
ErrorDays: Integer
InputFeatures: JSON
CreatedAt: Timestamp

# Retraining decisions
Table: RetrainingDecisions
====
DecisionID: UUID (PK)
ModelID: UUID (FK)
DecisionDate: Timestamp
ScheduleBasedRetraining: Boolean
PerformanceBasedRetraining: Boolean
DriftBasedRetraining: Boolean
RetrainingRecommended: Boolean
RecommendationReason: String
LastTrainingDate: Timestamp
PerformanceMetricID: UUID  # Reference to ModelPerformance
DriftMetricID: UUID  # Reference to FeatureDrift
DecisionMadeBy: String  # 'automatic' or 'manual'
CreatedAt: Timestamp