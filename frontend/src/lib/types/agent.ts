export interface ToolExecutionResult {
  success: boolean;
  result: any;
  error?: string;
  isHtml?: boolean;
  isReactComponent?: boolean;
  componentProps?: Record<string, any>;
  componentName?: string;
  toolName: string;
  executionTime: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: ToolExecutionResult[];
  timestamp: Date;
}

export interface CustomTool {
  name: string;
  description: string;
  execute: (input: string) => Promise<any>;
  schema?: any;
}

export interface AIModelConfig {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}