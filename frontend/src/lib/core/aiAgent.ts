import { ChatOpenAI } from '@langchain/openai';
import { TopicAnalyzer } from '../analyzer/topicAnalyzer';
import { ResponseFormatter } from '../formatter/responseFormatter';
import { PromptBuilder } from '../prompt/promptBuilder';
import { DataProcessor } from '../processor/dataProcessor';
import { ToolsManager } from '../manager/toolsManager';
import { DataFetcher } from '../dataFetchers';
import { PriceData } from '../priceData';
import { 
  ConversationMessage, 
  AIModelConfig, 
  TopicAnalysis, 
  DataSource,
  QueryProcessingOptions,
  ToolConfig
} from '../types/agent.types';

export class AIAgent {
  private model: ChatOpenAI;
  private dataFetcher: DataFetcher;
  private priceDataFetcher: PriceData;
  
  // Core modules
  private topicAnalyzer: TopicAnalyzer;
  private responseFormatter: ResponseFormatter;
  private promptBuilder: PromptBuilder;
  private dataProcessor: DataProcessor;
  private toolsManager: ToolsManager;

  constructor(config?: Partial<AIModelConfig>) {
    // Initialize AI model with default or provided config
    const defaultConfig: AIModelConfig = {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: "openai/gpt-4.1-nano",
      baseURL: "https://openrouter.ai/api/v1",
      temperature: 0.1,
      maxTokens: 8000
    };

    const modelConfig = { ...defaultConfig, ...config };

    this.model = new ChatOpenAI({
      apiKey: modelConfig.apiKey,
      model: modelConfig.model,
      configuration: {
        baseURL: modelConfig.baseURL
      },
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens
    });
    
    // Initialize data fetchers
    this.dataFetcher = new DataFetcher();
    this.priceDataFetcher = new PriceData();
    
    // Initialize modules
    this.topicAnalyzer = new TopicAnalyzer(this.model);
    this.responseFormatter = new ResponseFormatter();
    this.promptBuilder = new PromptBuilder();
    this.dataProcessor = new DataProcessor(this.dataFetcher, this.responseFormatter);
    this.toolsManager = new ToolsManager(this.dataFetcher, this.priceDataFetcher);
  }

  async processQuery(
    userInput: string, 
    conversationHistory: ConversationMessage[] = [],
    options: QueryProcessingOptions = {}
  ): Promise<string> {
    try {
      console.log('🚀 Processing query:', userInput);
      
      // Step 1: Analyze the topic
      console.log('📊 Step 1: Analyzing topic...');
      const topicAnalysis = await this.topicAnalyzer.analyzeTopicWithAI(userInput);
      console.log('📊 Topic analysis result:', topicAnalysis);
      
      // Step 1.5: Check for contract address and handle chart requests
      const contractAddress = this.topicAnalyzer.extractContractAddress(userInput);
      
      if (contractAddress && (topicAnalysis.intentType === 'chart' || topicAnalysis.intentType === 'price')) {
        console.log('🔍 Contract address detected, using price chart tool...');
        
        try {
          const chartResult = await this.toolsManager.executeTool('crypto_getPriceChart', {
            contractAddress: contractAddress,
            days: options.dataFetchDays || 30
          });
          
          if (chartResult && typeof chartResult === 'object' && 'success' in chartResult) {
            const result = chartResult as { success: boolean; data?: unknown; error?: string };
            
            if (result.success && result.data) {
              // Get the render method from the tool
              const priceChartTool = this.toolsManager.getTool('crypto_getPriceChart');
              if (priceChartTool && priceChartTool.render) {
                priceChartTool.render(result);
                
                // Return a response that includes both text and chart data
                return `Here's the price chart for the token with contract address ${contractAddress}:\n\n[CHART_COMPONENT]${JSON.stringify(result.data)}[/CHART_COMPONENT]\n\nThe chart shows the price history for the requested token over the last ${options.dataFetchDays || 30} days. You can interact with the chart to see specific price points and trends.`;
              }
              
              // Fallback to JSON data if render fails
              return `Here's the price data for contract ${contractAddress}:\n\n${JSON.stringify(result.data, null, 2)}`;
            } else {
              return `I couldn't fetch the price chart for contract ${contractAddress}. Error: ${result.error || 'Unknown error'}`;
            }
          }
        } catch (error) {
          console.error('Error executing price chart tool:', error);
          return `I encountered an error while trying to fetch the price chart for contract ${contractAddress}. Please try again or check if the contract address is valid.`;
        }
      }
      
      // Step 2: Process data fetching based on analysis (only if not a chart request)
      console.log('📥 Step 2: Processing data fetching...');
      const shouldSkipDataFetching = contractAddress && topicAnalysis.intentType === 'chart';
      
      const { recentData, fetchedSources } = await this.dataProcessor.processDataFetching(
        topicAnalysis, 
        {
          days: options.dataFetchDays || 7,
          maxSources: options.maxSources || 8,
          skipDataFetching: shouldSkipDataFetching || options.skipDataFetching || false
        }
      );
      
      // Step 3: Build conversation context
      console.log('💬 Step 3: Building conversation context...');
      const conversationContext = this.promptBuilder.buildConversationContext(conversationHistory);

      // Step 4: Create comprehensive prompt for final response
      console.log('📝 Step 4: Building response prompt...');
      const responsePrompt = this.promptBuilder.buildResponsePrompt(
        userInput,
        topicAnalysis,
        conversationContext,
        recentData
      );

      // Step 5: Generate AI response
      console.log('🤖 Step 5: Generating AI response...');
      const response = await this.model.invoke([
        { role: 'user', content: responsePrompt }
      ]);

      const responseContent = typeof response.content === 'string' 
        ? response.content 
        : response.content.toString();

      console.log('✅ AI response generated. Length:', responseContent.length);
      console.log('📄 AI response preview:', responseContent.substring(0, 200) + '...');
      
      // Step 6: Format and clean up response
      console.log('🎨 Step 6: Formatting response...');
      const cleanedResponse = this.responseFormatter.cleanupDuplicateSourceCitations(responseContent);
      const finalResponse = this.responseFormatter.formatResponseWithCitations(cleanedResponse, fetchedSources);
      
      console.log('🎉 Query processing completed successfully');
      return finalResponse;
      
    } catch (error) {
      console.error('❌ Error processing query:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  // Tool management methods
  async executeTool(toolName: string, params: unknown): Promise<unknown> {
    return await this.toolsManager.executeTool(toolName, params);
  }

  registerTool(name: string, tool: ToolConfig): void {
    this.toolsManager.registerTool(name, tool);
  }

  getAvailableTools(): Array<{ name: string; displayName?: string; description: string }> {
    return this.toolsManager.getToolsInfo();
  }

  // Utility methods exposed for external use
  async analyzeTopicOnly(userInput: string): Promise<TopicAnalysis> {
    return await this.topicAnalyzer.analyzeTopicWithAI(userInput);
  }

  extractContractAddress(query: string): string | null {
    return this.topicAnalyzer.extractContractAddress(query);
  }

  async fetchDataOnly(query: string, days: number = 7): Promise<DataSource[]> {
    return await this.dataProcessor.fetchSpecificData(query, days);
  }

  formatResponseOnly(response: string, sources: DataSource[]): string {
    return this.responseFormatter.formatResponseWithCitations(response, sources);
  }

  // Configuration methods
  updateModelConfig(config: Partial<AIModelConfig>): void {
    // This would require reinitializing the model
    console.log('Model configuration update requested:', config);
    // Implementation depends on whether we want to support hot-swapping models
  }

  getSystemPrompt(): string {
    return this.promptBuilder.buildSystemPrompt();
  }

  // Legacy compatibility method
  private createTools(): Record<string, unknown> {
    // This maintains backward compatibility with the old tool structure
    return this.toolsManager.getAllTools();
  }
}
