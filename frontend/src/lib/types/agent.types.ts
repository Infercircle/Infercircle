// Base types and interfaces for the AI Agent system
export interface ConversationMessage {
  role: string;
  content: string;
}

export interface TopicAnalysis {
  topic: string;
  isCrypto: boolean;
  cryptoSymbol: string | null;
  intentType: string;
  confidence: number;
}

export interface DataSource {
  title: string;
  source: string;
  date: string;
  url: string;
  content?: string;
}

export interface AIModelConfig {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ToolConfig {
  displayName?: string;
  description: string;
  parameters?: unknown;
  execute?: (params: unknown) => Promise<unknown>;
  render?: (result: unknown) => React.ReactNode | null;
  requiresConfirmation?: boolean;
  requiredEnvVars?: string[];
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QueryProcessingOptions {
  skipDataFetching?: boolean;
  maxSources?: number;
  dataFetchDays?: number;
}

export interface ProcessedQuery {
  topicAnalysis: TopicAnalysis;
  recentData: string;
  fetchedSources: DataSource[];
  conversationContext: string;
}
