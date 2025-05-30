-- Sample data for Tax Refund Status Service

-- Sample Users
INSERT INTO Users (UserID) VALUES
('user-001'),
('user-002'),
('user-003'),
('user-004'),
('user-005');

-- Sample TaxFiles
INSERT INTO TaxFiles (TaxFileID, UserID, TaxYear, FilingType, DateOfFiling, TaxCategories, DeductionCategories, ClaimedRefundAmount, GeographicRegion) VALUES
('taxfile-001', 'user-001', 2024, 'Individual', '2024-02-15 10:30:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 2500.00, 'Northeast'),
('taxfile-002', 'user-002', 2024, 'Individual', '2024-02-20 14:45:00', '{"income": "W2", "investments": "no"}', '{"mortgage": "no", "student_loans": "yes"}', 1800.00, 'West'),
('taxfile-003', 'user-003', 2024, 'Joint', '2024-03-01 09:15:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "no"}', 3200.00, 'South'),
('taxfile-004', 'user-004', 2024, 'Individual', '2024-03-10 16:20:00', '{"income": "1099", "investments": "yes"}', '{"mortgage": "no", "student_loans": "no"}', 1200.00, 'Midwest'),
('taxfile-005', 'user-005', 2024, 'Joint', '2024-03-15 11:00:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 4500.00, 'West'),
('taxfile-006', 'user-001', 2023, 'Individual', '2023-03-10 13:25:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 2200.00, 'Northeast'),
('taxfile-007', 'user-002', 2024, 'Individual', '2024-03-18 09:45:00', '{"income": "W2", "investments": "yes", "self_employment": "yes"}', '{"mortgage": "yes", "education": "yes", "childcare": "yes"}', 3100.00, 'Midwest'),
('taxfile-008', 'user-003', 2024, 'Joint', '2024-03-22 13:20:00', '{"income": "1099", "investments": "yes", "rental": "yes"}', '{"mortgage": "yes", "medical": "yes", "charity": "yes"}', 5200.00, 'Northeast'),
('taxfile-009', 'user-004', 2024, 'Individual', '2024-03-25 15:10:00', '{"income": "W2", "investments": "no", "unemployment": "yes"}', '{"student_loans": "yes", "medical": "yes"}', 950.00, 'South'),
('taxfile-010', 'user-005', 2024, 'Joint', '2024-03-28 10:30:00', '{"income": "1099", "investments": "yes", "business": "yes"}', '{"mortgage": "yes", "home_office": "yes"}', 6800.00, 'West');

-- New tax files with recent dates (for ML inference testing)
INSERT INTO TaxFiles (TaxFileID, UserID, TaxYear, FilingType, DateOfFiling, TaxCategories, DeductionCategories, ClaimedRefundAmount, GeographicRegion) VALUES
('taxfile-011', 'user-001', 2024, 'Individual', '2024-05-10 09:15:00', '{"income": "W2", "investments": "yes", "dividends": "yes"}', '{"mortgage": "yes", "charity": "yes", "healthcare": "yes"}', 3750.00, 'Northeast'),
('taxfile-012', 'user-002', 2024, 'Individual', '2024-05-12 14:30:00', '{"income": "1099", "investments": "no", "self_employment": "yes"}', '{"home_office": "yes", "vehicle": "yes"}', 2200.00, 'West'),
('taxfile-013', 'user-003', 2024, 'Joint', '2024-05-15 11:45:00', '{"income": "W2", "investments": "yes", "rental": "yes"}', '{"mortgage": "yes", "dependent_care": "yes"}', 4800.00, 'South'),
('taxfile-014', 'user-004', 2024, 'Individual', '2024-05-18 16:20:00', '{"income": "W2", "investments": "no", "foreign": "yes"}', '{"student_loans": "yes", "education": "yes"}', 1950.00, 'Midwest'),
('taxfile-015', 'user-005', 2024, 'Joint', '2024-05-20 10:05:00', '{"income": "W2", "investments": "yes", "retirement": "yes"}', '{"mortgage": "yes", "medical": "yes"}', 5600.00, 'West');

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
('event-015', 'taxfile-006', 'Processing', 'Approved', 'Refund approved', '2023-04-05 14:20:00', 'IRS', NULL, 'Northeast Center'),

-- Additional processing status samples for new tax files
-- Complex processing path with multiple status changes
('event-016', 'taxfile-007', NULL, 'Submitted', 'Tax filing received', '2024-03-18 09:45:00', 'IRS', NULL, 'Midwest Center'),
('event-017', 'taxfile-007', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-22 11:30:00', 'IRS', NULL, 'Midwest Center'),
('event-018', 'taxfile-007', 'Processing', 'Needs Action', 'Missing documentation', '2024-03-30 14:15:00', 'IRS', 'Please provide missing 1099 form', 'Midwest Center'),
('event-019', 'taxfile-007', 'Needs Action', 'Processing', 'Documentation received, continuing review', '2024-04-05 10:20:00', 'IRS', NULL, 'Midwest Center'),
('event-020', 'taxfile-007', 'Processing', 'Approved', 'Refund approved after review', '2024-04-15 16:45:00', 'IRS', NULL, 'Midwest Center'),

-- Complex case with verification
('event-021', 'taxfile-008', NULL, 'Submitted', 'Tax filing received', '2024-03-22 13:20:00', 'IRS', NULL, 'Northeast Center'),
('event-022', 'taxfile-008', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-25 09:10:00', 'IRS', NULL, 'Northeast Center'),
('event-023', 'taxfile-008', 'Processing', 'Needs Action', 'Verification required', '2024-04-02 11:30:00', 'IRS', 'Please verify rental income details', 'Northeast Center'),
('event-024', 'taxfile-008', 'Needs Action', 'Processing', 'Verification received, continuing review', '2024-04-10 14:25:00', 'IRS', NULL, 'Northeast Center'),

-- Simple processing case
('event-025', 'taxfile-009', NULL, 'Submitted', 'Tax filing received', '2024-03-25 15:10:00', 'IRS', NULL, 'South Center'),
('event-026', 'taxfile-009', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-28 10:45:00', 'IRS', NULL, 'South Center'),

-- Complex business case
('event-027', 'taxfile-010', NULL, 'Submitted', 'Tax filing received', '2024-03-28 10:30:00', 'IRS', NULL, 'West Center'),
('event-028', 'taxfile-010', 'Submitted', 'Processing', 'Tax filing under review', '2024-04-01 13:15:00', 'IRS', NULL, 'West Center'),
('event-029', 'taxfile-010', 'Processing', 'Needs Action', 'Business documentation required', '2024-04-08 15:30:00', 'IRS', 'Please provide business expense receipts', 'West Center'),

-- Additional Processing to Needs Action transitions with varied characteristics
('event-030', 'taxfile-004', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-15 09:30:00', 'IRS', NULL, 'Midwest Center'),
('event-031', 'taxfile-004', 'Processing', 'Needs Action', 'Income verification required', '2024-03-25 14:20:00', 'IRS', 'Please provide additional income documentation', 'Midwest Center'),

-- Fast Processing to Approved transition (short processing time)
('event-032', 'taxfile-009', 'Processing', 'Approved', 'Refund approved - simple case', '2024-04-02 11:15:00', 'IRS', NULL, 'South Center'),

-- Slow Processing to Approved transition (long processing time)
('event-033', 'taxfile-008', 'Processing', 'Approved', 'Refund approved after detailed review', '2024-04-25 16:30:00', 'IRS', NULL, 'Northeast Center'),

-- Processing to Needs Action with complex tax situation
('event-034', 'taxfile-002', 'Processing', 'Needs Action', 'Deduction clarification needed', '2024-03-10 13:45:00', 'IRS', 'Please provide receipts for student loan interest deductions', 'West Center'),
('event-035', 'taxfile-002', 'Needs Action', 'Processing', 'Documentation received, continuing review', '2024-03-20 10:30:00', 'IRS', NULL, 'West Center'),
('event-036', 'taxfile-002', 'Processing', 'Approved', 'Refund approved after verification', '2024-04-05 15:20:00', 'IRS', NULL, 'West Center');

-- Add processing events for the new tax files (all in Processing state)
INSERT INTO TaxProcessingEvents (EventID, TaxFileID, OldStatus, NewStatus, StatusDetails, StatusUpdateDate, UpdateSource, ActionRequired, ProcessingCenter) VALUES
('event-037', 'taxfile-011', NULL, 'Submitted', 'Tax filing received', '2024-05-10 09:15:00', 'IRS', NULL, 'Northeast Center'),
('event-038', 'taxfile-011', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-15 11:30:00', 'IRS', NULL, 'Northeast Center'),

('event-039', 'taxfile-012', NULL, 'Submitted', 'Tax filing received', '2024-05-12 14:30:00', 'IRS', NULL, 'West Center'),
('event-040', 'taxfile-012', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-16 09:45:00', 'IRS', NULL, 'West Center'),

('event-041', 'taxfile-013', NULL, 'Submitted', 'Tax filing received', '2024-05-15 11:45:00', 'IRS', NULL, 'South Center'),
('event-042', 'taxfile-013', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-19 13:20:00', 'IRS', NULL, 'South Center'),

('event-043', 'taxfile-014', NULL, 'Submitted', 'Tax filing received', '2024-05-18 16:20:00', 'IRS', NULL, 'Midwest Center'),
('event-044', 'taxfile-014', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-22 10:15:00', 'IRS', NULL, 'Midwest Center'),

('event-045', 'taxfile-015', NULL, 'Submitted', 'Tax filing received', '2024-05-20 10:05:00', 'IRS', NULL, 'West Center'),
('event-046', 'taxfile-015', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-24 14:40:00', 'IRS', NULL, 'West Center');

-- Sample TaxRefundPredictions
INSERT INTO TaxRefundPredictions (PredictionID, TaxFileID, ConfidenceScore, ModelVersion, PredictedAvailabilityDate, InputFeatures) VALUES
('prediction-001', 'taxfile-002', 0.85, 'v1.0', '2024-03-25', '{"filing_type": "Individual", "tax_year": 2024, "region": "West", "amount": 1800.00}'),
('prediction-002', 'taxfile-004', 0.78, 'v1.0', '2024-04-05', '{"filing_type": "Individual", "tax_year": 2024, "region": "Midwest", "amount": 1200.00}'),
('prediction-003', 'taxfile-007', 0.82, 'v1.0', '2024-04-20', '{"filing_type": "Individual", "tax_year": 2024, "region": "Midwest", "amount": 3100.00}'),
('prediction-004', 'taxfile-008', 0.75, 'v1.0', '2024-04-25', '{"filing_type": "Joint", "tax_year": 2024, "region": "Northeast", "amount": 5200.00}'),
('prediction-005', 'taxfile-009', 0.88, 'v1.0', '2024-04-15', '{"filing_type": "Individual", "tax_year": 2024, "region": "South", "amount": 950.00}'),
('prediction-006', 'taxfile-010', 0.70, 'v1.0', '2024-05-01', '{"filing_type": "Joint", "tax_year": 2024, "region": "West", "amount": 6800.00}');

-- End of sample data