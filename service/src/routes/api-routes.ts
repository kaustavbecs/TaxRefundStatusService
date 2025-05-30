import { Router } from 'express';
import refundStatusController from '../controllers/refund-status-controller';

const router = Router();

// Tax refund status routes
router.get('/refund-status/:taxFileId', refundStatusController.getRefundStatus);
router.get('/refund-status/:taxFileId/history', refundStatusController.getRefundStatusHistory);
router.post('/refund-status/:taxFileId/action-guidance', refundStatusController.getActionGuidance);

// User routes
router.get('/users/:userId/tax-filings', refundStatusController.getTaxFilings);

export default router;