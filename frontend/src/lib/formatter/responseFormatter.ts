import { DataSource } from '../types/agent.types';

export class ResponseFormatter {
  formatResponseWithCitations(response: string, sources: DataSource[]): string {
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
    
    // Remove duplicate source citations, keeping only the final formatted sources section
    enhancedResponse = this.cleanupDuplicateSourceCitations(enhancedResponse);
    
    return enhancedResponse;
  }

  cleanupDuplicateSourceCitations(response: string): string {
    let cleanedResponse = response;
    
    // Remove inline citations like "cryptocoin.news1", "cryptocoin.news2", etc.
    cleanedResponse = cleanedResponse.replace(/\b\w+\.\w+\d+\b/g, '');
    
    // Remove parenthetical citations like "(cryptocoin.news1)"
    cleanedResponse = cleanedResponse.replace(/\(\w+\.\w+\d+\)/g, '');
    
    // Remove superscript-style numbers after domain names
    cleanedResponse = cleanedResponse.replace(/\b(cryptocoin\.news|[a-zA-Z]+\.[a-zA-Z]+)\d+/g, '$1');
    
    // Split by "Sources:" to find all sections
    const parts = cleanedResponse.split('Sources:');
    
    if (parts.length > 2) {
      // Keep only the main content and the last Sources section
      const mainContent = parts[0].trim();
      const lastSourcesSection = parts[parts.length - 1].trim();
      cleanedResponse = mainContent + '\n\nSources:\n' + lastSourcesSection;
    }
    
    // Remove the numbered list that appears before the final Sources section
    // This removes patterns like "9. Title - domain" or "10. Title - domain"
    cleanedResponse = cleanedResponse.replace(/\d+\.\s*[^\n]+\s*-\s*[^\n]+\n/g, '');
    
    // Remove lines that only contain numbers (like standalone "9", "10", etc.)
    cleanedResponse = cleanedResponse.replace(/^\d+\s*$/gm, '');
    
    // Clean up extra spaces and line breaks
    cleanedResponse = cleanedResponse.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n');
    
    return cleanedResponse.trim();
  }

  formatDataSources(data: DataSource[], topic: string): string {
    if (data.length === 0) {
      return `\n\n[Searched for recent data about "${topic}" but no current information was found from external sources]`;
    }

    const formattedSources = data.slice(0, 8).map((item, index) => {
      const sourceInfo = `[${index + 1}] ${item.title} (${item.source.toUpperCase()}, ${new Date(item.date).toDateString()})`;
      return `${sourceInfo}\n   Content: ${item.content?.substring(0, 180)}...\n   URL: ${item.url}`;
    }).join('\n\n');
    
    return `\n\nRECENT DATA SOURCES for "${topic}" (${data.length} sources found):\n\n${formattedSources}`;
  }
}
