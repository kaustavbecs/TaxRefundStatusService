# Tax Refund Status Client UI

A React-based client UI for checking tax refund status, designed to resemble TurboTax's interface.

## Overview

This client application provides a user interface for:
- Viewing tax filings
- Checking the status of tax refunds
- Viewing the history of status updates
- Seeing estimated time for refund availability

## Requirements

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Install dependencies:
   ```
   npm install
   ```

## Running the Client

### Development Mode

```
npm start
```

This will start the development server at http://localhost:3000.

### Production Build

```
npm run build
```

This will create a production build in the `build` folder.

## Features

### Tax Filing Selection
- Users can select from their tax filings to check the status

### Refund Status Display
- Shows current status (Submitted, Processing, Needs Action, Approved)
- For "Processing" status, shows estimated completion time
- For "Approved" status, shows refund amount and deposit date
- For "Needs Action" status, shows required actions

### Refund Status History
- Timeline view of all status updates
- Color-coded status indicators
- Detailed information about each status change

## Design

The UI is designed to resemble TurboTax's interface with:
- Clean, professional layout
- TurboTax color scheme
- Responsive design for various screen sizes
- Intuitive navigation

## API Integration

The client connects to the Tax Refund Status Service API to fetch:
- User's tax filings
- Current refund status
- Refund status history

## Future Enhancements

- User authentication
- Real-time status updates
- Email/SMS notifications
- Mobile app version