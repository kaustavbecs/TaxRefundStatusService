/**
 * ML Integration Service
 *
 * This service integrates with the ML API to get predictions for tax refund processing times.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ML API configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:9090';

// Types
interface PredictionRequest {
  filing_type: string;
  tax_year: number;
  refund_amount: number;
  geographic_region: string;
  processing_center: string;
  filing_period?: string;
  source_status: string;
  target_status: string;
}

interface PredictionResponse {
  estimated_days: number;
  confidence_score: number;
  predicted_date: string;
  model_version: string;
}

interface HealthCheckResponse {
  status: string;
  model_loaded: boolean;
  model_version: string;
  latest_available: boolean;
  available_versions: string[];
  timestamp: string;
}

/**
 * Get a prediction for tax refund processing time
 */
export async function getPrediction(
  filingType: string,
  taxYear: number,
  refundAmount: number,
  geographicRegion: string,
  processingCenter: string,
  filingPeriod?: string
): Promise<PredictionResponse | null> {
  try {
    // Create request payload
    const payload: PredictionRequest = {
      filing_type: filingType,
      tax_year: taxYear,
      refund_amount: refundAmount,
      geographic_region: geographicRegion,
      processing_center: processingCenter,
      filing_period: filingPeriod,
      source_status: 'Processing',
      target_status: 'Approved'
    };

    // Make API request
    const response = await axios.post<PredictionResponse>(
      `${ML_API_URL}/predict`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting prediction from ML API:', error);
    return null;
  }
}

/**
 * Check if the ML API is available
 */
export async function checkMLApiHealth(): Promise<boolean> {
  try {
    const response = await axios.get<HealthCheckResponse>(`${ML_API_URL}/health`, {
      timeout: 2000 // 2 second timeout
    });
    
    return response.data.status === 'ok';
  } catch (error) {
    console.error('ML API health check failed:', error);
    return false;
  }
}

/**
 * Get ML model metadata
 */
export async function getModelMetadata(): Promise<any | null> {
  try {
    const response = await axios.get(`${ML_API_URL}/metadata`, {
      timeout: 2000 // 2 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting ML model metadata:', error);
    return null;
  }
}

// Export default object
export default {
  getPrediction,
  checkMLApiHealth,
  getModelMetadata
};