const axios = require('axios');

const testEndpoint = async () => {
  try {
    console.log('Testing action guidance endpoint...');
    
    // Use a tax file ID that has "Needs Action" status from our updated sample data
    const taxFileId = 'taxfile-006'; // User-002's 2025 tax file with "Needs Action" status and DOC-W2-MISSING action code
    
    const response = await axios.post(
      `http://localhost:3001/api/refund-status/${taxFileId}/action-guidance`,
      { userContext: {} },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
      console.error('Full error:', error);
    }
  }
};

testEndpoint();