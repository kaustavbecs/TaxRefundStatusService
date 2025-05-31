interface ActionGuidanceRequest {
    actionCode: string;
    taxFileId: string;
    userContext?: {
        filingHistory?: string;
        region?: string;
        complexityLevel?: string;
    };
}
interface ActionGuidanceResponse {
    explanation: string;
    steps: string[];
    estimatedResolutionDays: number;
    resources: string[];
}
declare class ActionGuidanceService {
    /**
     * Query the knowledge base with an action code and generate user guidance
     */
    getActionGuidance(request: ActionGuidanceRequest): Promise<ActionGuidanceResponse>;
    /**
     * Query the Amazon Bedrock knowledge base for information about an action code
     */
    private queryKnowledgeBase;
    /**
     * Generate a personalized guidance message using the LLM
     */
    private generatePersonalizedGuidance;
    /**
     * Build a prompt for the LLM based on the action code, knowledge base results, and user context
     */
    private buildPrompt;
}
declare const _default: ActionGuidanceService;
export default _default;
