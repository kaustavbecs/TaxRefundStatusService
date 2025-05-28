Use Case 1: Approved Status Check


User logs in → Client app displays list of tax filings
User selects desired filing → Client sends TaxFileID to service
Query status → "Refund Approved"
Display: "$2,500 deposited on March 15th"


Use Case 2: Processing Status + AI Prediction


User logs in → Client app displays list of tax filings
User selects desired filing → Client sends TaxFileID to service
Query status: "Processing"
AI Service analyzes (using TaxFileID & recent processing trend for similar features) the estimated processing timelines
Displays: "Current Status: Processing, estimated completion: 7-10 business days"


Use Case 3: Action Required

User logs in → Client app displays list of tax filings
User selects desired filing → Client sends TaxFileID to service
Query status: "Action Required"
Displays: “Current Status: Action Required. Actions needed <>”
