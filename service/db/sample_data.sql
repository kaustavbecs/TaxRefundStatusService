-- Sample data for Tax Refund Status Service

-- Sample Users
INSERT INTO Users (UserID, SSN) VALUES
('user-001', 'encrypted-ssn-001'),
('user-002', 'encrypted-ssn-002'),
('user-003', 'encrypted-ssn-003'),
('user-004', 'encrypted-ssn-004'),
('user-005', 'encrypted-ssn-005');

-- Sample TaxFiles
INSERT INTO TaxFiles (TaxFileID, UserID, TaxYear, FilingType, DateOfFiling, TaxCategories, DeductionCategories, ClaimedRefundAmount, GeographicRegion) VALUES
('taxfile-001', 'user-001', 2024, 'Individual', '2024-02-15 10:30:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 2500.00, 'Northeast'),
('taxfile-002', 'user-002', 2024, 'Individual', '2024-02-20 14:45:00', '{"income": "W2", "investments": "no"}', '{"mortgage": "no", "student_loans": "yes"}', 1800.00, 'West'),
('taxfile-003', 'user-003', 2024, 'Joint', '2024-03-01 09:15:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "no"}', 3200.00, 'South'),
('taxfile-004', 'user-004', 2024, 'Individual', '2024-03-10 16:20:00', '{"income": "1099", "investments": "yes"}', '{"mortgage": "no", "student_loans": "no"}', 1200.00, 'Midwest'),
('taxfile-005', 'user-005', 2024, 'Joint', '2024-03-15 11:00:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 4500.00, 'West'),
('taxfile-006', 'user-001', 2023, 'Individual', '2023-03-10 13:25:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 2200.00, 'Northeast');

-- Sample TaxProcessingEvents
-- Status types: "Submitted", "Processing", "Needs Action", "Approved"
INSERT INTO TaxProcessingEvents (EventID, TaxFileID, OldStatus, NewStatus, StatusDetails, StatusUpdateDate, UpdateSource, ActionRequired, ProcessingCenter) VALUES
-- Approved case
('event-001', 'taxfile-001', NULL, 'Submitted', 'Tax filing received', '2024-02-15 10:30:00', 'IRS', NULL, 'Northeast Center'),
('event-002', 'taxfile-001', 'Submitted', 'Processing', 'Tax filing under review', '2024-02-20 09:45:00', 'IRS', NULL, 'Northeast Center'),
('event-003', 'taxfile-001', 'Processing', 'Approved', 'Refund approved', '2024-03-15 14:30:00', 'IRS', NULL, 'Northeast Center'),

-- Processing case
('event-004', 'taxfile-002', NULL, 'Submitted', 'Tax filing received', '2024-02-20 14:45:00', 'IRS', NULL, 'West Center'),
('event-005', 'taxfile-002', 'Submitted', 'Processing', 'Tax filing under review', '2024-02-25 10:15:00', 'IRS', NULL, 'West Center'),

-- Needs Action case
('event-006', 'taxfile-003', NULL, 'Submitted', 'Tax filing received', '2024-03-01 09:15:00', 'IRS', NULL, 'South Center'),
('event-007', 'taxfile-003', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-05 11:30:00', 'IRS', NULL, 'South Center'),
('event-008', 'taxfile-003', 'Processing', 'Needs Action', 'Additional information required', '2024-03-20 15:45:00', 'IRS', 'Please provide missing W-2 form', 'South Center'),

-- Submitted case
('event-009', 'taxfile-004', NULL, 'Submitted', 'Tax filing received', '2024-03-10 16:20:00', 'IRS', NULL, 'Midwest Center'),

-- Another Approved case
('event-010', 'taxfile-005', NULL, 'Submitted', 'Tax filing received', '2024-03-15 11:00:00', 'IRS', NULL, 'West Center'),
('event-011', 'taxfile-005', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-20 09:30:00', 'IRS', NULL, 'West Center'),
('event-012', 'taxfile-005', 'Processing', 'Approved', 'Refund approved', '2024-04-10 13:15:00', 'IRS', NULL, 'West Center'),

-- Previous year filing (Approved)
('event-013', 'taxfile-006', NULL, 'Submitted', 'Tax filing received', '2023-03-10 13:25:00', 'IRS', NULL, 'Northeast Center'),
('event-014', 'taxfile-006', 'Submitted', 'Processing', 'Tax filing under review', '2023-03-15 10:45:00', 'IRS', NULL, 'Northeast Center'),
('event-015', 'taxfile-006', 'Processing', 'Approved', 'Refund approved', '2023-04-05 14:20:00', 'IRS', NULL, 'Northeast Center');

-- Sample TaxRefundPredictions
INSERT INTO TaxRefundPredictions (PredictionID, TaxFileID, ConfidenceScore, ModelVersion, PredictedAvailabilityDate, InputFeatures) VALUES
('prediction-001', 'taxfile-002', 0.85, 'v1.0', '2024-03-25', '{"filing_type": "Individual", "tax_year": 2024, "region": "West", "amount": 1800.00}'),
('prediction-002', 'taxfile-004', 0.78, 'v1.0', '2024-04-05', '{"filing_type": "Individual", "tax_year": 2024, "region": "Midwest", "amount": 1200.00}');

-- Sample IRSTransitionEstimates
INSERT INTO IRSTransitionEstimates (
    EstimateID, SourceStatus, TargetStatus, FilingType, TaxYear, 
    TaxCategories, DeductionCategories, RefundAmountBucket, GeographicRegion, 
    ProcessingCenter, FilingPeriod, AvgTransitionDays, MedianTransitionDays, 
    P25TransitionDays, P75TransitionDays, MinTransitionDays, MaxTransitionDays, 
    SampleSize, SuccessRate, ComputationDate, DataPeriodStart, DataPeriodEnd, 
    ETLJobID, DataQualityScore
) VALUES
('estimate-001', 'Submitted', 'Processing', 'Individual', 2024,
 '{"income": "W2"}', '{"mortgage": "yes"}', '1000-3000', 'Northeast', 
 'Northeast Center', 'Early', 5.2, 5, 
 3, 7, 1, 14, 
 1250, 0.98, '2024-03-01', '2024-01-01', '2024-02-28', 
 'etl-job-001', 0.95),

('estimate-002', 'Processing', 'Approved', 'Individual', 2024, 
 '{"income": "W2"}', '{"mortgage": "yes"}', '1000-3000', 'Northeast', 
 'Northeast Center', 'Early', 21.5, 21, 
 18, 25, 14, 45, 
 1100, 0.92, '2024-03-01', '2024-01-01', '2024-02-28', 
 'etl-job-001', 0.95),

('estimate-003', 'Submitted', 'Processing', 'Joint', 2024,
 '{"income": "W2"}', '{"mortgage": "yes"}', '3000-5000', 'West', 
 'West Center', 'Mid', 6.8, 6, 
 4, 9, 2, 18, 
 950, 0.97, '2024-03-01', '2024-01-01', '2024-02-28', 
 'etl-job-001', 0.94),

('estimate-004', 'Processing', 'Approved', 'Joint', 2024, 
 '{"income": "W2"}', '{"mortgage": "yes"}', '3000-5000', 'West', 
 'West Center', 'Mid', 25.3, 24, 
 20, 30, 15, 50, 
 900, 0.91, '2024-03-01', '2024-01-01', '2024-02-28', 
 'etl-job-001', 0.94),

('estimate-005', 'Processing', 'Needs Action', 'Individual', 2024, 
 '{"income": "1099"}', '{"mortgage": "no"}', '1000-3000', 'South', 
 'South Center', 'Mid', 15.2, 14, 
 10, 20, 7, 30, 
 500, 0.15, '2024-03-01', '2024-01-01', '2024-02-28', 
 'etl-job-001', 0.93),

('estimate-006', 'Needs Action', 'Approved', 'Individual', 2024, 
 '{"income": "1099"}', '{"mortgage": "no"}', '1000-3000', 'South', 
 'South Center', 'Mid', 18.7, 18, 
 14, 23, 10, 35, 
 450, 0.85, '2024-03-01', '2024-01-01', '2024-02-28', 
 'etl-job-001', 0.93);