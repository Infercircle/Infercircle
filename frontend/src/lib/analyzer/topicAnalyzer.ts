import { ChatOpenAI } from '@langchain/openai';
import { TopicAnalysis } from '../types/agent.types';

export class TopicAnalyzer {
  private model: ChatOpenAI;

  constructor(model: ChatOpenAI) {
    this.model = model;
  }

  async analyzeTopicWithAI(userInput: string): Promise<TopicAnalysis> {
    try {
      const analysisPrompt = `Analyze this user query and determine:
1. What is the main topic/subject they're asking about?
2. Is it related to cryptocurrency/blockchain?
3. What specific cryptocurrency (if any) are they referring to?
4. What type of information are they seeking (price, news, analysis, etc.)?

User query: "${userInput}"

Respond with ONLY a JSON object containing:
- topic: the main subject (e.g., "solana", "bitcoin", "defi", "nft market")
- isCrypto: boolean indicating if it's crypto-related
- cryptoSymbol: the specific crypto symbol if identified (e.g., "SOL", "BTC", "ETH") or null
- intentType: what they want to know ("price", "chart", "news", "analysis", "general")
- confidence: confidence score (0-1)

Examples:
"How is Solana doing?" → {"topic": "solana", "isCrypto": true, "cryptoSymbol": "SOL", "intentType": "general", "confidence": 0.9}
"What's the latest on DeFi?" → {"topic": "defi", "isCrypto": true, "cryptoSymbol": null, "intentType": "news", "confidence": 0.8}
"Show me Bitcoin price" → {"topic": "bitcoin", "isCrypto": true, "cryptoSymbol": "BTC", "intentType": "price", "confidence": 0.95}
"Display chart for contract 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" → {"topic": "token chart", "isCrypto": true, "cryptoSymbol": null, "intentType": "chart", "confidence": 0.95}
"Token price history for EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" → {"topic": "token price", "isCrypto": true, "cryptoSymbol": null, "intentType": "price", "confidence": 0.9}

JSON only:`;

      const analysisResponse = await this.model.invoke([
        { role: 'user', content: analysisPrompt }
      ]);

      const responseContent = typeof analysisResponse.content === 'string' 
        ? analysisResponse.content 
        : analysisResponse.content.toString();

      console.log('Raw analysis response:', responseContent);

      // Extract JSON from the response
      const jsonMatch = responseContent.match(/\{[^}]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }

      // Fallback if JSON parsing fails
      return {
        topic: userInput.toLowerCase(),
        isCrypto: this.containsCryptoKeywords(userInput),
        cryptoSymbol: null,
        intentType: this.containsPriceKeywords(userInput) ? 'price' : 'general',
        confidence: 0.3
      };
    } catch (error) {
      console.error('Error in topic analysis:', error);
      return {
        topic: userInput.toLowerCase(),
        isCrypto: this.containsCryptoKeywords(userInput),
        cryptoSymbol: null,
        intentType: this.containsPriceKeywords(userInput) ? 'price' : 'general',
        confidence: 0.1
      };
    }
  }

  private containsCryptoKeywords(query: string): boolean {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto', 
      'cryptocurrency', 'defi', 'nft', 'blockchain', 'token', 'coin', 
      'contract', 'price', 'chart', 'trading', 'wallet', 'dex', 'swap'
    ];
    const lowerQuery = query.toLowerCase();
    return cryptoKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  private containsPriceKeywords(query: string): boolean {
    const priceKeywords = [
      'price', 'chart', 'graph', 'historical', 'price history', 
      'token price', 'show me', 'display', 'contract'
    ];
    const lowerQuery = query.toLowerCase();
    return priceKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  extractContractAddress(query: string): string | null {
    // Look for Solana contract address pattern (base58, typically 32-44 characters)
    const contractPattern = /[A-Za-z0-9]{32,44}/g;
    const matches = query.match(contractPattern);
    
    if (matches) {
      // Filter out common false positives
      for (const match of matches) {
        // Basic validation - Solana addresses are base58 and typically 32-44 chars
        if (match.length >= 32 && match.length <= 44 && 
            !/[0OIl]/.test(match) && // Base58 doesn't include these chars
            !match.toLowerCase().includes('bitcoin') &&
            !match.toLowerCase().includes('ethereum')) {
          return match;
        }
      }
    }
    
    return null;
  }
}
