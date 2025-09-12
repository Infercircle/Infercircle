class PortfolioWorker {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
    this.API_BASE = 'http://localhost:8080';
  }

  startBackgroundSync(config) {
    if (this.isRunning) {
      this.postMessage({ type: 'LOG', message: 'Background sync already running' });
      return;
    }

    this.isRunning = true;
    this.config = config;
    this.API_BASE = config.apiBase || 'http://localhost:8080';
    
    this.postMessage({ type: 'LOG', message: 'Starting background portfolio sync...' });
    
    // Start periodic fetching every 2 minutes
    const intervalId = setInterval(() => {
      this.fetchAndUpdatePortfolioData();
    }, 2 * 60 * 1000); // 2 minutes
    
    this.intervals.set('portfolio', intervalId);
    
    // Initial fetch after 30 seconds
    setTimeout(() => {
      this.fetchAndUpdatePortfolioData();
    }, 30000);
  }

  stopBackgroundSync() {
    this.isRunning = false;
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.postMessage({ type: 'LOG', message: 'Background sync stopped' });
  }

  async fetchAndUpdatePortfolioData() {
    try {
      const { wallets } = this.config;
      
      if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
        return;
      }

      this.postMessage({ type: 'LOG', message: 'Fetching fresh portfolio data...' });

      // Simple approach - just fetch positions for each wallet
      let allTokens = [];
      const processedAssets = new Map(); // To avoid duplicates

      for (const walletAddress of wallets) {
        if (!walletAddress || walletAddress.trim() === '') continue;

        try {
          // Fetch positions data
          const response = await fetch(`${this.API_BASE}/balances/positions/${walletAddress}`);
          if (!response.ok) continue;
          
          const result = await response.json();
          const positionsData = result.data;

          // Process positions
          if (positionsData && Array.isArray(positionsData)) {
            for (const position of positionsData) {
              if (position.isDisplayable && position.value > 0) {
                const asset = position.asset;
                const chain = position.chain;
                
                const decimals = asset.implementations?.[chain.id]?.decimals || 18;
                const balance = parseFloat(position.quantity) / Math.pow(10, decimals);
                
                const assetKey = `${asset.symbol}_${chain.name}`;
                
                if (processedAssets.has(assetKey)) {
                  // Aggregate if same asset on same chain
                  const existing = processedAssets.get(assetKey);
                  existing.balance += balance;
                  existing.value += (position.value || 0);
                } else {
                  const assetObj = {
                    name: asset.name,
                    symbol: asset.symbol,
                    chain: chain.name,
                    price: asset.price?.value || 0,
                    balance: balance,
                    value: position.value || 0,
                    priceChange: asset.price?.relativeChange24h || 0,
                    sentimentChange: undefined,
                    sentiment: undefined,
                    mindShare: undefined,
                    icon: asset.iconUrl || '',
                    id: asset.name,
                  };
                  
                  processedAssets.set(assetKey, assetObj);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Worker: Error fetching data for wallet ${walletAddress}:`, error);
        }
      }

      // Convert to array and sort
      allTokens = Array.from(processedAssets.values());
      allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
      // Fetch sentiment data and send update
      const updatedTokens = await this.fetchSentimentData(allTokens);

      // Send updated data to main thread for cache update
      this.postMessage({
        type: 'PORTFOLIO_UPDATE',
        data: {
          assets: updatedTokens,
          chainSummaries: [], // Keep simple for now
          timestamp: Date.now()
        }
      });

      this.postMessage({ type: 'LOG', message: `Updated ${updatedTokens.length} assets` });

    } catch (error) {
      this.postMessage({ 
        type: 'ERROR', 
        error: `Portfolio fetch error: ${error.message}` 
      });
    }
  }

  async fetchSentimentData(tokens) {
    try {
      const response = await fetch('/api/sentiments');
      if (!response.ok) return tokens;

      const data = await response.json();
      const assetSentiMentScoreList = data.arrayMap;

      const updatedTokens = tokens.map(token => {
        const updatedToken = { ...token };
        
        if (assetSentiMentScoreList && assetSentiMentScoreList[token.symbol.toLowerCase()]) {
          const allAssets = assetSentiMentScoreList[token.symbol.toLowerCase()];
          
          for (const asset of allAssets) {
            if (asset.name.toLowerCase() === token.name.toLowerCase()) {
              const sentimentIndex = (asset.positiveTweets - asset.negativeTweets) / 
                                   (asset.positiveTweets + asset.neutralTweets + asset.negativeTweets);
              
              if (!updatedToken.icon || updatedToken.icon === '') {
                updatedToken.icon = asset.image || "";
              }
              updatedToken.sentiment = parseFloat(asset.sentiment);
              updatedToken.mindShare = parseFloat(((sentimentIndex * 50) + 50).toFixed(2));
              updatedToken.id = asset.id;
              break;
            }
          }
        }
        
        return updatedToken;
      });

      return updatedTokens;
    } catch (error) {
      console.error('Worker: Error fetching sentiment data:', error);
      return tokens;
    }
  }

  hasValidWallets(wallets) {
    return Array.isArray(wallets) && wallets.length > 0;
  }

  postMessage(message) {
    self.postMessage(message);
  }
}

// Web Worker message handler
self.onmessage = function(e) {
  if (!self.portfolioWorker) {
    self.portfolioWorker = new PortfolioWorker();
  }

  const { type, data } = e.data;

  switch (type) {
    case 'START_SYNC':
      self.portfolioWorker.startBackgroundSync(data);
      break;
    case 'STOP_SYNC':
      self.portfolioWorker.stopBackgroundSync();
      break;
    case 'UPDATE_CONFIG':
      self.portfolioWorker.config = { ...self.portfolioWorker.config, ...data };
      break;
    default:
      console.log('Worker: Unknown message type:', type);
  }
};
