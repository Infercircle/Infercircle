import { ChatOpenAI } from '@langchain/openai';
import { ToolConfig } from './types/agent.types';

// Model configuration
export const getDefaultModel = () => {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "openai/gpt-4.1-nano",
    configuration: {
      baseURL: "https://openrouter.ai/api/v1"
    },
    temperature: 0.1,
    maxTokens: 8000
  });
};

// System prompts
export const getSystemPrompt = () => {
  return `You are an intelligent AI assistant specialized in cryptocurrency and blockchain analysis.
You provide comprehensive, accurate, and well-cited responses to user queries.

Current date: ${new Date().toISOString()}

Key capabilities:
- Cryptocurrency market analysis
- Blockchain technology insights  
- DeFi protocol information
- Token price analysis and charts
- News and sentiment analysis
- Technical analysis

Always cite sources when using recent data and format responses in a clear, structured manner.
Format all source citations as markdown links using [text](url) format so they become clickable links.`;
};

// Tool configuration
export interface ToolsetConfig {
  tools: string[];
  description: string;
  enabled?: boolean;
}

export const toolsets: Record<string, ToolsetConfig> = {
  core: {
    tools: ['core_fetchRecentData', 'core_getPriceChart', 'core_analyzeTopic'],
    description: 'Core functionality for data fetching, price charts, and topic analysis',
    enabled: true
  },
  crypto: {
    tools: ['crypto_getTokenPrice', 'crypto_getTokenInfo', 'crypto_getMarketTrends'],
    description: 'Cryptocurrency-specific tools for price data and market information',
    enabled: true
  },
  utility: {
    tools: ['util_webSearch', 'util_getTimestamp', 'util_formatText'],
    description: 'General utility tools for web search, timestamps, and text formatting',
    enabled: true
  }
};

// Filter tools based on environment variables and configuration
export function filterTools(tools: Record<string, ToolConfig>): Record<string, ToolConfig> {
  const disabledTools = process.env.NEXT_PUBLIC_DISABLED_TOOLS
    ? JSON.parse(process.env.NEXT_PUBLIC_DISABLED_TOOLS)
    : [];

  return Object.fromEntries(
    Object.entries(tools).filter(([toolName, toolConfig]) => {
      // Check if tool is disabled
      if (disabledTools.includes(toolName)) {
        console.log(`Tool ${toolName} is disabled via configuration`);
        return false;
      }
      
      // Check required environment variables
      if (toolConfig.requiredEnvVars) {
        for (const envVar of toolConfig.requiredEnvVars) {
          if (!process.env[envVar] || process.env[envVar] === '') {
            console.log(`Tool ${toolName} disabled due to missing environment variable: ${envVar}`);
            return false;
          }
        }
      }
      
      return true;
    })
  );
}

// Get tools from specific toolsets
export function getToolsFromToolsets(toolsetNames: string[], allTools: Record<string, ToolConfig>): Record<string, ToolConfig> {
  const requiredToolNames = new Set<string>();
  
  toolsetNames.forEach(toolsetName => {
    const toolset = toolsets[toolsetName];
    if (toolset && toolset.enabled) {
      toolset.tools.forEach(toolName => {
        requiredToolNames.add(toolName);
      });
    }
  });
  
  const result: Record<string, ToolConfig> = {};
  requiredToolNames.forEach(toolName => {
    if (allTools[toolName]) {
      result[toolName] = allTools[toolName];
    }
  });
  
  return result;
}

// Environment validation
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = ['OPENROUTER_API_KEY'];
  const missingVars: string[] = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName] === '') {
      missingVars.push(varName);
    }
  });
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Configuration presets
export const configPresets = {
  default: {
    temperature: 0.1,
    maxTokens: 8000,
    enabledToolsets: ['core', 'crypto', 'utility']
  },
  
  conservative: {
    temperature: 0.05,
    maxTokens: 4000,
    enabledToolsets: ['core']
  },
  
  experimental: {
    temperature: 0.3,
    maxTokens: 12000,
    enabledToolsets: ['core', 'crypto', 'utility']
  },
  
  development: {
    temperature: 0.2,
    maxTokens: 8000,
    enabledToolsets: ['core', 'crypto', 'utility']
  }
};

export type ConfigPreset = keyof typeof configPresets;
