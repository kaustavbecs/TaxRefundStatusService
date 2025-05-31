"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
dotenv_1.default.config();
// Knowledge Base configuration
const KNOWLEDGE_BASE_ID = 'IXOCHFJZUZ';
const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
const AWS_REGION = 'us-east-1';
class ActionGuidanceService {
    /**
     * Query the knowledge base with an action code and generate user guidance
     */
    async getActionGuidance(request) {
        try {
            console.log(`[AWS] Action guidance request for action code: ${request.actionCode}`, {
                taxFileId: request.taxFileId,
                userContext: request.userContext || {}
            });
            // 1. Query the knowledge base for information about the action code
            const kbResults = await this.queryKnowledgeBase(request.actionCode);
            // 2. Generate a personalized response using the LLM
            const guidanceResponse = await this.generatePersonalizedGuidance(request.actionCode, kbResults, request.userContext);
            console.log(`[AWS] Action guidance response for action code: ${request.actionCode}`, {
                explanation: guidanceResponse.explanation.substring(0, 50) + '...',
                steps: guidanceResponse.steps.length,
                estimatedResolutionDays: guidanceResponse.estimatedResolutionDays,
                resources: guidanceResponse.resources.length
            });
            return guidanceResponse;
        }
        catch (error) {
            console.error(`[AWS] Error getting action guidance for action code: ${request.actionCode}`, error);
            throw new Error('Failed to generate action guidance: ' + (error.message || 'Unknown error'));
        }
    }
    /**
     * Query the Amazon Bedrock knowledge base for information about an action code
     */
    async queryKnowledgeBase(actionCode) {
        try {
            console.log(`[AWS] Querying knowledge base for action code: ${actionCode}`);
            const client = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({ region: AWS_REGION });
            const command = new client_bedrock_agent_runtime_1.RetrieveCommand({
                knowledgeBaseId: KNOWLEDGE_BASE_ID,
                retrievalQuery: {
                    text: `Action code: ${actionCode}`
                },
                retrievalConfiguration: {
                    vectorSearchConfiguration: {
                        numberOfResults: 5
                    }
                }
            });
            console.log(`[AWS] Knowledge base request:`, {
                knowledgeBaseId: KNOWLEDGE_BASE_ID,
                query: `Action code: ${actionCode}`,
                numberOfResults: 5
            });
            const response = await client.send(command);
            console.log(`[AWS] Knowledge base response for action code: ${actionCode}`, {
                resultCount: response.retrievalResults?.length || 0,
                results: response.retrievalResults?.map(result => ({
                    score: result.score,
                    location: result.location,
                    contentPreview: result.content?.text ? result.content.text.substring(0, 100) + '...' : 'No content'
                }))
            });
            // Extract text content from results
            if (!response.retrievalResults || response.retrievalResults.length === 0) {
                throw new Error("No results found in knowledge base for action code: " + actionCode);
            }
            const textResults = [];
            for (const result of response.retrievalResults) {
                if (result.content?.text) {
                    textResults.push(result.content.text);
                }
            }
            if (textResults.length === 0) {
                throw new Error("No text content found in knowledge base results");
            }
            console.log(`[AWS] Knowledge base extracted ${textResults.length} text results for action code: ${actionCode}`);
            return textResults;
        }
        catch (error) {
            console.error(`[AWS] Error querying knowledge base for action code: ${actionCode}:`, error);
            throw new Error('Failed to query knowledge base: ' + (error.message || 'Unknown error'));
        }
    }
    /**
     * Generate a personalized guidance message using the LLM
     */
    async generatePersonalizedGuidance(actionCode, knowledgeBaseInfo, userContext) {
        try {
            console.log(`[AWS] Generating personalized guidance for action code: ${actionCode}`);
            const client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: AWS_REGION });
            const prompt = this.buildPrompt(actionCode, knowledgeBaseInfo, userContext);
            console.log(`[AWS] LLM request for action code: ${actionCode}`, {
                modelId: MODEL_ID,
                promptLength: prompt.length,
                userContextProvided: !!userContext
            });
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: MODEL_ID,
                body: JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    max_tokens: 1000,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            });
            const response = await client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            console.log(`[AWS] LLM response received for action code: ${actionCode}`, {
                responseReceived: !!responseBody,
                hasContent: !!(responseBody?.content?.length)
            });
            if (!responseBody || !responseBody.content || !responseBody.content.length) {
                throw new Error("Invalid response from LLM");
            }
            const content = responseBody.content[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error(`[AWS] Failed to extract JSON from LLM response for action code: ${actionCode}`, {
                    contentLength: content.length,
                    contentPreview: content.substring(0, 100) + '...'
                });
                throw new Error("Could not extract JSON from LLM response");
            }
            const jsonResponse = JSON.parse(jsonMatch[0]);
            console.log(`[AWS] Parsed JSON response for action code: ${actionCode}`, {
                hasExplanation: !!jsonResponse.explanation,
                stepsCount: jsonResponse.steps?.length || 0,
                hasEstimatedDays: !!jsonResponse.estimatedResolutionDays,
                resourcesCount: jsonResponse.resources?.length || 0
            });
            if (!jsonResponse.explanation || !jsonResponse.steps || !jsonResponse.estimatedResolutionDays || !jsonResponse.resources) {
                throw new Error("LLM response missing required fields");
            }
            return {
                explanation: jsonResponse.explanation,
                steps: jsonResponse.steps,
                estimatedResolutionDays: jsonResponse.estimatedResolutionDays,
                resources: jsonResponse.resources
            };
        }
        catch (error) {
            console.error(`[AWS] Error generating personalized guidance for action code: ${actionCode}:`, error);
            throw new Error('Failed to generate personalized guidance: ' + (error.message || 'Unknown error'));
        }
    }
    /**
     * Build a prompt for the LLM based on the action code, knowledge base results, and user context
     */
    buildPrompt(actionCode, knowledgeBaseResults, userContext) {
        return `
You are a helpful tax assistant providing guidance on resolving tax refund issues.

The user has a tax refund with status "Needs Action" and action code "${actionCode}".

I have retrieved the following information from our knowledge base about this action code:

${knowledgeBaseResults.map((result, index) => `--- Result ${index + 1} ---\n${result}`).join('\n\n')}

User context:
${JSON.stringify(userContext || {}, null, 2)}

Based on the knowledge base information above, please:
1. Identify the description, category, severity, required documents, resolution steps, estimated resolution days, and IRS resources for this action code.
2. Create a helpful, personalized explanation of the issue and clear steps to resolve it.

Format your response as a JSON object with the following fields:
- explanation: A clear, friendly explanation of the issue in plain language
- steps: An array of specific steps the user should take to resolve the issue
- estimatedResolutionDays: The estimated number of days to resolve the issue (as a number)
- resources: An array of links to relevant IRS resources

IMPORTANT: Your response must be a valid JSON object. The estimatedResolutionDays must be a number, not a string.
`;
    }
}
exports.default = new ActionGuidanceService();
//# sourceMappingURL=action-guidance-service.js.map