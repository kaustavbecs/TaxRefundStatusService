# Tax Refund Status Service

A Sample full-stack application for checking tax refund status and estimating refund availability time.

## Overview

This project consists of three main components:

1. **Service**: A backend API service built with Node.js/Express that provides tax refund status information and predictions.
2. **Client UI**: A React frontend application that resembles TurboTax's interface for displaying tax refund status.
3. **ML & ETL**: A Python-based machine learning pipeline that processes tax data and predicts refund processing times.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.8+ (for ML & ETL)

### Documentation

Each component has its own detailed documentation:

- **Backend Service**: [service/README.md](service/README.md)
- **Frontend Client**: [clientUI/README.md](clientUI/README.md)
- **ML & ETL Pipeline**: [ml_etl/README.md](ml_etl/README.md)

Please refer to these component-specific READMEs for installation instructions, usage details, and API documentation.


## Project Structure

```
/
├── service/                  # Backend service
│   ├── src/                  # Source code
│   ├── db/                   # Database files
│   └── README.md             # Service documentation
│
├── clientUI/                 # Frontend client
│   ├── src/                  # Source code
│   └── README.md             # Client documentation
│
├── ml_etl/                   # ML & ETL pipeline
│   ├── src/                  # Source code
│   ├── data/                 # Data files
│   ├── models/               # Trained ML models
│   └── README.md             # ML & ETL documentation
│
└── README.md                 # Main project documentation
```

## Future Enhancements

- User authentication with JWT
- Real-time status updates