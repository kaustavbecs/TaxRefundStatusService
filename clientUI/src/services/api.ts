import axios from 'axios';
import { TaxFile, RefundStatus, TaxProcessingEvent, ActionGuidance } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTaxFilings = async (userId: string): Promise<TaxFile[]> => {
  try {
    const response = await api.get<TaxFile[]>(`/users/${userId}/tax-filings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tax filings:', error);
    return [];
  }
};

export const getRefundStatus = async (taxFileId: string): Promise<RefundStatus | null> => {
  try {
    const response = await api.get<RefundStatus>(`/refund-status/${taxFileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching refund status:', error);
    return null;
  }
};

export const getRefundStatusHistory = async (taxFileId: string): Promise<TaxProcessingEvent[]> => {
  try {
    const response = await api.get<TaxProcessingEvent[]>(`/refund-status/${taxFileId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching refund status history:', error);
    return [];
  }
};

export const getActionGuidance = async (taxFileId: string, userContext?: any): Promise<ActionGuidance> => {
  try {
    const response = await api.post<ActionGuidance>(
      `/refund-status/${taxFileId}/action-guidance`,
      { userContext }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching action guidance:', error);
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error(error.message || 'Failed to fetch action guidance');
    }
  }
};

const apiService = {
  getTaxFilings,
  getRefundStatus,
  getRefundStatusHistory,
  getActionGuidance,
};

export default apiService;