Slide 1: Tax Refund DB (Online)
Real-Time Operational Database

Users
=====
UserID: UUID (PK)
SSN: String (Encrypted, Unique)
CreatedAt: Timestamp
UpdatedAt: Timestamp


TaxFiles
====

TaxFileID: UUID (PK)
UserID: UUID (FK)
TaxYear: Integer
FilingType: String
DateOfFiling: Timestamp
TaxCategories: JSON
DeductionCategories: JSON
ClaimedRefundAmount: Decimal
GeographicRegion: String
CreatedAt: Timestamp

TaxProcessingEvents
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

TaxRefundPredictions
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
IRSTransitionEstimates

Online Attributes (from operational DB)
====
EstimateID: UUID (PK)
SourceStatus: String
TargetStatus: String
FilingType: String
TaxYear: Integer
TaxCategories: JSON
DeductionCategories: JSON
RefundAmountBucket: String
GeographicRegion: String
ProcessingCenter: String
FilingPeriod: String

Computed Statistics (calculated during ETL)
====
AvgTransitionDays: Decimal
MedianTransitionDays: Integer
P25TransitionDays: Integer
P75TransitionDays: Integer
MinTransitionDays: Integer
MaxTransitionDays: Integer
SampleSize: Integer
SuccessRate: Decimal

Metadata (ETL control and audit)
====
ComputationDate: Timestamp
DataPeriodStart: Date
DataPeriodEnd: Date
ETLJobID: UUID
DataQualityScore: Decimal
CreatedAt: Timestamp