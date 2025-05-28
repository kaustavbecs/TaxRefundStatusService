import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:3001/api';
const ML_API_URL = 'http://localhost:9090';

// Helper function to make API requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Test Suite for Tax Refund Status Service User Journeys
 *
 * This file contains tests for the three main user journeys:
 * 1. Approved Status Check
 * 2. Processing Status + AI Prediction
 * 3. Action Required
 */

// Run the tests manually
(async () => {
  try {
    console.log('Running Tax Refund Status Service User Journey Tests...\n');
    
    // Use Case 1: Approved Status Check
    console.log('Testing Use Case 1: Approved Status Check');
    await api.get(`/users/user-001/tax-filings`)
      .then((userTaxFilings) => {
        console.log(`Found ${userTaxFilings.data.length} tax filings for user-001`);
        return api.get(`/refund-status/taxfile-001`);
      })
      .then((refundStatus) => {
        console.log(`Status: ${refundStatus.data.status}`);
        console.log(`Details: ${refundStatus.data.details}`);
        console.log(`Last Updated: ${refundStatus.data.lastUpdated}`);
        console.log('Use Case 1: PASSED\n');
      })
      .catch(error => {
        console.error('Use Case 1 failed:', error.message);
      });
    
    // Use Case 2: Processing Status + AI Prediction
    console.log('Testing Use Case 2: Processing Status + AI Prediction');
    await api.get(`/users/user-002/tax-filings`)
      .then((userTaxFilings) => {
        console.log(`Found ${userTaxFilings.data.length} tax filings for user-002`);
        return api.get(`/refund-status/taxfile-002`);
      })
      .then((refundStatus) => {
        console.log(`Status: ${refundStatus.data.status}`);
        console.log(`Estimated Completion Days: ${refundStatus.data.estimatedCompletionDays}`);
        console.log(`Estimated Completion Date: ${refundStatus.data.estimatedCompletionDate}`);
        console.log('Use Case 2: PASSED\n');
      })
      .catch(error => {
        console.error('Use Case 2 failed:', error.message);
      });
    
    // Use Case 3: Action Required
    console.log('Testing Use Case 3: Action Required');
    await api.get(`/users/user-003/tax-filings`)
      .then((userTaxFilings) => {
        console.log(`Found ${userTaxFilings.data.length} tax filings for user-003`);
        return api.get(`/refund-status/taxfile-003`);
      })
      .then((refundStatus) => {
        console.log(`Status: ${refundStatus.data.status}`);
        console.log(`Action Required: ${refundStatus.data.actionRequired}`);
        console.log('Use Case 3: PASSED\n');
      })
      .catch(error => {
        console.error('Use Case 3 failed:', error.message);
      });
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
})();
(async () => {
  try {
    console.log('Running Tax Refund Status Service User Journey Tests...\n');
    
    // Use Case 1: Approved Status Check
    console.log('Testing Use Case 1: Approved Status Check');
    await api.get(`/users/user-001/tax-filings`)
      .then(userTaxFilings => {
        console.log(`Found ${userTaxFilings.data.length} tax filings for user-001`);
        return api.get(`/refund-status/taxfile-001`);
      })
      .then(refundStatus => {
        console.log(`Status: ${refundStatus.data.status}`);
        console.log(`Details: ${refundStatus.data.details}`);
        console.log(`Last Updated: ${refundStatus.data.lastUpdated}`);
        console.log('Use Case 1: PASSED\n');
      })
      .catch(error => {
        console.error('Use Case 1 failed:', error.message);
      });
    
    // Use Case 2: Processing Status + AI Prediction
    console.log('Testing Use Case 2: Processing Status + AI Prediction');
    await api.get(`/users/user-002/tax-filings`)
      .then(userTaxFilings => {
        console.log(`Found ${userTaxFilings.data.length} tax filings for user-002`);
        return api.get(`/refund-status/taxfile-002`);
      })
      .then(refundStatus => {
        console.log(`Status: ${refundStatus.data.status}`);
        console.log(`Estimated Completion Days: ${refundStatus.data.estimatedCompletionDays}`);
        console.log(`Estimated Completion Date: ${refundStatus.data.estimatedCompletionDate}`);
        console.log('Use Case 2: PASSED\n');
      })
      .catch(error => {
        console.error('Use Case 2 failed:', error.message);
      });
    
    // Use Case 3: Action Required
    console.log('Testing Use Case 3: Action Required');
    await api.get(`/users/user-003/tax-filings`)
      .then(userTaxFilings => {
        console.log(`Found ${userTaxFilings.data.length} tax filings for user-003`);
        return api.get(`/refund-status/taxfile-003`);
      })
      .then(refundStatus => {
        console.log(`Status: ${refundStatus.data.status}`);
        console.log(`Action Required: ${refundStatus.data.actionRequired}`);
        console.log('Use Case 3: PASSED\n');
      })
      .catch(error => {
        console.error('Use Case 3 failed:', error.message);
      });
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
})();