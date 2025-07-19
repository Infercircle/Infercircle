import { Tool } from "langchain/tools";
import { z } from "zod";

export abstract class BaseTool<T = unknown> extends Tool {
  abstract name: string;
  abstract description: string;
  abstract parameters: z.ZodType<T>;
  
  // Get parameter metadata for the AI to understand what parameters are needed
  getParameterInfo(): string {
    if (this.parameters instanceof z.ZodObject) {
      const shape = this.parameters.shape;
      
      const paramInfo: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        const zodField = value as z.ZodTypeAny;
        const isOptional = zodField.isOptional();
        const description = zodField._def.description || 'No description';
        
        paramInfo.push(`${key} (${isOptional ? 'optional' : 'required'}): ${description}`);
      }
      
      return paramInfo.join('\n    ');
    }
    return 'No parameter information available';
  }
  
  protected async _call(input: string | undefined): Promise<string> {
    try {
      const startTime = Date.now();
      
      console.log(`[${this.name}] Raw input received:`, input);
      console.log(`[${this.name}] Input type:`, typeof input);
      
      // Handle undefined input
      if (input === undefined) {
        throw new Error('Tool input is undefined');
      }
      
      // Handle both string and object inputs
      let parsedInput: unknown;
      if (typeof input === 'string') {
        try {
          parsedInput = JSON.parse(input);
          console.log(`[${this.name}] Parsed string input:`, parsedInput);
        } catch {
          // If parsing fails, treat as plain string for backward compatibility
          parsedInput = input;
          console.log(`[${this.name}] Failed to parse JSON, using raw string:`, parsedInput);
        }
      } else {
        // Input is already an object
        parsedInput = input;
        console.log(`[${this.name}] Using object input directly:`, parsedInput);
      }
      
      // If parsedInput is an object with just an 'input' field, extract it
      if (parsedInput && typeof parsedInput === 'object' && 'input' in parsedInput) {
        const inputObj = parsedInput as Record<string, unknown>;
        // If input is a string and we only have the input field, use the string directly
        if (typeof inputObj.input === 'string' && Object.keys(inputObj).length === 1) {
          parsedInput = inputObj.input;
          console.log(`[${this.name}] Extracted input field:`, parsedInput);
        }
      }
      
      console.log(`[${this.name}] Input before validation:`, parsedInput);
      
      // Validate input with the tool's parameters schema
      const validatedInput = this.parameters.parse(parsedInput);
      console.log(`[${this.name}] Validated input:`, validatedInput);
      
      const result = await this.execute(validatedInput);
      const executionTime = Date.now() - startTime;
      
      return JSON.stringify({
        success: true,
        result,
        toolName: this.name,
        executionTime,
        isHtml: this.isHtmlResponse(result),
        isReactComponent: this.isReactComponentResponse(result),
        componentName: this.isReactComponentResponse(result) ? result.componentName : undefined,
        componentProps: this.isReactComponentResponse(result) ? result.props : undefined
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolName: this.name,
        executionTime: 0
      });
    }
  }
  
  protected abstract execute(input: T): Promise<unknown>;
  
  protected isHtmlResponse(result: unknown): boolean {
    if (typeof result === 'string') {
      return result.trim().startsWith('<') && result.trim().endsWith('>');
    }
    return false;
  }
  
  protected isReactComponentResponse(result: unknown): result is { componentName: string; props: Record<string, unknown> } {
    return result !== null && 
           typeof result === 'object' && 
           'componentName' in result && 
           'props' in result;
  }
}