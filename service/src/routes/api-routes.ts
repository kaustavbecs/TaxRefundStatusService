import { Router } from 'express';
import refundStatusController from '../controllers/refund-status-controller';

const router = Router();

// Tax refund status routes
router.get('/refund-status/:taxFileId', refundStatusController.getRefundStatus);
router.get('/refund-status/:taxFileId/history', refundStatusController.getRefundStatusHistory);

// User routes
router.get('/users/:userId/tax-filings', refundStatusController.getTaxFilings);
router.post('/users/auth', refundStatusController.authenticateUser);

export default router;