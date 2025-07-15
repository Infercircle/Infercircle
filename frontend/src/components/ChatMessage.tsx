import React from 'react';
import { GrRobot } from 'react-icons/gr';
import { FiUser, FiCopy, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
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

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatContent = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#2A2D34] px-1 py-0.5 rounded text-sm">$1</code>')
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
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(cleanContent) 
                  }}
                />
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