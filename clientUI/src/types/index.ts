// User type
export interface User {
  UserID: string;
  SSN: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// Tax File type
export interface TaxFile {
  TaxFileID: string;
  UserID: string;
  TaxYear: number;
  FilingType: string;
  DateOfFiling: string;
  TaxCategories: string; // JSON
  DeductionCategories: string; // JSON
  ClaimedRefundAmount: number;
  GeographicRegion: string;
  CreatedAt: string;
}

// Tax Processing Event type
export interface TaxProcessingEvent {
  EventID: string;
  TaxFileID: string;
  OldStatus: string | null;
  NewStatus: string;
  StatusDetails: string;
  StatusUpdateDate: string;
  UpdateSource: string;
  ActionRequired: string | null;
  ProcessingCenter: string;
  CreatedAt: string;
}

// Tax Refund Prediction type
export interface TaxRefundPrediction {
  PredictionID: string;
  TaxFileID: string;
  ConfidenceScore: number;
  ModelVersion: string;
  PredictedAvailabilityDate: string;
  InputFeatures: string; // JSON
  CreatedAt: string;
}

// Refund Status type
export interface RefundStatus {
  status: string;
  details: string | null;
  lastUpdated: string;
  actionRequired: string | null;
  estimatedCompletionDays?: number;
  estimatedCompletionDate?: string;
  refundAmount?: number;
  depositDate?: string;
}

// Status types
export type StatusType = 'Submitted' | 'Processing' | 'Needs Action' | 'Approved';

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}