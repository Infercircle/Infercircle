import React, { useState } from 'react';
import { GrRobot } from 'react-icons/gr';
import { FiUser, FiCopy, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { Message } from '../hooks/useChat';
// import PriceChart from './PriceChart';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

interface ChartData {
  symbol: string;
  priceData: Array<{
    date: string;
    price: number;
    volume: number;
  }>;
}

interface Source {
  url: string;
  title: string;
  domain: string;
}

interface SourceButtonProps {
  source: Source;
  number: number;
}

const SourceButton: React.FC<SourceButtonProps> = ({ source, number }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleClick = () => {
    window.open(source.url, '_blank', 'noopener,noreferrer');
  };

  const truncateUrl = (url: string, domain: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return `${domain}...`;
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center justify-center w-5 h-5 bg-[#A259FF] hover:bg-[#8B4DFF] text-white text-xs rounded-full transition-colors cursor-pointer ml-1"
        title={`Source: ${source.domain}`}
      >
        {number}
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-[#2A2D34] border border-[#3A3D44] rounded-lg p-3 shadow-xl min-w-[200px] max-w-[320px] backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <FiExternalLink className="w-3 h-3 text-[#A259FF] flex-shrink-0" />
              <span className="text-white text-sm font-medium truncate">{source.title}</span>
            </div>
            <div className="text-[#A3A3A3] text-xs break-all">
              {truncateUrl(source.url, source.domain, 50)}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#3A3D44]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const extractSourcesAndFormatContent = (content: string) => {
    const sources: Source[] = [];
    let sourceCounter = 1;
    
    // Extract markdown links and replace with numbered references
    let formattedContent = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        sources.push({
          url,
          title: text,
          domain
        });
        return `${text}[${sourceCounter++}]`;
      } catch {
        // If URL parsing fails, keep the original link
        return match;
      }
    });
    
    // Extract direct URLs that aren't in markdown format
    formattedContent = formattedContent.replace(/(https?:\/\/[^\s<]+)/g, (match, url) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        sources.push({
          url,
          title: domain,
          domain
        });
        return `${domain}[${sourceCounter++}]`;
      } catch {
        // If URL parsing fails, keep the original URL
        return match;
      }
    });
    
    // Apply other formatting
    formattedContent = formattedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#2A2D34] px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
    
    return { formattedContent, sources };
  };

  const formatContent = (content: string) => {
    // Basic markdown-like formatting with clickable links
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#2A2D34] px-1 py-0.5 rounded text-sm">$1</code>')
      // Handle markdown links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#A259FF] hover:text-[#8B4DFF] underline transition-colors">$1</a>')
      // Handle direct URLs that aren't already in markdown format
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#A259FF] hover:text-[#8B4DFF] underline transition-colors">$1</a>')
      .replace(/\n/g, '<br>');
  };

  // Check if message contains chart data
  const extractChartData = (content: string): ChartData | null => {
    try {
      // Look for JSON-like chart data in the message
      const chartMatch = content.match(/\{[\s\S]*?"symbol"[\s\S]*?"priceData"[\s\S]*?\}/);
      if (chartMatch) {
        return JSON.parse(chartMatch[0]);
      }
      return null;
    } catch {
      return null;
    }
  };

  const chartData = message.sender === 'ai' ? extractChartData(message.content) : null;
  const cleanContent = chartData ? 
    message.content.replace(/\{[\s\S]*?"symbol"[\s\S]*?"priceData"[\s\S]*?\}/, '').trim() : 
    message.content;

  // Extract sources and format content for AI messages
  const { formattedContent, sources } = message.sender === 'ai' ? 
    extractSourcesAndFormatContent(cleanContent) : 
    { formattedContent: formatContent(cleanContent), sources: [] };

  const renderContentWithSources = () => {
    if (!formattedContent) return null;
    
    // Split content by source references [1], [2], etc.
    const parts = formattedContent.split(/(\[\d+\])/);
    
    return parts.map((part, index) => {
      const sourceMatch = part.match(/\[(\d+)\]/);
      if (sourceMatch) {
        const sourceNumber = parseInt(sourceMatch[1]);
        const source = sources[sourceNumber - 1];
        if (source) {
          return <SourceButton key={index} source={source} number={sourceNumber} />;
        }
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  return (
    <div className={`flex gap-3 p-4 ${message.sender === 'ai' ? 'bg-[#1A1C23]' : 'bg-transparent'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        message.sender === 'ai' ? 'bg-[#A259FF]' : 'bg-[#2A2D34]'
      }`}>
        {message.sender === 'ai' ? (
          <GrRobot className="w-4 h-4 text-white" />
        ) : (
          <FiUser className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white text-sm">
            {message.sender === 'ai' ? 'InferAI' : 'You'}
          </span>
          <span className="text-xs text-[#A3A3A3]">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {message.isLoading ? (
          <div className="flex items-center gap-2 text-[#A3A3A3]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#A259FF]"></div>
            <span>Analyzing and fetching data...</span>
          </div>
        ) : message.error ? (
          <div className="text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <span>Error: {message.error}</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-[#A259FF] hover:text-[#8B4DFF] transition-colors"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Text Content */}
            {cleanContent && (
              <div className="text-white text-sm leading-relaxed">
                {message.sender === 'ai' ? (
                  <div>{renderContentWithSources()}</div>
                ) : (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formatContent(cleanContent) 
                    }}
                  />
                )}
              </div>
            )}

            {/* Sources Summary for AI messages */}
            {message.sender === 'ai' && sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#3A3D44]">
                <div className="text-[#A3A3A3] text-xs mb-2">Sources:</div>
                <div className="space-y-1">
                  {sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="text-[#A259FF] font-medium">{index + 1}.</span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A3A3A3] hover:text-white transition-colors truncate flex-1"
                        title={source.url}
                      >
                        {source.title} - {source.domain}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart Component */}
            {/* {chartData && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiTrendingUp className="w-4 h-4 text-[#A259FF]" />
                  <span className="text-white text-sm font-medium">
                    {chartData.symbol} Price Chart
                  </span>
                </div>
                <PriceChart data={chartData.priceData} symbol={chartData.symbol} />
              </div>
            )} */}
          </div>
        )}

        {/* Message Actions */}
        {!message.isLoading && !message.error && message.content && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => copyToClipboard(message.content)}
              className="text-[#A3A3A3] hover:text-white transition-colors p-1 rounded"
              title="Copy message"
            >
              <FiCopy className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;