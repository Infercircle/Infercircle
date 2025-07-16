import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from 'langchain/tools';
import { DataFetcher } from './dataFetchers';
// import { PriceDataFetcher } from './priceData';

export class AIAgent {
  private model: ChatOpenAI;
  private dataFetcher: DataFetcher;
//   private priceDataFetcher: PriceDataFetcher;

  constructor() {
    this.model = new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      model: "openai/gpt-4.1-nano",
      configuration: {
          baseURL: "https://openrouter.ai/api/v1"
      },
      temperature: 0.1,
      maxTokens: 8000 // Increased to prevent truncation
    });
    
    this.dataFetcher = new DataFetcher();
    // this.priceDataFetcher = new PriceDataFetcher();
  }

  // This method is no longer used but keeping for reference
  private createTools() {
    const fetchDataTool = new DynamicTool({
      name: 'fetch_recent_data',
      description: 'Fetch recent articles, tweets, and posts about a specific topic from the past 7 days',
      func: async (input: string) => {
        try {
          const query = input.trim();
          console.log(`Fetching data for query: "${query}"`);
          
          const data = await this.dataFetcher.fetchAllData(query, 7);
          console.log(`Fetched ${data.length} results for query: "${query}"`);
          
          if (data.length === 0) {
            return JSON.stringify({
              query,
              totalResults: 0,
              sources: [],
              message: "No recent data found for this topic. The information sources might be unavailable or the query might be too specific."
            });
          }
          
          return JSON.stringify({
            query,
            totalResults: data.length,
            sources: data
          });
        } catch (error) {
          console.error('Error in fetch_recent_data tool:', error);
          return JSON.stringify({
            query: input.trim(),
            totalResults: 0,
            sources: [],
            error: "Failed to fetch data from external sources. Backend services might be unavailable."
          });
        }
      }
    });

    // const priceChartTool = new DynamicTool({
    //   name: 'get_price_chart',
    //   description: 'Get historical price data for a cryptocurrency symbol',
    //   func: async (input: string) => {
    //     const symbol = input.trim().toUpperCase();
    //     const priceData = await this.priceDataFetcher.getHistoricalPrice(symbol, 30);
        
    //     return JSON.stringify({
    //       symbol,
    //       priceData: priceData.slice(0, 30)
    //     });
    //   }
    // });

    const analyzeTopicTool = new DynamicTool({
      name: 'analyze_topic',
      description: 'Analyze what topic/cryptocurrency the user is asking about using AI',
      func: async (input: string) => {
        const analysisPrompt = `Analyze this user query and determine:
1. What is the main topic/subject they're asking about?
2. Is it related to cryptocurrency/blockchain?
3. What specific cryptocurrency (if any) are they referring to?
4. What type of information are they seeking (price, news, analysis, etc.)?

User query: "${input}"

Respond with a JSON object containing:
- topic: the main subject (e.g., "solana", "bitcoin", "defi", "nft market")
- isCrypto: boolean indicating if it's crypto-related
- cryptoSymbol: the specific crypto symbol if identified (e.g., "SOL", "BTC", "ETH")
- intentType: what they want to know ("price", "news", "analysis", "general")
- confidence: confidence score (0-1)

Examples:
- "How is Solana doing?" → {"topic": "solana", "isCrypto": true, "cryptoSymbol": "SOL", "intentType": "general", "confidence": 0.9}
- "What's the latest on DeFi?" → {"topic": "defi", "isCrypto": true, "cryptoSymbol": null, "intentType": "news", "confidence": 0.8}
- "Show me Bitcoin price" → {"topic": "bitcoin", "isCrypto": true, "cryptoSymbol": "BTC", "intentType": "price", "confidence": 0.95}`;

        try {
          const analysisResponse = await this.model.invoke([
            { role: 'user', content: analysisPrompt }
          ]);
          
          // Extract JSON from the response
          const responseContent = typeof analysisResponse.content === 'string' 
            ? analysisResponse.content 
            : analysisResponse.content.toString();
          
          const jsonMatch = responseContent.match(/\{.*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return JSON.stringify(analysis);
          }
          
          // Fallback if JSON parsing fails
          return JSON.stringify({
            topic: input,
            isCrypto: false,
            cryptoSymbol: null,
            intentType: 'general',
            confidence: 0.3
          });
        } catch (error) {
          console.error('Error in topic analysis:', error);
          return JSON.stringify({
            topic: input,
            isCrypto: false,
            cryptoSymbol: null,
            intentType: 'general',
            confidence: 0.1
          });
        }
      }
    });

    return [fetchDataTool, analyzeTopicTool];
  }

  async processQuery(userInput: string, conversationHistory: { role: string; content: string }[] = []): Promise<string> {
    try {
      console.log('Processing query:', userInput);
      
      // Step 1: ALWAYS analyze the topic first
      console.log('Step 1: Analyzing topic...');
      const topicAnalysis = await this.analyzeTopicWithAI(userInput);
      console.log('Topic analysis result:', topicAnalysis);
      
      // Step 2: Based on analysis, decide whether to fetch data
      let recentData = '';
      let fetchedSources: { title: string; source: string; date: string; url: string }[] = [];
      
      if (topicAnalysis.isCrypto || topicAnalysis.intentType === 'news' || topicAnalysis.confidence > 0.5) {
        try {
          console.log(`Step 2: Fetching recent data for topic: "${topicAnalysis.topic}"`);
          const data = await this.dataFetcher.fetchAllData(topicAnalysis.topic, 7);
          console.log(`Fetched ${data.length} results`);
          
          fetchedSources = data.slice(0, 8);
          
          if (data.length > 0) {
            // Format the data with proper source citations including URLs
            const formattedSources = data.slice(0, 8).map((item, index) => {
              const sourceInfo = `[${index + 1}] ${item.title} (${item.source.toUpperCase()}, ${new Date(item.date).toDateString()})`;
              return `${sourceInfo}\n   Content: ${item.content?.substring(0, 180)}...\n   URL: ${item.url}`;
            }).join('\n\n');
            
            recentData = `\n\nRECENT DATA SOURCES for "${topicAnalysis.topic}" (${data.length} sources found):\n\n${formattedSources}`;
          } else {
            recentData = `\n\n[Searched for recent data about "${topicAnalysis.topic}" but no current information was found from external sources]`;
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          recentData = `\n\n[Note: Attempted to fetch recent data about "${topicAnalysis.topic}" but external sources are currently unavailable]`;
        }
      } else {
        console.log('Step 2: Skipping data fetching - topic analysis indicates no need for recent data');
      }

      // Step 3: Build conversation context
      const conversationContext = conversationHistory.length > 0 
        ? '\n\nConversation history:\n' + conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
        : '';

      // Step 4: Create a comprehensive prompt for the final response
      const responsePrompt = `You are an intelligent AI assistant. Please provide a comprehensive and complete response to the user's question.

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
2. If recent data sources are provided above, you MUST cite them in your response
3. When referencing information from the sources, use the format: "According to [source number]..." or "As reported by [source number]..."
4. Always include a "Sources:" section at the end of your response if you used any recent data
5. Use conversation history for context and personalization
6. Make sure your response is complete and not truncated
7. Be conversational and helpful
8. If discussing crypto topics, provide comprehensive insights
9. IMPORTANT: Always cite your sources when using recent data - this is mandatory

FORMAT FOR SOURCE CITATIONS:
- In text: "According to [1]..." or "As reported by [2]..."
- At the end: "Sources:\n[1] [Source title](URL)\n[2] [Source title](URL)\n..."

IMPORTANT: Format all source citations as markdown links using [text](url) format so they become clickable links in the chat interface.

Please provide your complete response with proper source citations formatted as clickable links:`;

      console.log('Step 3: Sending final prompt to AI for response generation...');
      
      const response = await this.model.invoke([
        { role: 'user', content: responsePrompt }
      ]);

      const responseContent = typeof response.content === 'string' 
        ? response.content 
        : response.content.toString();

      console.log('AI response generated. Length:', responseContent.length);
      console.log('AI response preview:', responseContent.substring(0, 200) + '...');
      
      // Ensure proper source citations using the sources we already fetched
      const finalResponse = this.formatResponseWithCitations(responseContent, fetchedSources);
      
      return finalResponse;
      
    } catch (error) {
      console.error('Error processing query:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  private async analyzeTopicWithAI(userInput: string): Promise<{topic: string, isCrypto: boolean, cryptoSymbol: string | null, intentType: string, confidence: number}> {
    try {
      const analysisPrompt = `Analyze this user query and determine:
1. What is the main topic/subject they're asking about?
2. Is it related to cryptocurrency/blockchain?
3. What specific cryptocurrency (if any) are they referring to?
4. What type of information are they seeking (price, news, analysis, etc.)?

User query: "${userInput}"

Respond with ONLY a JSON object containing:
- topic: the main subject (e.g., "solana", "bitcoin", "defi", "nft market")
- isCrypto: boolean indicating if it's crypto-related
- cryptoSymbol: the specific crypto symbol if identified (e.g., "SOL", "BTC", "ETH") or null
- intentType: what they want to know ("price", "news", "analysis", "general")
- confidence: confidence score (0-1)

Examples:
"How is Solana doing?" → {"topic": "solana", "isCrypto": true, "cryptoSymbol": "SOL", "intentType": "general", "confidence": 0.9}
"What's the latest on DeFi?" → {"topic": "defi", "isCrypto": true, "cryptoSymbol": null, "intentType": "news", "confidence": 0.8}
"Show me Bitcoin price" → {"topic": "bitcoin", "isCrypto": true, "cryptoSymbol": "BTC", "intentType": "price", "confidence": 0.95}

JSON only:`;

      const analysisResponse = await this.model.invoke([
        { role: 'user', content: analysisPrompt }
      ]);

      const responseContent = typeof analysisResponse.content === 'string' 
        ? analysisResponse.content 
        : analysisResponse.content.toString();

      console.log('Raw analysis response:', responseContent);

      // Extract JSON from the response
      const jsonMatch = responseContent.match(/\{[^}]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }

      // Fallback if JSON parsing fails
      return {
        topic: userInput.toLowerCase(),
        isCrypto: this.containsCryptoKeywords(userInput),
        cryptoSymbol: null,
        intentType: 'general',
        confidence: 0.3
      };
    } catch (error) {
      console.error('Error in topic analysis:', error);
      return {
        topic: userInput.toLowerCase(),
        isCrypto: this.containsCryptoKeywords(userInput),
        cryptoSymbol: null,
        intentType: 'general',
        confidence: 0.1
      };
    }
  }

  private containsCryptoKeywords(query: string): boolean {
    const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto', 'cryptocurrency', 'defi', 'nft', 'blockchain', 'token', 'coin'];
    const lowerQuery = query.toLowerCase();
    return cryptoKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  private formatResponseWithCitations(response: string, sources: { title: string; source: string; date: string; url: string }[]): string {
    if (sources.length === 0) {
      return response;
    }

    let enhancedResponse = response;
    
    // Fix malformed inline citations like [3] (https://example.com)
    sources.forEach((source, index) => {
      const sourceNumber = index + 1;
      const sourceUrl = source.url;
      
      // Fix pattern like [3] (https://example.com) -> [3](https://example.com)
      const malformedPattern = new RegExp(`\\[${sourceNumber}\\]\\s*\\(([^)]+)\\)`, 'g');
      enhancedResponse = enhancedResponse.replace(malformedPattern, `[${sourceNumber}](${sourceUrl})`);
      
      // Fix pattern like (as reported by [3] (https://example.com))
      const inlinePattern = new RegExp(`\\(as reported by \\[${sourceNumber}\\]\\s*\\(([^)]+)\\)\\)`, 'g');
      enhancedResponse = enhancedResponse.replace(inlinePattern, `(as reported by [${sourceNumber}](${sourceUrl}))`);
      
      // Fix pattern like (according to [2] (https://example.com))
      const accordingPattern = new RegExp(`\\(according to \\[${sourceNumber}\\]\\s*\\(([^)]+)\\)\\)`, 'g');
      enhancedResponse = enhancedResponse.replace(accordingPattern, `(according to [${sourceNumber}](${sourceUrl}))`);
      
      // Fix pattern like (see [7] (https://example.com))
      const seePattern = new RegExp(`\\(see \\[${sourceNumber}\\]\\s*\\(([^)]+)\\)\\)`, 'g');
      enhancedResponse = enhancedResponse.replace(seePattern, `(see [${sourceNumber}](${sourceUrl}))`);
    });
    
    // Fix malformed sources section
    const sourcesMatch = enhancedResponse.match(/Sources:\s*\n([\s\S]*?)(?:\n\n|$)/);
    if (sourcesMatch) {
      const sourcesSection = sourcesMatch[1];
      let fixedSourcesSection = sourcesSection;
      
      sources.forEach((source, index) => {
        const sourceNumber = index + 1;
        const sourceUrl = source.url;
        
        // Fix pattern like [1] (https://example.com)
        const sourcePattern = new RegExp(`\\[${sourceNumber}\\]\\s*\\(([^)]+)\\)`, 'g');
        fixedSourcesSection = fixedSourcesSection.replace(sourcePattern, `[${sourceNumber}] [${source.title}](${sourceUrl})`);
      });
      
      enhancedResponse = enhancedResponse.replace(sourcesMatch[0], `Sources:\n${fixedSourcesSection}\n\n`);
    }
    
    // Clean up any remaining malformed patterns
    enhancedResponse = enhancedResponse
      .replace(/\(\[(\d+)\]\s*\(([^)]+)\)\)/g, '[$1]($2)')
      .replace(/\[(\d+)\]\s*\(([^)]+)\)\)/g, '[$1]($2)')
      .replace(/\(\(https:\/\/[^)]+\)\)/g, (match) => match.replace(/^\(\(/, '(').replace(/\)\)$/, ')'));
    
    return enhancedResponse;
  }
}