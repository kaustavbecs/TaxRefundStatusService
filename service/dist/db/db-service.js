"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3 = __importStar(require("sqlite3"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
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
// Database service
class DbService {
    // Get user by ID
    getUserById(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM Users WHERE UserID = ?', [userId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }
    // Get tax files by user ID
    getTaxFilesByUserId(userId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM TaxFiles WHERE UserID = ? ORDER BY TaxYear DESC, DateOfFiling DESC', [userId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }
    // Get tax file by ID
    getTaxFileById(taxFileId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM TaxFiles WHERE TaxFileID = ?', [taxFileId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }
    // Get latest tax processing event by tax file ID
    getLatestTaxProcessingEvent(taxFileId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM TaxProcessingEvents WHERE TaxFileID = ? ORDER BY StatusUpdateDate DESC LIMIT 1', [taxFileId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }
    // Get all tax processing events by tax file ID
    getTaxProcessingEvents(taxFileId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM TaxProcessingEvents WHERE TaxFileID = ? ORDER BY StatusUpdateDate ASC', [taxFileId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }
    // Get latest tax refund prediction by tax file ID
    getLatestTaxRefundPrediction(taxFileId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM TaxRefundPredictions WHERE TaxFileID = ? ORDER BY CreatedAt DESC LIMIT 1', [taxFileId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }
    // Get IRS transition estimates for prediction
    getIRSTransitionEstimates(sourceStatus, targetStatus, filingType, taxYear, geographicRegion) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM IRSTransitionEstimates 
         WHERE SourceStatus = ? AND TargetStatus = ? AND FilingType = ? 
         AND TaxYear = ? AND GeographicRegion = ?`, [sourceStatus, targetStatus, filingType, taxYear, geographicRegion], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }
    // Create a new tax refund prediction
    createTaxRefundPrediction(taxFileId, confidenceScore, predictedAvailabilityDate, inputFeatures) {
        return new Promise((resolve, reject) => {
            const predictionId = (0, uuid_1.v4)();
            const modelVersion = 'v1.0';
            const createdAt = new Date().toISOString();
            const inputFeaturesJson = JSON.stringify(inputFeatures);
            db.run(`INSERT INTO TaxRefundPredictions 
         (PredictionID, TaxFileID, ConfidenceScore, ModelVersion, PredictedAvailabilityDate, InputFeatures, CreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [predictionId, taxFileId, confidenceScore, modelVersion, predictedAvailabilityDate, inputFeaturesJson, createdAt], function (err) {
                if (err) {
                    reject(err);
                    return;
                }
                const prediction = {
                    PredictionID: predictionId,
                    TaxFileID: taxFileId,
                    ConfidenceScore: confidenceScore,
                    ModelVersion: modelVersion,
                    PredictedAvailabilityDate: predictedAvailabilityDate,
                    InputFeatures: inputFeaturesJson,
                    CreatedAt: createdAt
                };
                resolve(prediction);
            });
        });
    }
    // Close database connection
    close() {
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
exports.default = new DbService();
//# sourceMappingURL=db-service.js.map