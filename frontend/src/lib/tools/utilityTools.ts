import { z } from 'zod';
import { ToolConfig, ToolResult } from '../types/agent.types';

export class UtilityTools {
  getWebSearchTool(): ToolConfig {
    return {
      displayName: '🔍 Web Search',
      description: 'Search the web for information on a specific topic',
      parameters: z.object({
        query: z.string().describe('The search query'),
        maxResults: z.number().optional().default(5).describe('Maximum number of results to return')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { query, maxResults = 5 } = params as { query: string; maxResults?: number };
        try {
          // This would integrate with a web search API
          return {
            success: true,
            data: {
              query,
              results: [
                { title: 'Sample Result 1', url: 'https://example.com/1', snippet: 'Sample snippet...' },
                { title: 'Sample Result 2', url: 'https://example.com/2', snippet: 'Another snippet...' }
              ],
              totalResults: 2
            }
          };
        } catch (error) {
          console.error('Error performing web search:', error);
          return {
            success: false,
            error: "Failed to perform web search."
          };
        }
      }
    };
  }

  getTimestampTool(): ToolConfig {
    return {
      displayName: '🕐 Get Timestamp',
      description: 'Get current timestamp in various formats',
      parameters: z.object({
        format: z.string().optional().default('iso').describe('Timestamp format (iso, unix, readable)')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { format = 'iso' } = params as { format?: string };
        try {
          const now = new Date();
          let timestamp;
          
          switch (format) {
            case 'unix':
              timestamp = Math.floor(now.getTime() / 1000);
              break;
            case 'readable':
              timestamp = now.toLocaleString();
              break;
            default:
              timestamp = now.toISOString();
          }
          
          return {
            success: true,
            data: {
              timestamp,
              format,
              generated: now.toISOString()
            }
          };
        } catch (error) {
          console.error('Error generating timestamp:', error);
          return {
            success: false,
            error: "Failed to generate timestamp."
          };
        }
      }
    };
  }

  getFormatTextTool(): ToolConfig {
    return {
      displayName: '📝 Format Text',
      description: 'Format text in various ways (uppercase, lowercase, capitalize, etc.)',
      parameters: z.object({
        text: z.string().describe('The text to format'),
        format: z.enum(['uppercase', 'lowercase', 'capitalize', 'title']).describe('Format type')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { text, format } = params as { text: string; format: 'uppercase' | 'lowercase' | 'capitalize' | 'title' };
        try {
          let formattedText;
          
          switch (format) {
            case 'uppercase':
              formattedText = text.toUpperCase();
              break;
            case 'lowercase':
              formattedText = text.toLowerCase();
              break;
            case 'capitalize':
              formattedText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
              break;
            case 'title':
              formattedText = text.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
              );
              break;
            default:
              formattedText = text;
          }
          
          return {
            success: true,
            data: {
              original: text,
              formatted: formattedText,
              format
            }
          };
        } catch (error) {
          console.error('Error formatting text:', error);
          return {
            success: false,
            error: "Failed to format text."
          };
        }
      }
    };
  }

  getAllTools(): Record<string, ToolConfig> {
    return {
      webSearch: this.getWebSearchTool(),
      getTimestamp: this.getTimestampTool(),
      formatText: this.getFormatTextTool()
    };
  }
}
