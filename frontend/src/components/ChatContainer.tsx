import React, { useEffect, useRef } from 'react';
import ToolResultRenderer from './ChatMessage';
import { FiTrash2, FiX } from 'react-icons/fi';
import { AgentMessage } from '@/lib/types/agent';


interface ChatContainerProps {
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  onClearChat: () => void;
  onCancelRequest: () => void;
  className?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isLoading, 
  error, 
  onClearChat, 
  onCancelRequest,
  className = '' 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={`bg-[#0F1114] border border-[#23272b] rounded-2xl ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#23272b]">
        <h3 className="text-white font-medium">Chat History</h3>
        <div className="flex items-center gap-2">
          {isLoading && (
            <button
              onClick={onCancelRequest}
              className="text-[#A3A3A3] hover:text-white transition-colors p-1 rounded"
              title="Cancel request"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClearChat}
            className="text-[#A3A3A3] hover:text-white transition-colors p-1 rounded"
            title="Clear chat"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-lg p-4 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.toolResults && message.toolResults.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm opacity-75 mb-2">Tool Results:</div>
                  {message.toolResults.map((result, index) => (
                    <ToolResultRenderer key={index} result={result} />
                  ))}
                </div>
              )}
              
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Global Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border-t border-red-500/20">
          <div className="text-red-400 text-sm">
            Connection error: {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
