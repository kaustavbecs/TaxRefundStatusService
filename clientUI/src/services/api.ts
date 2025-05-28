import axios from 'axios';
import { TaxFile, RefundStatus, TaxProcessingEvent } from '../types';

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

export const authenticateUser = async (ssn: string): Promise<string | null> => {
  try {
    const response = await api.post<{ userId: string }>('/users/auth', { ssn });
    return response.data.userId;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
};

export default {
  getTaxFilings,
  getRefundStatus,
  getRefundStatusHistory,
  authenticateUser,
};