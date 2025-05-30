"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const refund_status_service_1 = __importDefault(require("../services/refund-status-service"));
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
}
exports.default = new RefundStatusController();
//# sourceMappingURL=refund-status-controller.js.map