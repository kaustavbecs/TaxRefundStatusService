import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TaxProcessingEvent, StatusType } from '../types';
import { getRefundStatusHistory } from '../services/api';

const HistoryContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--box-shadow);
  padding: 30px;
`;

const HistoryTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
`;

const Timeline = styled.div`
  position: relative;
  padding-left: 30px;
  
  &::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: var(--border-color);
  }
`;

const TimelineItem = styled.div`
  position: relative;
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TimelineDot = styled.div<{ status: StatusType }>`
  position: absolute;
  left: -30px;
  top: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  
  ${({ status }) => {
    switch (status) {
      case 'Approved':
        return `background-color: var(--success-color);`;
      case 'Processing':
        return `background-color: var(--primary-color);`;
      case 'Needs Action':
        return `background-color: var(--warning-color);`;
      default:
        return `background-color: var(--secondary-color);`;
    }
  }}
`;

const TimelineContent = styled.div`
  padding-bottom: 10px;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const TimelineStatus = styled.div<{ status: StatusType }>`
  font-weight: 500;
  
  ${({ status }) => {
    switch (status) {
      case 'Approved':
        return `color: var(--success-color);`;
      case 'Processing':
        return `color: var(--primary-color);`;
      case 'Needs Action':
        return `color: var(--warning-color);`;
      default:
        return `color: var(--secondary-color);`;
    }
  }}
`;

const TimelineDate = styled.div`
  color: var(--secondary-color);
  font-size: 0.9rem;
`;

const TimelineDetails = styled.div`
  color: var(--dark-color);
`;

const TimelineAction = styled.div`
  margin-top: 5px;
  color: var(--danger-color);
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
`;

interface RefundStatusHistoryProps {
  taxFileId: string;
}

const RefundStatusHistory: React.FC<RefundStatusHistoryProps> = ({ taxFileId }) => {
  const [events, setEvents] = useState<TaxProcessingEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const data = await getRefundStatusHistory(taxFileId);
      setEvents(data);
      setLoading(false);
    };

    fetchHistory();
  }, [taxFileId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <HistoryContainer>
        <HistoryTitle>Refund Status History</HistoryTitle>
        <LoadingContainer>
          <p>Loading history...</p>
        </LoadingContainer>
      </HistoryContainer>
    );
  }

  if (events.length === 0) {
    return (
      <HistoryContainer>
        <HistoryTitle>Refund Status History</HistoryTitle>
        <p>No history available for this tax filing.</p>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <HistoryTitle>Refund Status History</HistoryTitle>
      <Timeline>
        {events.map((event) => (
          <TimelineItem key={event.EventID}>
            <TimelineDot status={event.NewStatus as StatusType} />
            <TimelineContent>
              <TimelineHeader>
                <TimelineStatus status={event.NewStatus as StatusType}>
                  {event.NewStatus}
                </TimelineStatus>
                <TimelineDate>{formatDate(event.StatusUpdateDate)}</TimelineDate>
              </TimelineHeader>
              <TimelineDetails>{event.StatusDetails}</TimelineDetails>
              {event.ActionRequired && (
                <TimelineAction>Action Required: {event.ActionRequired}</TimelineAction>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </HistoryContainer>
  );
};

export default RefundStatusHistory;