import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ToolRegistry } from './toolRegistry';
import { ToolExecutionResult, AgentMessage, AIModelConfig } from "../types/agent";

export class AIAgent {
  private llm: ChatGoogleGenerativeAI;
  private toolRegistry: ToolRegistry;
  private agent: AgentExecutor | null = null;
  private conversationHistory: AgentMessage[] = [];
  
  constructor(googleApiKey: string, model: string = "gemini-2.0-flash-lite") {
    const defaultConfig: AIModelConfig = {
        apiKey: process.env.GOOGLE_API_KEY || googleApiKey,
        model: model || "gemini-2.0-flash-lite",
        temperature: 0.1,
        maxTokens: 8000
    };

    if (!defaultConfig.apiKey) {
      throw new Error('Google API key is required');
    }

    this.llm = new ChatGoogleGenerativeAI({
        apiKey: defaultConfig.apiKey,
        model: defaultConfig.model || "gemini-1.5-flash",
        temperature: defaultConfig.temperature,
        maxOutputTokens: defaultConfig.maxTokens
    });
    
    this.toolRegistry = new ToolRegistry();
  }
  
  async initializeAgent() {
    const tools = this.toolRegistry.getAllTools();
    
    // Build detailed tool information including parameter metadata
    const toolDescriptions = tools.map(tool => {
      let toolInfo = `${tool.name}: ${tool.description}`;
      
      // Check if the tool has parameter metadata
      if ('getParameterInfo' in tool && typeof tool.getParameterInfo === 'function') {
        const paramInfo = (tool as unknown as { getParameterInfo: () => string }).getParameterInfo();
        if (paramInfo) {
          toolInfo += `\n    Parameters:\n    ${paramInfo}`;
        }
      }
      
      return toolInfo;
    }).join('\n\n');
    
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a sophisticated AI assistant specializing in cryptocurrency and blockchain analysis with access to real-time data tools.

        **YOUR ROLE:**
        - Provide comprehensive, data-driven analysis of cryptocurrencies, blockchain projects, and market trends
        - Always cite sources when providing information
        - Use available tools to fetch current data before making claims
        - Present information in a structured, professional manner

        **WHEN TO USE DATA TOOLS:**
        - User asks about specific cryptocurrencies (e.g., "How is Solana doing?", "What's happening with Bitcoin?")
        - User requests market analysis, sentiment analysis, or current events
        - User asks about specific projects, protocols, or market trends
        - When you need recent information to provide accurate responses

        **TOOL USAGE GUIDELINES:**
        1. **get_data_about_topic**: Use this for current information about any crypto topic
           - Always fetch data FIRST before providing analysis
           - Use specific topic names (e.g., "Solana", "Bitcoin", "DeFi")
           - Set appropriate time range (days parameter)
        
        2. **get_price_chart**: Use for price visualizations
           - Requires exact contract address parameter
           - Extract contract addresses carefully from user input

        **RESPONSE STRUCTURE:**
        When providing analysis after fetching data:
        1. **Executive Summary**: Brief overview of current situation
        2. **Key Findings**: Main insights from the data
        3. **Market Sentiment**: What the community is saying
        4. **Sources**: Always mention the sources and data points used
        5. **Visual Component**: Let tools render charts/data visualizations

        **AVAILABLE TOOLS:**
        ${toolDescriptions}

        **CRITICAL RULES:**
        - ALWAYS fetch recent data before making claims about current market conditions
        - Use exact parameter names as specified (e.g., "contractAddress", "topic", "days")
        - When asked about any crypto topic, use get_data_about_topic tool first
        - Provide structured analysis with clear source citations
        - Be honest about limitations and data freshness
        - If data is unavailable, suggest alternative search terms

        Remember: Your strength is combining real-time data with analytical insights to provide valuable, accurate information.`
      ],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);
    
    const agent = await createToolCallingAgent({
      llm: this.llm,
      tools,
      prompt,
    });
    
    this.agent = new AgentExecutor({
      agent,
      tools,
      verbose: false,
      maxIterations: 3,
      returnIntermediateSteps: true,
    });
    console.log('AI Agent initialized with tools:', tools.map(t => t.name).join(', '));
  }
  
  async processMessage(message: string): Promise<AgentMessage> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    
    try {
      const chatHistory = this.conversationHistory.flatMap(msg => [
        msg.role === 'user' 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ]);
      
      const result = await this.agent.invoke({
        input: message,
        chat_history: chatHistory,
      });
      
      const toolResults = this.extractToolResults(result.intermediateSteps || []);
      
      const assistantMessage: AgentMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: result.output,
        toolResults,
        timestamp: new Date(),
      };
      
      // Add to conversation history
      const userMessage: AgentMessage = {
        id: this.generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      this.conversationHistory.push(userMessage, assistantMessage);
      
      return assistantMessage;
      
    } catch (error) {
      console.error('Agent execution error:', error);
      
      const errorMessage: AgentMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      return errorMessage;
    }
  }
  
  private extractToolResults(intermediateSteps: Array<{ observation?: string }>): ToolExecutionResult[] {
    return intermediateSteps
      .map(step => {
        try {
          if (step.observation) {
            const parsed = JSON.parse(step.observation);
            return parsed as ToolExecutionResult;
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((result): result is ToolExecutionResult => result !== null);
  }
  
  addTool(tool: import("langchain/tools").Tool) {
    this.toolRegistry.registerTool(tool);
    this.initializeAgent(); // Reinitialize with new tools
  }
  
  getConversationHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }
  
  clearHistory() {
    this.conversationHistory = [];
  }
  
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}