/**
 * ML Integration Service
 *
 * This service integrates with the ML API to get predictions for tax refund processing times.
 */
interface PredictionResponse {
    estimated_days: number;
    confidence_score: number;
    predicted_date: string;
    model_version: string;
}
/**
 * Get a prediction for tax refund processing time
 */
export declare function getPrediction(filingType: string, taxYear: number, refundAmount: number, geographicRegion: string, processingCenter: string, filingPeriod?: string): Promise<PredictionResponse | null>;
/**
 * Check if the ML API is available
 */
export declare function checkMLApiHealth(): Promise<boolean>;
/**
 * Get ML model metadata
 */
export declare function getModelMetadata(): Promise<any | null>;
declare const _default: {
    getPrediction: typeof getPrediction;
    checkMLApiHealth: typeof checkMLApiHealth;
    getModelMetadata: typeof getModelMetadata;
};
export default _default;
