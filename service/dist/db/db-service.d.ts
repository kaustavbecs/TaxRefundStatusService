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
    TaxCategories: string;
    DeductionCategories: string;
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
    InputFeatures: string;
    CreatedAt: string;
}
// No legacy interfaces needed
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
declare class DbService {
    getUserById(userId: string): Promise<User | null>;
    getTaxFilesByUserId(userId: string): Promise<TaxFile[]>;
    getTaxFileById(taxFileId: string): Promise<TaxFile | null>;
    getLatestTaxProcessingEvent(taxFileId: string): Promise<TaxProcessingEvent | null>;
    getTaxProcessingEvents(taxFileId: string): Promise<TaxProcessingEvent[]>;
    getLatestTaxRefundPrediction(taxFileId: string): Promise<TaxRefundPrediction | null>;
    createTaxRefundPrediction(taxFileId: string, confidenceScore: number, predictedAvailabilityDate: string, inputFeatures: object): Promise<TaxRefundPrediction>;
    close(): Promise<void>;
}
declare const _default: DbService;
export default _default;
