-- Sample data for Tax Refund Status Service

-- Sample Users
INSERT INTO Users (UserID) VALUES
('user-001'),
('user-002'),
('user-003'),
('user-004'),
('user-005');

-- Sample TaxFiles
-- Each user has tax files for different years (2023, 2024, 2025)
-- No user has multiple tax files for the same year
INSERT INTO TaxFiles (TaxFileID, UserID, TaxYear, FilingType, DateOfFiling, TaxCategories, DeductionCategories, ClaimedRefundAmount, GeographicRegion) VALUES
-- User 001 tax files (2023, 2024, 2025)
('taxfile-001', 'user-001', 2023, 'Individual', '2023-02-15 10:30:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 2500.00, 'Northeast'),
('taxfile-002', 'user-001', 2024, 'Individual', '2024-02-20 14:45:00', '{"income": "W2", "investments": "no"}', '{"mortgage": "no", "student_loans": "yes"}', 1800.00, 'Northeast'),
('taxfile-003', 'user-001', 2025, 'Individual', '2025-03-01 09:15:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "no"}', 3200.00, 'Northeast'),

-- User 002 tax files (2023, 2024, 2025)
('taxfile-004', 'user-002', 2023, 'Individual', '2023-03-10 16:20:00', '{"income": "1099", "investments": "yes"}', '{"mortgage": "no", "student_loans": "no"}', 1200.00, 'West'),
('taxfile-005', 'user-002', 2024, 'Individual', '2024-03-15 11:00:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 4500.00, 'West'),
('taxfile-006', 'user-002', 2025, 'Individual', '2025-03-10 13:25:00', '{"income": "W2", "investments": "yes"}', '{"mortgage": "yes", "student_loans": "yes"}', 2200.00, 'West'),

-- User 003 tax files (2023, 2024, 2025)
('taxfile-007', 'user-003', 2023, 'Joint', '2023-03-18 09:45:00', '{"income": "W2", "investments": "yes", "self_employment": "yes"}', '{"mortgage": "yes", "education": "yes", "childcare": "yes"}', 3100.00, 'South'),
('taxfile-008', 'user-003', 2024, 'Joint', '2024-03-22 13:20:00', '{"income": "1099", "investments": "yes", "rental": "yes"}', '{"mortgage": "yes", "medical": "yes", "charity": "yes"}', 5200.00, 'South'),
('taxfile-009', 'user-003', 2025, 'Joint', '2025-03-25 15:10:00', '{"income": "W2", "investments": "no", "unemployment": "yes"}', '{"student_loans": "yes", "medical": "yes"}', 950.00, 'South'),

-- User 004 tax files (2023, 2024, 2025)
('taxfile-010', 'user-004', 2023, 'Individual', '2023-03-28 10:30:00', '{"income": "1099", "investments": "yes", "business": "yes"}', '{"mortgage": "yes", "home_office": "yes"}', 6800.00, 'Midwest'),
('taxfile-011', 'user-004', 2024, 'Individual', '2024-05-10 09:15:00', '{"income": "W2", "investments": "yes", "dividends": "yes"}', '{"mortgage": "yes", "charity": "yes", "healthcare": "yes"}', 3750.00, 'Midwest'),
('taxfile-012', 'user-004', 2025, 'Individual', '2025-05-12 14:30:00', '{"income": "1099", "investments": "no", "self_employment": "yes"}', '{"home_office": "yes", "vehicle": "yes"}', 2200.00, 'Midwest'),

-- User 005 tax files (2023, 2024, 2025)
('taxfile-013', 'user-005', 2023, 'Joint', '2023-05-15 11:45:00', '{"income": "W2", "investments": "yes", "rental": "yes"}', '{"mortgage": "yes", "dependent_care": "yes"}', 4800.00, 'West'),
('taxfile-014', 'user-005', 2024, 'Joint', '2024-05-18 16:20:00', '{"income": "W2", "investments": "no", "foreign": "yes"}', '{"student_loans": "yes", "education": "yes"}', 1950.00, 'West'),
('taxfile-015', 'user-005', 2025, 'Joint', '2025-05-20 10:05:00', '{"income": "W2", "investments": "yes", "retirement": "yes"}', '{"mortgage": "yes", "medical": "yes"}', 5600.00, 'West');

-- Sample TaxProcessingEvents
-- Status types: "Submitted", "Processing", "Needs Action", "Approved"
-- Older files (2023) are all "Approved"
-- Newer files (2024, 2025) are either "Processing" or "Needs Action"
-- Roughly equal distribution of statuses
INSERT INTO TaxProcessingEvents (EventID, TaxFileID, OldStatus, NewStatus, StatusDetails, StatusUpdateDate, UpdateSource, ActionRequired, ProcessingCenter) VALUES
-- 2023 Tax Files (All Approved)
-- User 001 - 2023 (Approved)
('event-001', 'taxfile-001', NULL, 'Submitted', 'Tax filing received', '2023-02-15 10:30:00', 'IRS', NULL, 'Northeast Center'),
('event-002', 'taxfile-001', 'Submitted', 'Processing', 'Tax filing under review', '2023-02-20 09:45:00', 'IRS', NULL, 'Northeast Center'),
('event-003', 'taxfile-001', 'Processing', 'Approved', 'Refund approved', '2023-03-15 14:30:00', 'IRS', NULL, 'Northeast Center'),

-- User 002 - 2023 (Approved)
('event-004', 'taxfile-004', NULL, 'Submitted', 'Tax filing received', '2023-03-10 16:20:00', 'IRS', NULL, 'West Center'),
('event-005', 'taxfile-004', 'Submitted', 'Processing', 'Tax filing under review', '2023-03-15 10:15:00', 'IRS', NULL, 'West Center'),
('event-006', 'taxfile-004', 'Processing', 'Approved', 'Refund approved', '2023-04-05 11:30:00', 'IRS', NULL, 'West Center'),

-- User 003 - 2023 (Approved)
('event-007', 'taxfile-007', NULL, 'Submitted', 'Tax filing received', '2023-03-18 09:45:00', 'IRS', NULL, 'South Center'),
('event-008', 'taxfile-007', 'Submitted', 'Processing', 'Tax filing under review', '2023-03-22 11:30:00', 'IRS', NULL, 'South Center'),
('event-009', 'taxfile-007', 'Processing', 'Approved', 'Refund approved after review', '2023-04-15 16:45:00', 'IRS', NULL, 'South Center'),

-- User 004 - 2023 (Approved)
('event-010', 'taxfile-010', NULL, 'Submitted', 'Tax filing received', '2023-03-28 10:30:00', 'IRS', NULL, 'Midwest Center'),
('event-011', 'taxfile-010', 'Submitted', 'Processing', 'Tax filing under review', '2023-04-01 13:15:00', 'IRS', NULL, 'Midwest Center'),
('event-012', 'taxfile-010', 'Processing', 'Approved', 'Refund approved', '2023-04-20 15:30:00', 'IRS', NULL, 'Midwest Center'),

-- User 005 - 2023 (Approved)
('event-013', 'taxfile-013', NULL, 'Submitted', 'Tax filing received', '2023-05-15 11:45:00', 'IRS', NULL, 'West Center'),
('event-014', 'taxfile-013', 'Submitted', 'Processing', 'Tax filing under review', '2023-05-19 13:20:00', 'IRS', NULL, 'West Center'),
('event-015', 'taxfile-013', 'Processing', 'Approved', 'Refund approved', '2023-06-10 14:25:00', 'IRS', NULL, 'West Center'),

-- 2024 Tax Files (Mix of Processing and Needs Action)
-- User 001 - 2024 (Needs Action)
('event-016', 'taxfile-002', NULL, 'Submitted', 'Tax filing received', '2024-02-20 14:45:00', 'IRS', NULL, 'Northeast Center'),
('event-017', 'taxfile-002', 'Submitted', 'Processing', 'Tax filing under review', '2024-02-25 10:15:00', 'IRS', NULL, 'Northeast Center'),
('event-018', 'taxfile-002', 'Processing', 'Needs Action', 'Deduction clarification needed', '2024-03-10 13:45:00', 'IRS', 'AUDIT-DEDUCT', 'Northeast Center'),

-- User 002 - 2024 (Processing)
('event-019', 'taxfile-005', NULL, 'Submitted', 'Tax filing received', '2024-03-15 11:00:00', 'IRS', NULL, 'West Center'),
('event-020', 'taxfile-005', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-20 09:30:00', 'IRS', NULL, 'West Center'),

-- User 003 - 2024 (Needs Action)
('event-021', 'taxfile-008', NULL, 'Submitted', 'Tax filing received', '2024-03-22 13:20:00', 'IRS', NULL, 'South Center'),
('event-022', 'taxfile-008', 'Submitted', 'Processing', 'Tax filing under review', '2024-03-25 09:10:00', 'IRS', NULL, 'South Center'),
('event-023', 'taxfile-008', 'Processing', 'Needs Action', 'Verification required', '2024-04-02 11:30:00', 'IRS', 'FOREIGN-INCOME', 'South Center'),

-- User 004 - 2024 (Processing)
('event-024', 'taxfile-011', NULL, 'Submitted', 'Tax filing received', '2024-05-10 09:15:00', 'IRS', NULL, 'Midwest Center'),
('event-025', 'taxfile-011', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-15 11:30:00', 'IRS', NULL, 'Midwest Center'),

-- User 005 - 2024 (Needs Action)
('event-026', 'taxfile-014', NULL, 'Submitted', 'Tax filing received', '2024-05-18 16:20:00', 'IRS', NULL, 'West Center'),
('event-027', 'taxfile-014', 'Submitted', 'Processing', 'Tax filing under review', '2024-05-22 10:15:00', 'IRS', NULL, 'West Center'),
('event-028', 'taxfile-014', 'Processing', 'Needs Action', 'Health insurance verification needed', '2024-05-25 11:30:00', 'IRS', 'HEALTH-INS-VERIFY', 'West Center'),

-- 2025 Tax Files (Mix of Processing and Needs Action)
-- User 001 - 2025 (Processing)
('event-029', 'taxfile-003', NULL, 'Submitted', 'Tax filing received', '2025-03-01 09:15:00', 'IRS', NULL, 'Northeast Center'),
('event-030', 'taxfile-003', 'Submitted', 'Processing', 'Tax filing under review', '2025-03-05 11:30:00', 'IRS', NULL, 'Northeast Center'),

-- User 002 - 2025 (Needs Action)
('event-031', 'taxfile-006', NULL, 'Submitted', 'Tax filing received', '2025-03-10 13:25:00', 'IRS', NULL, 'West Center'),
('event-032', 'taxfile-006', 'Submitted', 'Processing', 'Tax filing under review', '2025-03-15 10:45:00', 'IRS', NULL, 'West Center'),
('event-033', 'taxfile-006', 'Processing', 'Needs Action', 'Additional information required', '2025-03-20 15:45:00', 'IRS', 'DOC-W2-MISSING', 'West Center'),

-- User 003 - 2025 (Processing)
('event-034', 'taxfile-009', NULL, 'Submitted', 'Tax filing received', '2025-03-25 15:10:00', 'IRS', NULL, 'South Center'),
('event-035', 'taxfile-009', 'Submitted', 'Processing', 'Tax filing under review', '2025-03-28 10:45:00', 'IRS', NULL, 'South Center'),

-- User 004 - 2025 (Needs Action)
('event-036', 'taxfile-012', NULL, 'Submitted', 'Tax filing received', '2025-05-12 14:30:00', 'IRS', NULL, 'Midwest Center'),
('event-037', 'taxfile-012', 'Submitted', 'Processing', 'Tax filing under review', '2025-05-16 09:45:00', 'IRS', NULL, 'Midwest Center'),
('event-038', 'taxfile-012', 'Processing', 'Needs Action', 'Dependent claimed on multiple returns', '2025-05-20 10:30:00', 'IRS', 'DEP-CONFLICT', 'Midwest Center'),

-- User 005 - 2025 (Processing)
('event-039', 'taxfile-015', NULL, 'Submitted', 'Tax filing received', '2025-05-20 10:05:00', 'IRS', NULL, 'West Center'),
('event-040', 'taxfile-015', 'Submitted', 'Processing', 'Tax filing under review', '2025-05-24 14:40:00', 'IRS', NULL, 'West Center');

-- Sample TaxRefundPredictions (for Processing status tax files)
INSERT INTO TaxRefundPredictions (PredictionID, TaxFileID, ConfidenceScore, ModelVersion, PredictedAvailabilityDate, InputFeatures) VALUES
('prediction-001', 'taxfile-005', 0.85, 'v1.0', '2024-04-15', '{"filing_type": "Individual", "tax_year": 2024, "region": "West", "amount": 4500.00}'),
('prediction-002', 'taxfile-011', 0.78, 'v1.0', '2024-06-05', '{"filing_type": "Individual", "tax_year": 2024, "region": "Midwest", "amount": 3750.00}'),
('prediction-003', 'taxfile-003', 0.82, 'v1.0', '2025-04-01', '{"filing_type": "Individual", "tax_year": 2025, "region": "Northeast", "amount": 3200.00}'),
('prediction-004', 'taxfile-009', 0.75, 'v1.0', '2025-04-20', '{"filing_type": "Joint", "tax_year": 2025, "region": "South", "amount": 950.00}'),
('prediction-005', 'taxfile-015', 0.88, 'v1.0', '2025-06-15', '{"filing_type": "Joint", "tax_year": 2025, "region": "West", "amount": 5600.00}');

-- End of sample data