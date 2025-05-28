import { Request, Response } from 'express';
import refundStatusService from '../services/refund-status-service';
import dbService from '../db/db-service';

class RefundStatusController {
  /**
   * Get the refund status for a tax filing
   * GET /api/refund-status/:taxFileId
   */
  async getRefundStatus(req: Request, res: Response): Promise<void> {
    try {
      const { taxFileId } = req.params;

      if (!taxFileId) {
        res.status(400).json({ error: 'Tax file ID is required' });
        return;
      }

      const status = await refundStatusService.getRefundStatus(taxFileId);

      if (!status) {
        res.status(404).json({ error: 'Tax filing not found' });
        return;
      }

      res.status(200).json(status);
    } catch (error) {
      console.error('Error in getRefundStatus controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get the refund status history for a tax filing
   * GET /api/refund-status/:taxFileId/history
   */
  async getRefundStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const { taxFileId } = req.params;

      if (!taxFileId) {
        res.status(400).json({ error: 'Tax file ID is required' });
        return;
      }

      const history = await refundStatusService.getRefundStatusHistory(taxFileId);
      res.status(200).json(history);
    } catch (error) {
      console.error('Error in getRefundStatusHistory controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all tax filings for a user
   * GET /api/users/:userId/tax-filings
   */
  async getTaxFilings(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Check if user exists
      const user = await dbService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const filings = await refundStatusService.getTaxFilings(userId);
      res.status(200).json(filings);
    } catch (error) {
      console.error('Error in getTaxFilings controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

}

export default new RefundStatusController();