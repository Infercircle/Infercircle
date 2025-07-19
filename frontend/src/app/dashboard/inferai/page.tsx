'use client';

import { useState } from 'react';
import { BsArrowUpCircleFill } from 'react-icons/bs';
import { GrRobot } from 'react-icons/gr';
import { FiPaperclip } from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';
import ChatContainer from '@/components/ChatContainer';

export default function InferAIPage() {
  const [input, setInput] = useState('');
  // const [allSuggestions, setAllSuggestions] = useState<string[]>(defaultCryptoSuggestions);
  
  const { messages, isLoading, error, sendMessage, clearChat, cancelRequest } = useChat();

  console.log('Messages in page:', messages);
  console.log('Messages length:', messages.length);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
  };

  // const handleSuggestionClick = (suggestion: string) => {
  //   setInput(suggestion);
  //   setShowSuggestions(false);
  // };

  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      const message = input.trim();
      setInput('');
      // setShowSuggestions(false);
      
      await sendMessage(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col p-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span>InferAI</span>
            <GrRobot className="w-9 h-9 text-[#A259FF]" />
          </h1>
          <p className="text-[#A3A3A3] text-lg">Your AI-powered Crypto Analysis Assistant</p>
        </div>

        {/* Chat Container */}
        {messages.length > 0 ? (
          <div className="flex-1 mb-6 min-h-0">
            <ChatContainer 
              messages={messages}
              isLoading={isLoading}
              error={error}
              onClearChat={clearChat}
              onCancelRequest={cancelRequest}
              className="h-full"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center mb-6">
            <div className="text-center">
              <GrRobot className="w-16 h-16 text-[#A259FF] mx-auto mb-4 opacity-50" />
              <p className="text-[#6B7280] text-lg">Start a conversation to see your chat history</p>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="relative flex-shrink-0">
          <div className="bg-[#181A20] border border-[#23272b] rounded-2xl shadow-lg px-6 pt-2 pb-8 min-h-[60px] relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about crypto markets, trends, or analysis..."
              className="w-full bg-transparent outline-none text-white placeholder-[#A3A3A3] text-base resize-none border-none pt-4 pb-12 px-1"
              style={{ 
                boxShadow: 'none', 
                border: 'none',
                minHeight: '60px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}
              rows={1}
              disabled={isLoading}
            />
            
            {/* Send button */}
            <div className="absolute bottom-2 right-2 flex items-center gap-0">
              <button
                type="button"
                className="p-2 bg-transparent rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200"
                tabIndex={-1}
              >
                <FiPaperclip className="w-4 h-4 text-[#A3A3A3]" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-transparent disabled:bg-transparent disabled:cursor-not-allowed rounded-full transition-colors duration-200 flex items-center justify-center shadow-lg group cursor-pointer"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#A259FF]"></div>
                ) : (
                  <BsArrowUpCircleFill className={`w-7 h-7 transition-colors duration-200 ${
                    !input.trim() ? 'text-[#46484d]' : 'text-[#A259FF] group-hover:text-[#8B4DFF]'
                  }`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
