# Action Code AI Flow

## Overview

This document describes the AI-powered workflow for handling "Needs Action" status in the Tax Refund Status Service. When a tax refund status is marked as "Needs Action", the system will use AI to provide detailed, actionable guidance to users based on the specific action code received from the IRS.

## Flow Description

```mermaid
graph TD
    A[Tax Refund Status Request] --> B{Status = "Needs Action"?}
    B -->|No| C[Return Standard Status]
    B -->|Yes| D[Extract Action Code]
    D --> E[Query Action Code Knowledge Base]
    E --> F[Retrieve Detailed Action Information]
    F --> G[Send to LLM for Processing]
    G --> H[Generate User-Friendly Message]
    H --> I[Return Enhanced Status with Guidance]
```

## Detailed Steps

### 1. Status Detection
- The system receives a tax refund status request
- If the status is "Needs Action", the AI flow is triggered

### 2. Action Code Extraction
- Extract the action code from the `ActionRequired` field in the `TaxProcessingEvent` record
- The action code follows a standardized format (e.g., "AC-1234", "REQ-DOC-5678")

### 3. Knowledge Base Query
- Query the Action Code Knowledge Base using the extracted code
- The knowledge base contains detailed information about each action code, including:
  - Official description
  - Required documents
  - Typical resolution steps
  - Estimated resolution time
  - Common issues and solutions
  - Links to relevant IRS forms or resources

### 4. LLM Processing
- Send the retrieved action code details to the LLM service
- Include user context (if available) such as:
  - User's filing history
  - Previous interactions with similar action codes
  - User's geographic region
  - Tax filing complexity level

### 5. User Message Generation
- The LLM generates a personalized, user-friendly message that:
  - Explains the issue in plain language
  - Provides clear, step-by-step instructions for resolution
  - Includes estimated time to resolve
  - Offers links to relevant resources or forms
  - Suggests next actions the user should take

### 6. Enhanced Response Delivery
- The enhanced response is returned to the client application
- The client displays the actionable guidance to the user
- The system logs the interaction for future reference and improvement

## Implementation Requirements

### Knowledge Base
- Create a structured database of IRS action codes and their detailed meanings
- Include resolution steps, required documents, and estimated resolution times
- Regularly update the knowledge base with new or changed action codes

### LLM Integration
- Implement a service to communicate with the LLM API
- Create prompt templates that effectively structure the action code information
- Implement caching for common action codes to improve response time
- Set up monitoring for LLM response quality

### Response Formatting
- Define a standard format for the enhanced "Needs Action" responses
- Include sections for explanation, steps, timeline, and resources
- Support rich text formatting for better readability

## Example

**Input Action Code**: `DOC-W2-MISSING`

**Knowledge Base Entry**:
```json
{
  "code": "DOC-W2-MISSING",
  "description": "W-2 form missing or incomplete",
  "category": "Documentation",
  "severity": "Medium",
  "requiredDocuments": ["Complete W-2 form from all employers"],
  "resolutionSteps": [
    "Contact employer for a copy of W-2",
    "Submit W-2 through IRS amendment process",
    "If W-2 unavailable, complete Form 4852 (Substitute for W-2)"
  ],
  "estimatedResolutionDays": 14,
  "irsResources": ["https://www.irs.gov/forms-pubs/about-form-w-2"]
}
```

**LLM Generated Message**:
```
We need some additional information to process your tax refund. 

It appears that your W-2 form is either missing or incomplete. This form shows your wages and taxes withheld, which is essential for processing your refund.

Here's how to resolve this:
1. Contact your employer(s) to request a complete copy of your W-2 form
2. Once received, submit the W-2 through the IRS amendment process
3. If you cannot obtain a W-2, you can complete Form 4852 (Substitute for W-2) instead

This typically takes about 2 weeks to resolve once you've submitted the required documentation.

For more information, visit: https://www.irs.gov/forms-pubs/about-form-w-2

If you need assistance, you can contact TurboTax support or call the IRS directly at 1-800-829-1040.
```

## Monitoring and Improvement

- Track user satisfaction with AI-generated guidance
- Monitor resolution rates for different action codes
- Continuously improve the knowledge base based on user feedback and IRS updates
- Regularly retrain or fine-tune the LLM with new examples
- Implement A/B testing for different message formats and styles