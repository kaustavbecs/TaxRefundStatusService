# Tax Refund Status Service

A service for checking tax refund status and estimating refund availability time.

## Overview

This service provides an API for:
- Checking the status of tax refunds
- Viewing the history of status updates
- Estimating the time for refund availability

## Requirements

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Initialize the database:
   ```
   npm run init-db
   ```

## Running the Service

### Development Mode

```
npm run dev
```

This will start the server in development mode with hot reloading.

### Production Mode

```
npm run build
npm start
```

## API Endpoints

### Get Tax Filings

```
GET /api/users/:userId/tax-filings
```

Response:
```json
[
  {
    "TaxFileID": "taxfile-001",
    "UserID": "user-001",
    "TaxYear": 2024,
    "FilingType": "Individual",
    "DateOfFiling": "2024-02-15 10:30:00",
    "TaxCategories": "{\"income\": \"W2\", \"investments\": \"yes\"}",
    "DeductionCategories": "{\"mortgage\": \"yes\", \"student_loans\": \"yes\"}",
    "ClaimedRefundAmount": 2500.00,
    "GeographicRegion": "Northeast",
    "CreatedAt": "2024-02-15 10:30:00"
  }
]
```

### Get Refund Status

```
GET /api/refund-status/:taxFileId
```

Response (Approved):
```json
{
  "status": "Approved",
  "details": "Refund approved",
  "lastUpdated": "2024-03-15 14:30:00",
  "actionRequired": null,
  "refundAmount": 2500.00,
  "depositDate": "2024-03-15"
}
```

Response (Processing):
```json
{
  "status": "Processing",
  "details": "Tax filing under review",
  "lastUpdated": "2024-02-25 10:15:00",
  "actionRequired": null,
  "estimatedCompletionDays": 21,
  "estimatedCompletionDate": "2024-03-18"
}
```

Response (Needs Action):
```json
{
  "status": "Needs Action",
  "details": "Additional information required",
  "lastUpdated": "2024-03-20 15:45:00",
  "actionRequired": "Please provide missing W-2 form"
}
```

### Get Refund Status History

```
GET /api/refund-status/:taxFileId/history
```

Response:
```json
[
  {
    "EventID": "event-001",
    "TaxFileID": "taxfile-001",
    "OldStatus": null,
    "NewStatus": "Submitted",
    "StatusDetails": "Tax filing received",
    "StatusUpdateDate": "2024-02-15 10:30:00",
    "UpdateSource": "IRS",
    "ActionRequired": null,
    "ProcessingCenter": "Northeast Center",
    "CreatedAt": "2024-02-15 10:30:00"
  },
  {
    "EventID": "event-002",
    "TaxFileID": "taxfile-001",
    "OldStatus": "Submitted",
    "NewStatus": "Processing",
    "StatusDetails": "Tax filing under review",
    "StatusUpdateDate": "2024-02-20 09:45:00",
    "UpdateSource": "IRS",
    "ActionRequired": null,
    "ProcessingCenter": "Northeast Center",
    "CreatedAt": "2024-02-20 09:45:00"
  }
]
```

## Database

The service uses SQLite for data storage. The database file is located at `db/tax_refund.db`.

### Tables

- Users: User information
- TaxFiles: Tax filing information
- TaxProcessingEvents: Tax processing status updates
- TaxRefundPredictions: Predictions for refund availability
- IRSTransitionEstimates: Data for estimating processing times

## Future Enhancements

- Integration with a real ML model for more accurate predictions
- Authentication with JWT
- Rate limiting
- Caching