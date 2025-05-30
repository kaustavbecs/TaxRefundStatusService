export interface PredictionResult {
    estimatedDays: number;
    confidenceScore: number;
    predictedDate: string;
}
declare class PredictionService {
    /**
     * Predict the estimated time for refund availability
     * Uses the ML API if available, returns null if not
     */
    predictRefundAvailability(taxFileId: string): Promise<PredictionResult | null>;
}
declare const _default: PredictionService;
export default _default;
