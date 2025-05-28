Core Functionality:
FR1: The client application can query user’s most recent tax refund status using unique tax identifier and tax filing id
FR2: System displays current refund status (Not Found, Processing, Needs Action, Approved)
FR3: AI model predicts estimated time for refund availability when status is “Processing”
FR4: Support querying for multiple tax filings per person
FR5: If the status is “Needs Action,” the system should provide actionable guidance or a summary of required user steps (e.g., missing documentation, verification needed)

Functional Assumptions:
System expects near real-time notifications from IRS (or from third party) via webhook integration for different tax filing ids
In some cases, the tax refund status notifications may not be instantaneous and could be subject to delays from external systems (e.g., IRS processing systems)
IRS systems do not share any reliable estimated time for refund availability. The system uses rolling actual processing time to make the estimation.
Users should be able to see a timeline/history of status updates for transparency and auditability.


Non-Functional Requirements:
NFR1: Handle 10k+ concurrent users during peak tax season. Should be able to scale horizontally to handle sudden spikes.
NFR2: 99.9% availability with <200ms response time for status queries. The system should be usable even during system updates.
NFR3: End-to-end encryption for user data.
NFR4: Graceful handling of client requests (showing last available data with a disclaimer) when the IRS systems are unavailable.
NFR5: Data consistency across distributed services.
NFR6: All interactions of the users via the client application to this system is logged for audit purposes.

Non-Functional Assumptions:
TurboTax Tax File Service and User Profile Service emit relevant events to publisher queues for downstream processing.
Authentication and session management (including JWT handling and OAuth flows) are already implemented and out of scope.
Access to external APIs is already authenticated securely and is out of scope.
Compliance & regulatory requirements are out of scope.
