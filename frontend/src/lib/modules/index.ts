// Main AI Agent exports
export { AIAgent } from '../core/aiAgent';

// Core modules
export { TopicAnalyzer } from '../analyzer/topicAnalyzer';
export { ResponseFormatter } from '../formatter/responseFormatter';
export { PromptBuilder } from '../prompt/promptBuilder';
export { DataProcessor } from '../processor/dataProcessor';
export { ToolsManager } from '../manager/toolsManager';

// Tools
export { CoreTools } from '../tools/coreTools';
export { CryptoTools } from '../tools/cryptoTools';
export { UtilityTools } from '../tools/utilityTools';

// Providers
export * from '../providers/aiProviders';

// Types
export type {
  ConversationMessage,
  TopicAnalysis,
  DataSource,
  AIModelConfig,
  ToolConfig,
  ToolResult,
  QueryProcessingOptions,
  ProcessedQuery
} from '../types/agent.types';

// Utility functions
import { AIAgent } from '../core/aiAgent';
import { AIModelConfig } from '../types/agent.types';

export const createAIAgent = (config?: Partial<AIModelConfig>) => {
  return new AIAgent(config);
};

export const getDefaultConfig = (): import('../types/agent.types').AIModelConfig => {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: "openai/gpt-4.1-nano",
    baseURL: "https://openrouter.ai/api/v1",
    temperature: 0.1,
    maxTokens: 8000
  };
};
