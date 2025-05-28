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
   * Uses the ML API if available, falls back to database estimates if not
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

      let result: PredictionResult;

      if (isMLApiAvailable) {
        // Use ML API for prediction
        const mlPrediction = await mlIntegration.getPrediction(
          taxFile.FilingType,
          taxFile.TaxYear,
          taxFile.ClaimedRefundAmount,
          taxFile.GeographicRegion,
          latestEvent.ProcessingCenter || 'Unknown'
        );

        if (mlPrediction) {
          result = {
            estimatedDays: mlPrediction.estimated_days,
            confidenceScore: mlPrediction.confidence_score,
            predictedDate: mlPrediction.predicted_date
          };
        } else {
          // ML API call failed, fall back to database estimates
          result = await this.getPredictionFromDatabase(taxFile);
        }
      } else {
        // ML API not available, use database estimates
        result = await this.getPredictionFromDatabase(taxFile);
      }

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

  /**
   * Get prediction from database estimates (fallback method)
   */
  private async getPredictionFromDatabase(taxFile: TaxFile): Promise<PredictionResult> {
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

    // Calculate predicted date
    const currentDate = new Date();
    const predictedDate = new Date(currentDate);
    predictedDate.setDate(currentDate.getDate() + estimatedDays);

    // Create prediction result
    return {
      estimatedDays,
      confidenceScore,
      predictedDate: predictedDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
    };
  }
}

export default new PredictionService();