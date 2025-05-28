import dbService from '../db/db-service';
import { TaxFile, TaxProcessingEvent, IRSTransitionEstimate } from '../db/db-service';

// Types
export interface PredictionResult {
  estimatedDays: number;
  confidenceScore: number;
  predictedDate: string;
}

class PredictionService {
  /**
   * Predict the estimated time for refund availability
   * This is a simple implementation that will be replaced with an ML model later
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

      // Get IRS transition estimates
      const estimate = await dbService.getIRSTransitionEstimates(
        'Processing',
        'Approved',
        taxFile.FilingType,
        taxFile.TaxYear,
        taxFile.GeographicRegion
      );

      // If no estimate is found, use default values
      let estimatedDays = 21; // Default: 3 weeks
      let confidenceScore = 0.7; // Default confidence

      if (estimate) {
        // Use the median transition days as the estimate
        estimatedDays = estimate.MedianTransitionDays;
        confidenceScore = estimate.SuccessRate;
      }

      // Add some randomness to simulate ML model variability
      const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
      estimatedDays = Math.round(estimatedDays * randomFactor);

      // Calculate predicted date
      const currentDate = new Date();
      const predictedDate = new Date(currentDate);
      predictedDate.setDate(currentDate.getDate() + estimatedDays);

      // Create prediction result
      const result: PredictionResult = {
        estimatedDays,
        confidenceScore,
        predictedDate: predictedDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
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
        confidenceScore,
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