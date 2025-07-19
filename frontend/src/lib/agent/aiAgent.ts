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

    console.log('Initializing AI Agent with model:', defaultConfig.model);
    console.log('Using Google API Key:', defaultConfig.apiKey ? '***' : 'Not provided');

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
    console.log('Initializing AI Agent with tools....................................................');
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
        `You are a helpful AI assistant with access to various tools. 
        
        When using tools:
        1. Always explain what tool you're using and why
        2. Pay attention to required parameters for execution - use EXACT parameter names as specified
        3. Analyze the user's input to extract the required parameters
        4. If required parameters are missing, ask the user to provide them
        5. If a tool returns HTML content, mention that the output will be rendered visually
        6. Be precise about what information you need to use each tool effectively
        7. If a tool fails, explain the error and suggest alternatives
        8. After executing a tool successfully, provide a brief summary of what was accomplished
        
        Available tools and their parameters:
        
        ${toolDescriptions}
        
        IMPORTANT RULES:
        - When calling get_price_chart, use "contractAddress" parameter (not "input")
        - Extract contract addresses from user messages intelligently
        - If user provides just a contract address string, use it as the contractAddress parameter
        - Always use proper JSON format when calling tools with the correct parameter names
        - If a required parameter is missing, ask the user to provide it instead of making assumptions
        - Keep responses concise and focused
        - After tool execution, briefly explain what data was retrieved
        
        Always be helpful and provide clear explanations of your actions.`
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
      verbose: true,
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
      console.log("------------------------------------------------");
      console.log('Processing message:', message);
      console.log("------------------------------------------------");
      const chatHistory = this.conversationHistory.flatMap(msg => [
        msg.role === 'user' 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ]);
      
      const result = await this.agent.invoke({
        input: message,
        chat_history: chatHistory,
      });
      console.log('Agent execution result:', result);
      console.log("------------------------------------------------");
      
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