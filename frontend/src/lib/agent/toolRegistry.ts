import { PriceChart } from "./tools/priceChart";
import { StructuredTool } from "langchain/tools";
import { DataFetcher } from "./tools/dataFetcher"

export class ToolRegistry {
  private tools: Map<string, StructuredTool> = new Map();
  
  constructor() {
    this.registerDefaultTools();
  }
  
  private registerDefaultTools() {
    this.registerTool(new DataFetcher());
    this.registerTool(new PriceChart());
  }
  
  registerTool(tool: StructuredTool) {
    this.tools.set(tool.name, tool);
    console.log(`Tool registered: ${tool.name}`);
  }
  
  getTool(name: string): StructuredTool | undefined {
    return this.tools.get(name);
  }
  
  getAllTools(): StructuredTool[] {
    return Array.from(this.tools.values());
  }
  
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
  
  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }
}
