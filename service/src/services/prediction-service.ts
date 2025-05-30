import dbService from '../db/db-service';
import mlIntegration from './ml-integration';
import { TaxFile } from '../db/db-service';

// Types
export interface PredictionResult {
  estimatedDays: number;
  confidenceScore: number;
  predictedDate: string;
}

class PredictionService {
  /**
   * Predict the estimated time for refund availability
   * Uses the ML API if available, returns null if not
   */
  async predictRefundAvailability(taxFileId: string): Promise<PredictionResult | null> {
    try {
      // Get tax file
      const taxFile = await dbService.getTaxFileById(taxFileId);
      if (!taxFile) {
        throw new Error(`Tax file not found: ${taxFileId}`);
      }

      // Get latest tax processing event
      const latestEvent = await dbService.getLatestTaxProcessingEvent(taxFileId);
      if (!latestEvent || latestEvent.NewStatus !== 'Processing') {
        // Only predict for Processing status
        return null;
      }

      // Check if ML API is available
      const isMLApiAvailable = await mlIntegration.checkMLApiHealth();

      if (!isMLApiAvailable) {
        // ML API not available, return null
        console.log('ML API is not available, cannot make prediction');
        return null;
      }

      // Use ML API for prediction
      const mlPrediction = await mlIntegration.getPrediction(
        taxFile.FilingType,
        taxFile.TaxYear,
        taxFile.ClaimedRefundAmount,
        taxFile.GeographicRegion,
        latestEvent.ProcessingCenter || 'Unknown'
      );

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

      await dbService.createTaxRefundPrediction(
        taxFileId,
        result.confidenceScore,
        result.predictedDate,
        inputFeatures
      );

      return result;
    } catch (error) {
      console.error('Error predicting refund availability:', error);
      return null;
    }
  }
}

export default new PredictionService();