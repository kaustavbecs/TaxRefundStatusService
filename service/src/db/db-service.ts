import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Database file path
const dbPath = path.join(__dirname, '../../db/tax_refund.db');

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Types
export interface User {
  UserID: string;
  CreatedAt: string;
  UpdatedAt: string;
}

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

export interface TaxRefundPrediction {
  PredictionID: string;
  TaxFileID: string;
  ConfidenceScore: number;
  ModelVersion: string;
  PredictedAvailabilityDate: string;
  InputFeatures: string; // JSON
  CreatedAt: string;
}

export interface IRSTransitionEstimate {
  EstimateID: string;
  SourceStatus: string;
  TargetStatus: string;
  FilingType: string;
  TaxYear: number;
  TaxCategories: string; // JSON
  DeductionCategories: string; // JSON
  RefundAmountBucket: string;
  GeographicRegion: string;
  ProcessingCenter: string;
  FilingPeriod: string;
  AvgTransitionDays: number;
  MedianTransitionDays: number;
  P25TransitionDays: number;
  P75TransitionDays: number;
  MinTransitionDays: number;
  MaxTransitionDays: number;
  SampleSize: number;
  SuccessRate: number;
  ComputationDate: string;
  DataPeriodStart: string;
  DataPeriodEnd: string;
  ETLJobID: string;
  DataQualityScore: number;
  CreatedAt: string;
}

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

// Database service
class DbService {
  // Get user by ID
  getUserById(userId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM Users WHERE UserID = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row as User || null);
      });
    });
  }


  // Get tax files by user ID
  getTaxFilesByUserId(userId: string): Promise<TaxFile[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM TaxFiles WHERE UserID = ? ORDER BY TaxYear DESC, DateOfFiling DESC', [userId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows as TaxFile[]);
      });
    });
  }

  // Get tax file by ID
  getTaxFileById(taxFileId: string): Promise<TaxFile | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM TaxFiles WHERE TaxFileID = ?', [taxFileId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row as TaxFile || null);
      });
    });
  }

  // Get latest tax processing event by tax file ID
  getLatestTaxProcessingEvent(taxFileId: string): Promise<TaxProcessingEvent | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM TaxProcessingEvents WHERE TaxFileID = ? ORDER BY StatusUpdateDate DESC LIMIT 1',
        [taxFileId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row as TaxProcessingEvent || null);
        }
      );
    });
  }

  // Get all tax processing events by tax file ID
  getTaxProcessingEvents(taxFileId: string): Promise<TaxProcessingEvent[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM TaxProcessingEvents WHERE TaxFileID = ? ORDER BY StatusUpdateDate ASC',
        [taxFileId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows as TaxProcessingEvent[]);
        }
      );
    });
  }

  // Get latest tax refund prediction by tax file ID
  getLatestTaxRefundPrediction(taxFileId: string): Promise<TaxRefundPrediction | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM TaxRefundPredictions WHERE TaxFileID = ? ORDER BY CreatedAt DESC LIMIT 1',
        [taxFileId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row as TaxRefundPrediction || null);
        }
      );
    });
  }

  // Get IRS transition estimates for prediction
  getIRSTransitionEstimates(
    sourceStatus: string,
    targetStatus: string,
    filingType: string,
    taxYear: number,
    geographicRegion: string
  ): Promise<IRSTransitionEstimate | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM IRSTransitionEstimates 
         WHERE SourceStatus = ? AND TargetStatus = ? AND FilingType = ? 
         AND TaxYear = ? AND GeographicRegion = ?`,
        [sourceStatus, targetStatus, filingType, taxYear, geographicRegion],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row as IRSTransitionEstimate || null);
        }
      );
    });
  }

  // Create a new tax refund prediction
  createTaxRefundPrediction(
    taxFileId: string,
    confidenceScore: number,
    predictedAvailabilityDate: string,
    inputFeatures: object
  ): Promise<TaxRefundPrediction> {
    return new Promise((resolve, reject) => {
      const predictionId = uuidv4();
      const modelVersion = 'v1.0';
      const createdAt = new Date().toISOString();
      const inputFeaturesJson = JSON.stringify(inputFeatures);

      db.run(
        `INSERT INTO TaxRefundPredictions 
         (PredictionID, TaxFileID, ConfidenceScore, ModelVersion, PredictedAvailabilityDate, InputFeatures, CreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [predictionId, taxFileId, confidenceScore, modelVersion, predictedAvailabilityDate, inputFeaturesJson, createdAt],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          const prediction: TaxRefundPrediction = {
            PredictionID: predictionId,
            TaxFileID: taxFileId,
            ConfidenceScore: confidenceScore,
            ModelVersion: modelVersion,
            PredictedAvailabilityDate: predictedAvailabilityDate,
            InputFeatures: inputFeaturesJson,
            CreatedAt: createdAt
          };

          resolve(prediction);
        }
      );
    });
  }

  // Close database connection
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

export default new DbService();