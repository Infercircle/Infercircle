import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

export const useWebWorkers = () => {
  const portfolioWorkerRef = useRef<Worker | null>(null);
  const sentimentWorkerRef = useRef<Worker | null>(null);
  const isInitializedRef = useRef(false);

  const {
    setNetWorth,
    setWallets,
    setSharedPortfolioData,
    setCuratedTweets,
    selectedAsset,
    allElites
  } = useDashboardStore();

  // Initialize Web Workers
  const initializeWorkers = useCallback(() => {
    if (isInitializedRef.current || typeof window === 'undefined') return;

    try {
      // Initialize Portfolio Worker
      portfolioWorkerRef.current = new Worker('/workers/portfolioWorker.js');
      
      portfolioWorkerRef.current.onmessage = (e) => {
        const { type, data, error } = e.data;
        
        switch (type) {
          case 'PORTFOLIO_UPDATE':
            console.log('🔄 Portfolio updated via Web Worker');
            
            // Store the updated assets data for any component that needs it
            sessionStorage.setItem('portfolio_worker_cache', JSON.stringify({
              assets: data.assets,
              timestamp: Date.now()
            }));
            
            // Trigger event for components to update their data
            window.dispatchEvent(new CustomEvent('portfolio-price-updated', { 
              detail: { assets: data.assets }
            }));
            break;
            
          case 'ERROR':
            console.error('Portfolio Worker Error:', error);
            break;
            
          case 'LOG':
            console.log('Portfolio Worker:', data || error);
            break;
        }
      };

      portfolioWorkerRef.current.onerror = (error) => {
        console.error('Portfolio Worker Error:', error);
      };

      // Initialize Sentiment Worker
      sentimentWorkerRef.current = new Worker('/workers/sentimentWorker.js');
      
      sentimentWorkerRef.current.onmessage = (e) => {
        const { type, data, error } = e.data;
        
        switch (type) {
          case 'TWEETS_UPDATE':
            console.log('🔄 Tweets updated via Web Worker');
            
            // Update session storage with asset-specific cache key
            sessionStorage.setItem(`tweets_${data.assetKey}`, JSON.stringify({
              tweets: data.tweets,
              timestamp: data.timestamp
            }));
            
            // Notify components about the update via custom event
            window.dispatchEvent(new CustomEvent('tweets-updated', { 
              detail: { assetKey: data.assetKey, tweets: data.tweets }
            }));
            break;
            
          case 'CURATED_TWEETS_UPDATE':
            console.log('🔄 Curated tweets updated via Web Worker');
            setCuratedTweets(data.tweets);
            
            // Update session storage
            sessionStorage.setItem('curated_tweets_cache', JSON.stringify({
              tweets: data.tweets,
              timestamp: data.timestamp
            }));
            break;
            
          case 'ERROR':
            console.error('Sentiment Worker Error:', error);
            break;
            
          case 'LOG':
            console.log('Sentiment Worker:', data || error);
            break;
        }
      };

      sentimentWorkerRef.current.onerror = (error) => {
        console.error('Sentiment Worker Error:', error);
      };

      isInitializedRef.current = true;
      console.log('✅ Web Workers initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Web Workers:', error);
    }
  }, [setNetWorth, setWallets, setSharedPortfolioData, setCuratedTweets]);

  // Start portfolio background sync
  const startPortfolioSync = useCallback((wallets: string[]) => {
    if (!portfolioWorkerRef.current || !wallets.length) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
    
    portfolioWorkerRef.current.postMessage({
      type: 'START_SYNC',
      data: { 
        wallets,
        apiBase: API_BASE
      }
    });
  }, []);

  // Start sentiment background sync
  const startSentimentSync = useCallback((config: { selectedAsset?: any; allElites?: string[] }) => {
    if (!sentimentWorkerRef.current) return;

    sentimentWorkerRef.current.postMessage({
      type: 'START_SYNC',
      data: config
    });
  }, []);

  // Stop all background sync
  const stopAllSync = useCallback(() => {
    if (portfolioWorkerRef.current) {
      portfolioWorkerRef.current.postMessage({ type: 'STOP_SYNC' });
    }
    if (sentimentWorkerRef.current) {
      sentimentWorkerRef.current.postMessage({ type: 'STOP_SYNC' });
    }
  }, []);

  // Update sentiment worker config when selectedAsset changes
  const updateSentimentConfig = useCallback((config: { selectedAsset?: any; allElites?: string[] }) => {
    if (!sentimentWorkerRef.current) return;

    sentimentWorkerRef.current.postMessage({
      type: 'UPDATE_CONFIG',
      data: config
    });
  }, []);

  // Initialize workers on mount
  useEffect(() => {
    initializeWorkers();

    return () => {
      // Cleanup workers on unmount
      if (portfolioWorkerRef.current) {
        portfolioWorkerRef.current.terminate();
      }
      if (sentimentWorkerRef.current) {
        sentimentWorkerRef.current.terminate();
      }
      isInitializedRef.current = false;
    };
  }, [initializeWorkers]);

  // Auto-start portfolio sync when wallets are available
  useEffect(() => {
    // For now, we'll need wallet addresses to be passed in when using this hook
    // This will be handled by the dashboard components
  }, []);

  // Auto-start sentiment sync when selectedAsset or allElites changes
  useEffect(() => {
    if (isInitializedRef.current) {
      const config = {
        selectedAsset,
        allElites: Array.from(allElites) // Convert Set to Array
      };
      
      if (selectedAsset || (allElites && allElites.size > 0)) {
        startSentimentSync(config);
      } else {
        // Update config even if no asset selected (for curated tweets)
        updateSentimentConfig(config);
      }
    }
  }, [selectedAsset, allElites, startSentimentSync, updateSentimentConfig]);

  return {
    startPortfolioSync,
    startSentimentSync,
    stopAllSync,
    updateSentimentConfig,
    isInitialized: isInitializedRef.current
  };
};

// Helper hook for checking if data needs refresh
export const useDataFreshness = (cacheKey: string, maxAge: number = 5 * 60 * 1000) => {
  const checkFreshness = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return false;
      
      const { timestamp } = JSON.parse(cached);
      return (Date.now() - timestamp) < maxAge;
    } catch {
      return false;
    }
  }, [cacheKey, maxAge]);

  const getCachedData = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      return { data, timestamp, isFresh: (Date.now() - timestamp) < maxAge };
    } catch {
      return null;
    }
  }, [cacheKey, maxAge]);

  return { checkFreshness, getCachedData };
};
