import { ToolConfig } from '../types/agent.types';
import { CoreTools } from '../tools/coreTools';
import { CryptoTools } from '../tools/cryptoTools';
import { UtilityTools } from '../tools/utilityTools';
import { DataFetcher } from '../dataFetchers';
import { PriceData } from '../priceData';

export class ToolsManager {
  private coreTools: CoreTools;
  private cryptoTools: CryptoTools;
  private utilityTools: UtilityTools;
  private enabledTools: Map<string, ToolConfig>;

  constructor(dataFetcher: DataFetcher, priceDataFetcher: PriceData) {
    this.coreTools = new CoreTools(dataFetcher, priceDataFetcher);
    this.cryptoTools = new CryptoTools(priceDataFetcher);
    this.utilityTools = new UtilityTools();
    this.enabledTools = new Map();
    
    // Register all tools
    this.registerCoreTools();
    this.registerCryptoTools();
    this.registerUtilityTools();
  }

  private registerCoreTools(): void {
    const tools = this.coreTools.getAllTools();
    Object.entries(tools).forEach(([name, tool]) => {
      this.enabledTools.set(`core_${name}`, tool);
    });
  }

  private registerCryptoTools(): void {
    const tools = this.cryptoTools.getAllTools();
    Object.entries(tools).forEach(([name, tool]) => {
      this.enabledTools.set(`crypto_${name}`, tool);
    });
  }

  private registerUtilityTools(): void {
    const tools = this.utilityTools.getAllTools();
    Object.entries(tools).forEach(([name, tool]) => {
      this.enabledTools.set(`util_${name}`, tool);
    });
  }

  registerTool(name: string, tool: ToolConfig): void {
    this.enabledTools.set(name, tool);
  }

  unregisterTool(name: string): void {
    this.enabledTools.delete(name);
  }

  getTool(name: string): ToolConfig | undefined {
    return this.enabledTools.get(name);
  }

  getAllTools(): Record<string, ToolConfig> {
    const tools: Record<string, ToolConfig> = {};
    this.enabledTools.forEach((tool, name) => {
      tools[name] = tool;
    });
    return tools;
  }

  getToolsByCategory(category: string): Record<string, ToolConfig> {
    const tools: Record<string, ToolConfig> = {};
    this.enabledTools.forEach((tool, name) => {
      // Simple category matching - can be enhanced based on tool metadata
      if (name.toLowerCase().includes(category.toLowerCase()) || 
          tool.displayName?.toLowerCase().includes(category.toLowerCase())) {
        tools[name] = tool;
      }
    });
    return tools;
  }

  async executeTool(name: string, params: unknown): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool || !tool.execute) {
      throw new Error(`Tool ${name} not found or not executable`);
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      throw error;
    }
  }

  getToolsInfo(): Array<{ name: string; displayName?: string; description: string }> {
    const info: Array<{ name: string; displayName?: string; description: string }> = [];
    
    this.enabledTools.forEach((tool, name) => {
      info.push({
        name,
        displayName: tool.displayName,
        description: tool.description
      });
    });
    
    return info;
  }

  filterToolsByRequirements(requiredEnvVars: string[] = []): Record<string, ToolConfig> {
    const filteredTools: Record<string, ToolConfig> = {};
    
    this.enabledTools.forEach((tool, name) => {
      // Check if tool has required environment variables
      if (tool.requiredEnvVars) {
        const hasAllRequiredVars = tool.requiredEnvVars.every(envVar => 
          process.env[envVar] && process.env[envVar] !== ''
        );
        
        if (!hasAllRequiredVars) {
          console.warn(`Tool ${name} disabled due to missing environment variables:`, tool.requiredEnvVars);
          return;
        }
      }
      
      filteredTools[name] = tool;
    });
    
    return filteredTools;
  }
}
