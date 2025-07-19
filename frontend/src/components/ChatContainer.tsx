import React, { useEffect, useRef } from 'react';
import ToolResultRenderer from './ChatMessage';
import { FiTrash2, FiX, FiUser } from 'react-icons/fi';
import { GrRobot } from 'react-icons/gr';
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
  onCancelRequest
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
    <div className="bg-[#0F1114] border border-[#23272b] rounded-2xl">
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
      <div className="overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 p-4 ${message.role === 'assistant' ? 'bg-[#1A1C23]' : 'bg-transparent'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'assistant' ? 'bg-[#A259FF]' : 'bg-[#2A2D34]'
            }`}>
              {message.role === 'assistant' ? (
                <GrRobot className="w-4 h-4 text-white" />
              ) : (
                <FiUser className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {/* Message Text */}
              {message.content && (
                <div className="text-[#E5E7EB] whitespace-pre-wrap mb-3">
                  {message.content}
                </div>
              )}
              
              {/* Tool Results */}
              {message.toolResults && message.toolResults.length > 0 && (
                <div className="space-y-3">
                  {message.toolResults.map((result, index) => (
                    <ToolResultRenderer key={index} result={result} />
                  ))}
                </div>
              )}
              
              {/* Timestamp */}
              <div className="text-xs text-[#6B7280] mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Global Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border-t border-red-500/20 flex-shrink-0">
          <div className="text-red-400 text-sm">
            Connection error: {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
