// New modular AI Agent implementation
import { AIAgent } from './modules';
import { ConversationMessage } from './modules';

// Create a singleton instance of the AI Agent
const aiAgent = new AIAgent();

// Legacy compatibility wrapper
export class AIAgentLegacy {
  private agent: AIAgent;

  constructor() {
    this.agent = aiAgent;
  }

  // Main method for processing queries - maintains backward compatibility
  async processQuery(
    userInput: string,
    conversationHistory: ConversationMessage[] = []
  ): Promise<string> {
    return await this.agent.processQuery(userInput, conversationHistory);
  }

  // Tool execution method
  async executeTool(toolName: string, params: unknown): Promise<unknown> {
    return await this.agent.executeTool(toolName, params);
  }

  // Get available tools
  getAvailableTools(): Array<{ name: string; displayName?: string; description: string }> {
    return this.agent.getAvailableTools();
  }

  // Utility methods
  async analyzeTopicOnly(userInput: string) {
    return await this.agent.analyzeTopicOnly(userInput);
  }

  extractContractAddress(query: string): string | null {
    return this.agent.extractContractAddress(query);
  }

  async fetchDataOnly(query: string, days: number = 7) {
    return await this.agent.fetchDataOnly(query, days);
  }

  // Add a tool to the agent
  registerTool(name: string, tool: unknown): void {
    this.agent.registerTool(name, tool);
  }
}

// Export the legacy class as default for backward compatibility
export default AIAgentLegacy;

// Also export the modern AIAgent for new implementations
export { AIAgent } from './modules';
export type { ConversationMessage, TopicAnalysis, DataSource } from './modules';
