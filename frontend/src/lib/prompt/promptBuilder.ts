import { TopicAnalysis, ConversationMessage } from '../types/agent.types';

export class PromptBuilder {
  buildResponsePrompt(
    userInput: string,
    topicAnalysis: TopicAnalysis,
    conversationContext: string,
    recentData: string
  ): string {
    return `You are an intelligent AI assistant. Please provide a comprehensive and complete response to the user's question.

User's question: "${userInput}"

Topic Analysis Results:
- Main topic: ${topicAnalysis.topic}
- Is crypto-related: ${topicAnalysis.isCrypto}
- Intent type: ${topicAnalysis.intentType}
- Confidence: ${topicAnalysis.confidence}

${conversationContext}
${recentData}

CRITICAL INSTRUCTIONS:
1. Provide a complete, well-structured response
2. If price chart data is provided above, you MUST include it in your response exactly as provided
3. If price chart data is provided, the JSON data will be automatically rendered as an interactive chart
4. When including chart data, use the format: "Here is the chart data: [JSON_DATA]"
5. If recent data sources are provided above, you MUST cite them in your response
6. When referencing information from the sources, use the format: "According to [source number]..." or "As reported by [source number]..."
7. Always include a "Sources:" section at the end of your response if you used any recent data
8. Use conversation history for context and personalization
9. Make sure your response is complete and not truncated
10. Be conversational and helpful
11. If discussing crypto topics, provide comprehensive insights
12. IMPORTANT: Always cite your sources when using recent data - this is mandatory

FORMAT FOR CHART DATA:
- If chart data is provided in the price data section, include it EXACTLY as provided
- The JSON will be automatically detected and rendered as an interactive chart
- Example: "Here is the chart data: {"symbol": "USDC", "name": "USD Coin", "priceData": [...]}"

FORMAT FOR SOURCE CITATIONS:
- In text: "According to [1]..." or "As reported by [2]..."
- At the end: "Sources:\n[1] [Source title](URL)\n[2] [Source title](URL)\n..."

IMPORTANT: Format all source citations as markdown links using [text](url) format so they become clickable links in the chat interface.

Please provide your complete response with proper source citations formatted as clickable links:`;
  }

  buildConversationContext(conversationHistory: ConversationMessage[]): string {
    return conversationHistory.length > 0 
      ? '\n\nConversation history:\n' + conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';
  }

  buildSystemPrompt(): string {
    return `You are an intelligent AI assistant specialized in cryptocurrency and blockchain analysis. 
You provide comprehensive, accurate, and well-cited responses to user queries.

Key capabilities:
- Cryptocurrency market analysis
- Blockchain technology insights  
- DeFi protocol information
- Token price analysis and charts
- News and sentiment analysis
- Technical analysis

Always cite sources when using recent data and format responses in a clear, structured manner.`;
  }
}
