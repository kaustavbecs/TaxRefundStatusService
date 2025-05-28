# Tax Refund Status Service

A full-stack application for checking tax refund status and estimating refund availability time.

## Project Structure

This project consists of two main components:

1. **Service**: A backend API service built with Node.js, Express, and TypeScript that provides tax refund status information and predictions.
2. **Client UI**: A frontend application built with React and TypeScript that resembles TurboTax's interface for displaying tax refund status.

## Service

The service component provides an API for:
- Checking the status of tax refunds
- Viewing the history of status updates
- Estimating the time for refund availability

### Technologies Used

- Node.js
- Express
- TypeScript
- SQLite
- RESTful API design

### Key Features

- Tax refund status API
- Status history tracking
- Refund availability prediction
- SQLite database for data storage

## Client UI

The client UI component provides a user interface that resembles TurboTax for:
- Viewing tax filings
- Checking the status of tax refunds
- Viewing the history of status updates
- Seeing estimated time for refund availability

### Technologies Used

- React
- TypeScript
- Styled Components
- Axios for API communication

### Key Features

- TurboTax-like interface
- Tax filing selection
- Refund status display
- Status history timeline

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install service dependencies:
   ```
   cd service
   npm install
   ```
3. Install client UI dependencies:
   ```
   cd clientUI
   npm install
   ```

### Running the Application

1. Start the service:
   ```
   cd service
   npm run init-db  # Initialize the database with sample data
   npm run dev      # Start the service in development mode
   ```

2. Start the client UI:
   ```
   cd clientUI
   npm start
   ```

3. Access the application at http://localhost:3000

## API Endpoints

### Authentication

```
POST /api/users/auth
```

### Get Tax Filings

```
GET /api/users/:userId/tax-filings
```

### Get Refund Status

```
GET /api/refund-status/:taxFileId
```

### Get Refund Status History

```
GET /api/refund-status/:taxFileId/history
```

## Future Enhancements

- Integration with a real ML model for more accurate predictions
- User authentication with JWT
- Real-time status updates
- Email/SMS notifications
- Mobile app version

## Project Structure

```
/
├── service/                  # Backend service
│   ├── src/                  # Source code
│   │   ├── controllers/      # API controllers
│   │   ├── db/               # Database services
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic services
│   │   └── server.ts         # Main server file
│   ├── db/                   # Database files
│   │   ├── schema.sql        # Database schema
│   │   └── sample_data.sql   # Sample data
│   └── README.md             # Service documentation
│
├── clientUI/                 # Frontend client
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   ├── styles/           # CSS styles
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # Main application component
│   └── README.md             # Client documentation
│
└── README.md                 # Main project documentation