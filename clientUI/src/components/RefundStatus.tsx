import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RefundStatus as RefundStatusType, StatusType } from '../types';
import { getRefundStatus } from '../services/api';

const StatusContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--box-shadow);
  padding: 30px;
  margin-bottom: 30px;
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const StatusIcon = styled.div<{ status: StatusType }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  
  ${({ status }) => {
    switch (status) {
      case 'Approved':
        return `
          background-color: var(--success-color);
          color: white;
        `;
      case 'Processing':
        return `
          background-color: var(--primary-color);
          color: white;
        `;
      case 'Needs Action':
        return `
          background-color: var(--warning-color);
          color: white;
        `;
      default:
        return `
          background-color: var(--secondary-color);
          color: white;
        `;
    }
  }}
  
  svg {
    width: 30px;
    height: 30px;
  }
`;

const StatusInfo = styled.div`
  flex: 1;
  
  h2 {
    margin: 0 0 5px 0;
    font-size: 1.8rem;
  }
  
  p {
    margin: 0;
    color: var(--secondary-color);
  }
`;

const StatusDetails = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  width: 200px;
  font-weight: 500;
  color: var(--secondary-color);
`;

const DetailValue = styled.div`
  flex: 1;
`;

const ActionButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background-color: #005ea6;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

interface RefundStatusProps {
  taxFileId: string;
}

const RefundStatus: React.FC<RefundStatusProps> = ({ taxFileId }) => {
  const [status, setStatus] = useState<RefundStatusType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      const data = await getRefundStatus(taxFileId);
      setStatus(data);
      setLoading(false);
    };

    fetchStatus();
  }, [taxFileId]);

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'Approved':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
          </svg>
        );
      case 'Processing':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" />
            <path d="M12 12.5C12.83 12.5 13.5 11.83 13.5 11C13.5 10.17 12.83 9.5 12 9.5C11.17 9.5 10.5 10.17 10.5 11C10.5 11.83 11.17 12.5 12 12.5Z" fill="currentColor" />
            <path d="M12 5.5V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 13.5V16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5.5 12H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M15.5 12H18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'Needs Action':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" />
            <path d="M11 11H13V17H11V11Z" fill="currentColor" />
            <path d="M12 7C11.45 7 11 7.45 11 8C11 8.55 11.45 9 12 9C12.55 9 13 8.55 13 8C13 7.45 12.55 7 12 7Z" fill="currentColor" />
          </svg>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <StatusContainer>
        <LoadingContainer>
          <p>Loading refund status...</p>
        </LoadingContainer>
      </StatusContainer>
    );
  }

  if (!status) {
    return (
      <StatusContainer>
        <StatusHeader>
          <StatusIcon status="Submitted">
            {getStatusIcon('Submitted')}
          </StatusIcon>
          <StatusInfo>
            <h2>Status Not Available</h2>
            <p>We couldn't find any information about this tax filing.</p>
          </StatusInfo>
        </StatusHeader>
      </StatusContainer>
    );
  }

  return (
    <StatusContainer>
      <StatusHeader>
        <StatusIcon status={status.status as StatusType}>
          {getStatusIcon(status.status as StatusType)}
        </StatusIcon>
        <StatusInfo>
          <h2>{status.status}</h2>
          <p>Last updated: {formatDate(status.lastUpdated)}</p>
        </StatusInfo>
      </StatusHeader>

      <StatusDetails>
        {status.details && (
          <DetailRow>
            <DetailLabel>Details:</DetailLabel>
            <DetailValue>{status.details}</DetailValue>
          </DetailRow>
        )}

        {status.status === 'Processing' && status.estimatedCompletionDays && (
          <DetailRow>
            <DetailLabel>Estimated Processing Time:</DetailLabel>
            <DetailValue>{status.estimatedCompletionDays} days</DetailValue>
          </DetailRow>
        )}

        {status.status === 'Processing' && status.estimatedCompletionDate && (
          <DetailRow>
            <DetailLabel>Estimated Completion Date:</DetailLabel>
            <DetailValue>{formatDate(status.estimatedCompletionDate)}</DetailValue>
          </DetailRow>
        )}

        {status.status === 'Approved' && status.refundAmount && (
          <DetailRow>
            <DetailLabel>Refund Amount:</DetailLabel>
            <DetailValue>{formatCurrency(status.refundAmount)}</DetailValue>
          </DetailRow>
        )}

        {status.status === 'Approved' && status.depositDate && (
          <DetailRow>
            <DetailLabel>Deposit Date:</DetailLabel>
            <DetailValue>{formatDate(status.depositDate)}</DetailValue>
          </DetailRow>
        )}

        {status.status === 'Needs Action' && status.actionRequired && (
          <>
            <DetailRow>
              <DetailLabel>Action Required:</DetailLabel>
              <DetailValue>{status.actionRequired}</DetailValue>
            </DetailRow>
            <ActionButton>Take Action</ActionButton>
          </>
        )}
      </StatusDetails>
    </StatusContainer>
  );
};

export default RefundStatus;