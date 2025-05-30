import { RefundStatus, TaxFile, TaxProcessingEvent } from '../db/db-service';
declare class RefundStatusService {
    /**
     * Get the refund status for a tax filing
     */
    getRefundStatus(taxFileId: string): Promise<RefundStatus | null>;
    /**
     * Get the refund status history for a tax filing
     */
    getRefundStatusHistory(taxFileId: string): Promise<TaxProcessingEvent[]>;
    /**
     * Get all tax filings for a user
     */
    getTaxFilings(userId: string): Promise<TaxFile[]>;
}
declare const _default: RefundStatusService;
export default _default;
