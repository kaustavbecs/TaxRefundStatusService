import { Request, Response } from 'express';
import refundStatusService from '../services/refund-status-service';
import actionGuidanceService from '../services/action-guidance-service';
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

  /**
   * Get action guidance for a tax filing with "Needs Action" status
   * POST /api/refund-status/:taxFileId/action-guidance
   */
  async getActionGuidance(req: Request, res: Response): Promise<void> {
    try {
      const { taxFileId } = req.params;
      const { userContext } = req.body;

      if (!taxFileId) {
        res.status(400).json({ error: 'Tax file ID is required' });
        return;
      }

      // Get the refund status to verify it's "Needs Action"
      const status = await refundStatusService.getRefundStatus(taxFileId);

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
      const actionGuidance = await actionGuidanceService.getActionGuidance({
        actionCode: status.actionRequired,
        taxFileId,
        userContext
      });

      res.status(200).json(actionGuidance);
    } catch (error) {
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

export default new RefundStatusController();