"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = __importDefault(require("../db/db-service"));
const prediction_service_1 = __importDefault(require("./prediction-service"));
class RefundStatusService {
    /**
     * Get the refund status for a tax filing
     */
    async getRefundStatus(taxFileId) {
        try {
            // Get tax file
            const taxFile = await db_service_1.default.getTaxFileById(taxFileId);
            if (!taxFile) {
                return null;
            }
            // Get latest tax processing event
            const latestEvent = await db_service_1.default.getLatestTaxProcessingEvent(taxFileId);
            if (!latestEvent) {
                return {
                    status: 'Not Found',
                    details: 'No processing events found for this tax filing.',
                    lastUpdated: new Date().toISOString(),
                    actionRequired: null
                };
            }
            // Create base status response
            const status = {
                status: latestEvent.NewStatus,
                details: latestEvent.StatusDetails,
                lastUpdated: latestEvent.StatusUpdateDate,
                actionRequired: latestEvent.ActionRequired
            };
            // Add additional information based on status
            switch (latestEvent.NewStatus) {
                case 'Processing':
                    // Get prediction for processing time
                    const prediction = await prediction_service_1.default.predictRefundAvailability(taxFileId);
                    if (prediction) {
                        status.estimatedCompletionDays = prediction.estimatedDays;
                        status.estimatedCompletionDate = prediction.predictedDate;
                    }
                    break;
                case 'Approved':
                    // Add refund amount and deposit date
                    status.refundAmount = taxFile.ClaimedRefundAmount;
                    // For approved status, use the status update date as the deposit date
                    // In a real system, this would come from a payment processing system
                    status.depositDate = latestEvent.StatusUpdateDate.split('T')[0]; // Format as YYYY-MM-DD
                    break;
                case 'Needs Action':
                    // No additional information needed, actionRequired is already set
                    break;
                case 'Not Found':
                    // No additional information needed
                    break;
            }
            return status;
        }
        catch (error) {
            console.error('Error getting refund status:', error);
            return null;
        }
    }
    /**
     * Get the refund status history for a tax filing
     */
    async getRefundStatusHistory(taxFileId) {
        try {
            return await db_service_1.default.getTaxProcessingEvents(taxFileId);
        }
        catch (error) {
            console.error('Error getting refund status history:', error);
            return [];
        }
    }
    /**
     * Get all tax filings for a user
     */
    async getTaxFilings(userId) {
        try {
            return await db_service_1.default.getTaxFilesByUserId(userId);
        }
        catch (error) {
            console.error('Error getting tax filings:', error);
            return [];
        }
    }
}
exports.default = new RefundStatusService();
//# sourceMappingURL=refund-status-service.js.map