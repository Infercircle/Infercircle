# AI Agent Modular Architecture

This document describes the new modular architecture for the AI Agent system, inspired by the [Neur project](https://github.com/NeurProjects/neur-app).

## Architecture Overview

The AI Agent has been refactored into a modular architecture with the following components:

### Core Modules

1. **AIAgent** (`/core/aiAgent.ts`) - Main orchestrator class
2. **TopicAnalyzer** (`/analyzer/topicAnalyzer.ts`) - Analyzes user queries to understand intent
3. **ResponseFormatter** (`/formatter/responseFormatter.ts`) - Formats AI responses with proper citations
4. **PromptBuilder** (`/prompt/promptBuilder.ts`) - Constructs prompts for AI model
5. **DataProcessor** (`/processor/dataProcessor.ts`) - Handles data fetching and processing
6. **ToolsManager** (`/manager/toolsManager.ts`) - Manages all available tools

### Tool Modules

1. **CoreTools** (`/tools/coreTools.ts`) - Essential tools (data fetching, price charts, topic analysis)
2. **CryptoTools** (`/tools/cryptoTools.ts`) - Cryptocurrency-specific tools
3. **UtilityTools** (`/tools/utilityTools.ts`) - General utility tools

### Types

All TypeScript interfaces are defined in `/types/agent.types.ts` for type safety.

## Key Benefits

1. **Modularity**: Each component has a single responsibility
2. **Testability**: Components can be tested independently
3. **Extensibility**: Easy to add new tools and modules
4. **Maintainability**: Clear separation of concerns
5. **Type Safety**: Comprehensive TypeScript typing

## Usage Examples

### Basic Usage

```typescript
import { AIAgent } from './lib/modules';

const agent = new AIAgent();

// Process a query
const response = await agent.processQuery(
  "What's the latest on Solana?",
  conversationHistory
);

// Execute a specific tool
const result = await agent.executeTool('core_fetchRecentData', {
  query: 'Solana',
  days: 7
});
```

### Advanced Usage

```typescript
import { 
  AIAgent, 
  TopicAnalyzer, 
  ToolsManager 
} from './lib/modules';

// Create custom configuration
const agent = new AIAgent({
  temperature: 0.2,
  maxTokens: 10000
});

// Register custom tools
agent.registerTool('customTool', {
  displayName: 'Custom Tool',
  description: 'A custom tool',
  execute: async (params) => {
    // Custom implementation
    return { success: true, data: 'result' };
  }
});

// Use individual modules
const analyzer = new TopicAnalyzer(model);
const analysis = await analyzer.analyzeTopicWithAI("Bitcoin price");
```

## Migration Guide

### From Legacy AIAgent

The legacy `AIAgent` class is still supported through `AIAgentLegacy` wrapper:

```typescript
// Old way (still works)
import AIAgent from './lib/aiAgent';
const agent = new AIAgent();

// New way (recommended)
import { AIAgent } from './lib/modules';
const agent = new AIAgent();
```

### Key Changes

1. **Constructor**: The new `AIAgent` accepts optional configuration
2. **Tool System**: Tools are now organized into categories with prefixes
3. **Type Safety**: All methods now have proper TypeScript types
4. **Modularity**: Individual modules can be imported and used independently

## Tool Categories

### Core Tools (prefix: `core_`)
- `core_fetchRecentData` - Fetch recent articles and data
- `core_getPriceChart` - Get cryptocurrency price charts
- `core_analyzeTopic` - Analyze user query topics

### Crypto Tools (prefix: `crypto_`)
- `crypto_getTokenPrice` - Get current token prices
- `crypto_getTokenInfo` - Get detailed token information
- `crypto_getMarketTrends` - Get market trends

### Utility Tools (prefix: `util_`)
- `util_webSearch` - Web search functionality
- `util_getTimestamp` - Get current timestamp
- `util_formatText` - Format text in various ways

## Adding New Tools

To add a new tool:

1. Create a new tool class in `/tools/`
2. Implement the `ToolConfig` interface
3. Register the tool in `ToolsManager`
4. Update the exports in `/modules/index.ts`

Example:

```typescript
// /tools/myCustomTools.ts
export class MyCustomTools {
  getMyTool(): ToolConfig {
    return {
      displayName: 'My Tool',
      description: 'Description of my tool',
      parameters: z.object({
        param1: z.string()
      }),
      execute: async ({ param1 }) => {
        // Implementation
        return { success: true, data: result };
      }
    };
  }
}
```

## Configuration

The AI Agent supports configuration through the constructor:

```typescript
const agent = new AIAgent({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  temperature: 0.1,
  maxTokens: 8000
});
```

## Testing

Each module can be tested independently:

```typescript
import { TopicAnalyzer } from './lib/analyzer/topicAnalyzer';

// Test topic analysis
const analyzer = new TopicAnalyzer(mockModel);
const result = await analyzer.analyzeTopicWithAI('test query');
```

## Future Enhancements

1. **Plugin System**: Dynamic tool loading
2. **Configuration Management**: Environment-based configuration
3. **Caching**: Response and data caching
4. **Monitoring**: Performance and usage metrics
5. **Rate Limiting**: API rate limiting
6. **Streaming**: Real-time streaming responses
