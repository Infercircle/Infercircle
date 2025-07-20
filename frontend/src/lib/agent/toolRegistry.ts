
import { PriceChart } from "./tools/priceChart";
import { Tool } from "langchain/tools";

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  constructor() {
    this.registerDefaultTools();
  }
  
  private registerDefaultTools() {
    this.registerTool(new PriceChart());
  }
  
  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
    console.log(`Tool registered: ${tool.name}`);
  }
  
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
  
  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }
}
