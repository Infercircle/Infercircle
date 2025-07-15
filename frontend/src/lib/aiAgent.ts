import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from 'langchain/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { DataFetcher } from './dataFetchers';
// import { PriceDataFetcher } from './priceData';

export class AIAgent {
  private model: ChatOpenAI;
  private dataFetcher: DataFetcher;
//   private priceDataFetcher: PriceDataFetcher;

  constructor() {
    this.model = new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      model: "google/gemini-2.0-flash-exp:free",
      configuration: {
          baseURL: "https://openrouter.ai/api/v1"
      }
    });
    
    this.dataFetcher = new DataFetcher();
    // this.priceDataFetcher = new PriceDataFetcher();
  }

  private createTools() {
    const fetchDataTool = new DynamicTool({
      name: 'fetch_recent_data',
      description: 'Fetch recent articles, tweets, and posts about a specific topic from the past 7 days',
      func: async (input: string) => {
        const query = input.trim();
        const data = await this.dataFetcher.fetchAllData(query, 7);
        
        return JSON.stringify({
          query,
          totalResults: data.length,
          sources: data.slice(0, 10) // Limit for context
        });
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
    const tools = this.createTools();
    
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an intelligent AI assistant specialized in cryptocurrency and financial topics. You have access to tools that can:
1. Analyze user queries to understand what topic/cryptocurrency they're asking about
2. Fetch recent data (articles, tweets, posts) about specific topics from the past 7 days
3. Get historical price chart data for cryptocurrencies

Your workflow should be:
1. First, analyze the user's query to understand what they're asking about
2. Based on the analysis:
   - If it's crypto-related and they want price info: fetch recent data AND get price chart
   - If it's crypto-related but general: fetch recent data first, then decide if price data is relevant
   - If it's a general topic: fetch recent data
3. Use the retrieved information to provide a comprehensive, contextual response

Always:
- Provide specific, data-driven insights based on the fetched information
- Mention your sources and when the data is from
- Be conversational and helpful
- If you fetch price data, highlight key trends or notable movements
- Structure your response clearly with relevant context from recent sources
- Remember and reference previous conversation context when relevant
- If the user asks about something they mentioned earlier, use that context to provide more personalized responses

Example flow for "How is Solana doing?":
1. Analyze → identifies Solana/SOL, crypto=true, intent=general
2. Fetch recent data about Solana
3. Get SOL price chart data
4. Synthesize both into a comprehensive response about Solana's recent performance

IMPORTANT: You have access to the full conversation history. Use this context to:
- Remember user preferences and previous questions
- Provide continuity between messages
- Reference earlier parts of the conversation when relevant
- Give more personalized and contextual responses`],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true
    });

    try {
      // Convert conversation history to the format expected by LangChain
      const chatHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'human' : 'ai',
        content: msg.content
      }));

      const response = await agentExecutor.invoke({
        input: userInput,
        chat_history: chatHistory
      });
      
      return response.output;
    } catch (error) {
      console.error('Error processing query:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }
}