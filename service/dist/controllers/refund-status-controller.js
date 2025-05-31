"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const refund_status_service_1 = __importDefault(require("../services/refund-status-service"));
const action_guidance_service_1 = __importDefault(require("../services/action-guidance-service"));
const db_service_1 = __importDefault(require("../db/db-service"));
class RefundStatusController {
    /**
     * Get the refund status for a tax filing
     * GET /api/refund-status/:taxFileId
     */
    async getRefundStatus(req, res) {
        try {
            const { taxFileId } = req.params;
            if (!taxFileId) {
                res.status(400).json({ error: 'Tax file ID is required' });
                return;
            }
            const status = await refund_status_service_1.default.getRefundStatus(taxFileId);
            if (!status) {
                res.status(404).json({ error: 'Tax filing not found' });
                return;
            }
            res.status(200).json(status);
        }
        catch (error) {
            console.error('Error in getRefundStatus controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get the refund status history for a tax filing
     * GET /api/refund-status/:taxFileId/history
     */
    async getRefundStatusHistory(req, res) {
        try {
            const { taxFileId } = req.params;
            if (!taxFileId) {
                res.status(400).json({ error: 'Tax file ID is required' });
                return;
            }
            const history = await refund_status_service_1.default.getRefundStatusHistory(taxFileId);
            res.status(200).json(history);
        }
        catch (error) {
            console.error('Error in getRefundStatusHistory controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all tax filings for a user
     * GET /api/users/:userId/tax-filings
     */
    async getTaxFilings(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({ error: 'User ID is required' });
                return;
            }
            // Check if user exists
            const user = await db_service_1.default.getUserById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const filings = await refund_status_service_1.default.getTaxFilings(userId);
            res.status(200).json(filings);
        }
        catch (error) {
            console.error('Error in getTaxFilings controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get action guidance for a tax filing with "Needs Action" status
     * POST /api/refund-status/:taxFileId/action-guidance
     */
    async getActionGuidance(req, res) {
        try {
            const { taxFileId } = req.params;
            const { userContext } = req.body;
            if (!taxFileId) {
                res.status(400).json({ error: 'Tax file ID is required' });
                return;
            }
            // Get the refund status to verify it's "Needs Action"
            const status = await refund_status_service_1.default.getRefundStatus(taxFileId);
            if (!status) {
                res.status(404).json({ error: 'Tax filing not found' });
                return;
            }
            if (status.status !== 'Needs Action' || !status.actionRequired) {
                res.status(400).json({
                    error: 'This tax filing does not require action or has no action code'
                });
                return;
            }
            // Get action guidance from the service
            const actionGuidance = await action_guidance_service_1.default.getActionGuidance({
                actionCode: status.actionRequired,
                taxFileId,
                userContext
            });
            res.status(200).json(actionGuidance);
        }
        catch (error) {
            console.error('Error in getActionGuidance controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    constructor() {
        // Bind methods to ensure 'this' context is preserved
        this.getRefundStatus = this.getRefundStatus.bind(this);
        this.getRefundStatusHistory = this.getRefundStatusHistory.bind(this);
        this.getTaxFilings = this.getTaxFilings.bind(this);
        this.getActionGuidance = this.getActionGuidance.bind(this);
    }
}
exports.default = new RefundStatusController();
//# sourceMappingURL=refund-status-controller.js.map