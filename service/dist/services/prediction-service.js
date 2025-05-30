"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = __importDefault(require("../db/db-service"));
const ml_integration_1 = __importDefault(require("./ml-integration"));
class PredictionService {
    /**
     * Predict the estimated time for refund availability
     * Uses the ML API if available, returns null if not
     */
    async predictRefundAvailability(taxFileId) {
        try {
            // Get tax file
            const taxFile = await db_service_1.default.getTaxFileById(taxFileId);
            if (!taxFile) {
                throw new Error(`Tax file not found: ${taxFileId}`);
            }
            // Get latest tax processing event
            const latestEvent = await db_service_1.default.getLatestTaxProcessingEvent(taxFileId);
            if (!latestEvent || latestEvent.NewStatus !== 'Processing') {
                // Only predict for Processing status
                return null;
            }
            // Check if ML API is available
            const isMLApiAvailable = await ml_integration_1.default.checkMLApiHealth();
            if (!isMLApiAvailable) {
                // ML API not available, return null
                console.log('ML API is not available, cannot make prediction');
                return null;
            }
            // Use ML API for prediction
            const mlPrediction = await ml_integration_1.default.getPrediction(taxFile.FilingType, taxFile.TaxYear, taxFile.ClaimedRefundAmount, taxFile.GeographicRegion, latestEvent.ProcessingCenter || 'Unknown');
            if (!mlPrediction) {
                // ML API call failed, return null
                console.log('ML API call failed, cannot make prediction');
                return null;
            }
            // Create prediction result
            const result = {
                estimatedDays: mlPrediction.estimated_days,
                confidenceScore: mlPrediction.confidence_score,
                predictedDate: mlPrediction.predicted_date
            };
            // Store prediction in database
            const inputFeatures = {
                filingType: taxFile.FilingType,
                taxYear: taxFile.TaxYear,
                region: taxFile.GeographicRegion,
                amount: taxFile.ClaimedRefundAmount
            };
            await db_service_1.default.createTaxRefundPrediction(taxFileId, result.confidenceScore, result.predictedDate, inputFeatures);
            return result;
        }
        catch (error) {
            console.error('Error predicting refund availability:', error);
            return null;
        }
    }
}
exports.default = new PredictionService();
//# sourceMappingURL=prediction-service.js.map