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
      const { twitterId, wallets, sharedPortfolioData } = this.config;
      
      if (!wallets || !this.hasValidWallets(wallets)) {
        return;
      }

      this.postMessage({ type: 'LOG', message: 'Fetching fresh portfolio data...' });

      const allWallets = [
        ...wallets.eth.map(walletAddress => ({ walletAddress, chain: 'eth' })),
        ...wallets.sol.map(walletAddress => ({ walletAddress, chain: 'sol' })),
        ...wallets.btc.map(walletAddress => ({ walletAddress, chain: 'btc' })),
        ...wallets.tron.map(walletAddress => ({ walletAddress, chain: 'tron' })),
        ...wallets.ton.map(walletAddress => ({ walletAddress, chain: 'ton' })),
      ];

      let allTokens = [];
      let aggregatedChainData = {};

      for (const w of allWallets) {
        if (!w.walletAddress || w.walletAddress.trim() === '') continue;

        try {
          // Fetch positions data
          const response = await fetch(`${this.API_BASE}/balances/positions/${w.walletAddress}`);
          if (!response.ok) continue;
          
          const result = await response.json();
          const positionsData = result.data;

          // Use shared portfolio data for chain aggregation
          const portfolioData = sharedPortfolioData?.[w.walletAddress]?.portfolio;
          
          if (portfolioData?.chains && portfolioData?.positionsChainsDistribution) {
            for (const [chainId, chainValue] of Object.entries(portfolioData.positionsChainsDistribution)) {
              const chainInfo = portfolioData.chains[chainId];
              const numericChainValue = Number(chainValue);
              if (chainInfo && numericChainValue > 0) {
                if (!aggregatedChainData[chainId]) {
                  aggregatedChainData[chainId] = {
                    totalValue: 0,
                    assetCount: 0,
                    chainName: chainInfo.name,
                    iconUrl: chainInfo.iconUrl
                  };
                }
                aggregatedChainData[chainId].totalValue += numericChainValue;
              }
            }
          }

          // Process positions
          if (positionsData && Array.isArray(positionsData)) {
            for (const position of positionsData) {
              if (position.isDisplayable && position.value > 0) {
                const asset = position.asset;
                const chain = position.chain;
                
                const decimals = asset.implementations?.[chain.id]?.decimals || 18;
                const balance = parseFloat(position.quantity) / Math.pow(10, decimals);
                
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

                allTokens.push(assetObj);
                
                if (aggregatedChainData[chain.id]) {
                  aggregatedChainData[chain.id].assetCount += 1;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Worker: Error fetching data for wallet ${w.walletAddress}:`, error);
        }
      }

      // Convert chain data to array
      const chainSummariesArray = Object.entries(aggregatedChainData).map(([chainId, data]) => ({
        chain: chainId,
        ...data
      })).sort((a, b) => b.totalValue - a.totalValue);

      // Sort tokens by value
      allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));

      // Fetch sentiment data
      const updatedTokens = await this.fetchSentimentData(allTokens);

      // Send updated data to main thread
      this.postMessage({
        type: 'PORTFOLIO_UPDATE',
        data: {
          assets: updatedTokens,
          chainSummaries: chainSummariesArray,
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
    if (!wallets) return false;
    return (
      wallets.eth.length > 0 ||
      wallets.sol.length > 0 ||
      wallets.btc.length > 0 ||
      wallets.tron.length > 0 ||
      wallets.ton.length > 0
    );
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
