import { Request, Response } from 'express';
declare class RefundStatusController {
    /**
     * Get the refund status for a tax filing
     * GET /api/refund-status/:taxFileId
     */
    getRefundStatus(req: Request, res: Response): Promise<void>;
    /**
     * Get the refund status history for a tax filing
     * GET /api/refund-status/:taxFileId/history
     */
    getRefundStatusHistory(req: Request, res: Response): Promise<void>;
    /**
     * Get all tax filings for a user
     * GET /api/users/:userId/tax-filings
     */
    getTaxFilings(req: Request, res: Response): Promise<void>;
    /**
     * Get action guidance for a tax filing with "Needs Action" status
     * POST /api/refund-status/:taxFileId/action-guidance
     */
    getActionGuidance(req: Request, res: Response): Promise<void>;
    constructor();
}
declare const _default: RefundStatusController;
export default _default;
