import axios from 'axios';
import dotenv from 'dotenv';
import { BedrockAgentRuntimeClient, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

dotenv.config();

// Knowledge Base configuration
const KNOWLEDGE_BASE_ID = 'IXOCHFJZUZ';
const KNOWLEDGE_BASE_NAME = 'knowledge-base-quick-start-kdyah';
const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
const AWS_REGION = 'us-east-1';

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

class ActionGuidanceService {
  /**
   * Query the knowledge base with an action code and generate user guidance
   */
  async getActionGuidance(request: ActionGuidanceRequest): Promise<ActionGuidanceResponse> {
    try {
      // 1. Query the knowledge base for information about the action code
      const kbResults = await this.queryKnowledgeBase(request.actionCode);
      
      // 2. Generate a personalized response using the LLM
      const guidanceResponse = await this.generatePersonalizedGuidance(
        request.actionCode,
        kbResults,
        request.userContext
      );
      
      return guidanceResponse;
    } catch (error: any) {
      console.error('Error getting action guidance:', error);
      throw new Error('Failed to generate action guidance: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Query the Amazon Bedrock knowledge base for information about an action code
   */
  private async queryKnowledgeBase(actionCode: string): Promise<string[]> {
    try {
      console.log(`Querying knowledge base for action code: ${actionCode}`);
      
      const client = new BedrockAgentRuntimeClient({ region: AWS_REGION });
      const command = new RetrieveCommand({
        knowledgeBaseId: KNOWLEDGE_BASE_ID,
        retrievalQuery: {
          text: `Action code: ${actionCode}`
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 5
          }
        }
      } as any);
      
      const response = await client.send(command);
      console.log("Knowledge base response:", JSON.stringify(response.retrievalResults, null, 2));
      
      // Extract text content from results
      if (!response.retrievalResults || response.retrievalResults.length === 0) {
        throw new Error("No results found in knowledge base for action code: " + actionCode);
      }
      
      const textResults: string[] = [];
      for (const result of response.retrievalResults) {
        if (result.content?.text) {
          textResults.push(result.content.text);
        }
      }
      
      if (textResults.length === 0) {
        throw new Error("No text content found in knowledge base results");
      }
      
      return textResults;
    } catch (error: any) {
      console.error('Error querying knowledge base:', error);
      throw new Error('Failed to query knowledge base: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Generate a personalized guidance message using the LLM
   */
  private async generatePersonalizedGuidance(
    actionCode: string,
    knowledgeBaseInfo: any,
    userContext?: any
  ): Promise<ActionGuidanceResponse> {
    try {
      console.log(`Generating personalized guidance for action code: ${actionCode}`);
      
      const client = new BedrockRuntimeClient({ region: AWS_REGION });
      const prompt = this.buildPrompt(actionCode, knowledgeBaseInfo, userContext);
      
      const command = new InvokeModelCommand({
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
        }) as any
      });
      
      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body as any));
      
      if (!responseBody || !responseBody.content || !responseBody.content.length) {
        throw new Error("Invalid response from LLM");
      }
      
      const content = responseBody.content[0]?.text || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from LLM response");
      }
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      if (!jsonResponse.explanation || !jsonResponse.steps || !jsonResponse.estimatedResolutionDays || !jsonResponse.resources) {
        throw new Error("LLM response missing required fields");
      }
      
      return {
        explanation: jsonResponse.explanation,
        steps: jsonResponse.steps,
        estimatedResolutionDays: jsonResponse.estimatedResolutionDays,
        resources: jsonResponse.resources
      };
    } catch (error: any) {
      console.error('Error generating personalized guidance:', error);
      throw new Error('Failed to generate personalized guidance: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Build a prompt for the LLM based on the action code, knowledge base results, and user context
   */
  private buildPrompt(actionCode: string, knowledgeBaseResults: string[], userContext?: any): string {
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

export default new ActionGuidanceService();