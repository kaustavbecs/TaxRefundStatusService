import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Header from './components/Header';
import RefundStatus from './components/RefundStatus';
import RefundStatusHistory from './components/RefundStatusHistory';
import { TaxFile } from './types';
import { getTaxFilings } from './services/api';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 40px 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const PageTitle = styled.h1`
  margin-top: 0;
  margin-bottom: 30px;
  font-size: 2rem;
  color: var(--dark-color);
`;

const TaxFilingSelector = styled.div`
  margin-bottom: 30px;
`;

const SelectLabel = styled.label`
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 119, 197, 0.2);
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  
  @media (min-width: 992px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const MainColumn = styled.div``;

const SideColumn = styled.div``;

const Footer = styled.footer`
  background-color: var(--dark-color);
  color: white;
  padding: 30px 0;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 20px;
  
  a {
    color: white;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const FooterCopyright = styled.div`
  font-size: 0.9rem;
`;

// User dashboard component that handles the tax filing display
const UserDashboard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [taxFilings, setTaxFilings] = useState<TaxFile[]>([]);
  const [selectedTaxFileId, setSelectedTaxFileId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTaxFilings = async () => {
      if (!userId) return;
      
      setLoading(true);
      const data = await getTaxFilings(userId);
      setTaxFilings(data);
      
      // Select the most recent tax filing by default
      if (data.length > 0) {
        setSelectedTaxFileId(data[0].TaxFileID);
      }
      
      setLoading(false);
    };

    fetchTaxFilings();
  }, [userId]);

  const handleTaxFilingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTaxFileId(e.target.value);
  };

  const getSelectedTaxFiling = () => {
    return taxFilings.find(filing => filing.TaxFileID === selectedTaxFileId);
  };

  return (
    <AppContainer>
      <Header userName={`User ${userId}`} />
      
      <MainContent>
        <Container>
          <PageTitle>Tax Refund Status</PageTitle>
          
          {loading ? (
            <p>Loading tax filings...</p>
          ) : taxFilings.length === 0 ? (
            <p>No tax filings found for user {userId}.</p>
          ) : (
            <>
              <TaxFilingSelector>
                <SelectLabel htmlFor="tax-filing-select">Select Tax Filing:</SelectLabel>
                <Select
                  id="tax-filing-select"
                  value={selectedTaxFileId}
                  onChange={handleTaxFilingChange}
                >
                  {taxFilings.map(filing => (
                    <option key={filing.TaxFileID} value={filing.TaxFileID}>
                      {filing.TaxYear} {filing.FilingType} - Filed on {new Date(filing.DateOfFiling).toLocaleDateString()}
                    </option>
                  ))}
                </Select>
              </TaxFilingSelector>
              
              {selectedTaxFileId && (
                <ContentGrid>
                  <MainColumn>
                    <RefundStatus taxFileId={selectedTaxFileId} />
                  </MainColumn>
                  <SideColumn>
                    <RefundStatusHistory taxFileId={selectedTaxFileId} />
                  </SideColumn>
                </ContentGrid>
              )}
            </>
          )}
        </Container>
      </MainContent>
      
      <Footer>
        <FooterContent>
          <FooterLinks>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Help</a>
            <a href="#">Contact</a>
          </FooterLinks>
          <FooterCopyright>
            &copy; {new Date().getFullYear()} TurboTax. All rights reserved.
          </FooterCopyright>
        </FooterContent>
      </Footer>
    </AppContainer>
  );
};

// Main App component with routing
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/user/:userId" element={<UserDashboard />} />
        <Route path="/" element={<Navigate to="/user/1" replace />} />
      </Routes>
    </Router>
  );
};

export default App;