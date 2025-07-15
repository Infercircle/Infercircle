'use client';

import { useState, useEffect } from 'react';
import { BsArrowUpCircleFill } from 'react-icons/bs';
import { GrRobot } from 'react-icons/gr';
import { FiSearch, FiPaperclip } from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';
import ChatContainer from '@/components/ChatContainer';

const defaultCryptoSuggestions = [
  "What's the current Bitcoin dominance?",
  "Show me trending altcoins",
  "Analyze Ethereum's on-chain metrics",
  "What are the top DeFi protocols?",
  "Show me NFT market trends",
  "Analyze Bitcoin's price action",
  "What's happening with Solana?",
  "Show me crypto market sentiment",
  "Analyze trading volume patterns",
  "What are the latest ICO/IDO projects?"
];

function highlightMatch(suggestion: string, input: string) {
  if (!input) return suggestion;
  const safeInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeInput})`, 'ig');
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: suggestion.replace(
          regex,
          '<span class="font-bold text-[#A3A3A3]">$1</span>'
        ),
      }}
    />
  );
}

export default function InferAIPage() {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState<string[]>(defaultCryptoSuggestions);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>(defaultCryptoSuggestions);
  
  const { messages, isLoading, sendMessage } = useChat();

  // Fetch suggestions from backend API on mount
  useEffect(() => {
    console.log('Fetching suggestions from backend API...');
    
    fetch('http://localhost:8080/suggestions')
      .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('API Response:', data);
        
        let combinedQuestions = [...defaultCryptoSuggestions];
        console.log('Starting with default suggestions:', combinedQuestions);
        
        if (data && Array.isArray(data.data)) {
          const apiQuestions = data.data.map((item: any) => item.rawQuestion).filter(Boolean);
          console.log('Extracted API questions:', apiQuestions);
          
          combinedQuestions = [...combinedQuestions, ...apiQuestions];
          console.log('Combined questions (with API):', combinedQuestions);
          
        } else if (data.fallback) {
          console.log('Using fallback suggestions');
          combinedQuestions = [...combinedQuestions, ...data.fallback];
        }
        
        const uniqueQuestions = [...new Set(combinedQuestions)];
        console.log('Final unique questions:', uniqueQuestions);
        
        setAllSuggestions(uniqueQuestions);
        setFilteredSuggestions(uniqueQuestions);
      })
      .catch((error) => {
        console.error('Error fetching suggestions:', error);
        console.log('Using default suggestions only');
        setAllSuggestions(defaultCryptoSuggestions);
        setFilteredSuggestions(defaultCryptoSuggestions);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    if (value.trim()) {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(allSuggestions);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      const message = input.trim();
      setInput('');
      setShowSuggestions(false);
      
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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span>InferAI</span>
            <GrRobot className="w-9 h-9 text-[#A259FF]" />
          </h1>
          <p className="text-[#A3A3A3] text-lg">Your AI-powered Crypto Analysis Assistant</p>
        </div>

        {/* Chat Container */}
        {messages.length > 0 && (
          <div className="mb-6">
            <ChatContainer />
          </div>
        )}

        {/* Input Section */}
        <div className="relative">
          <div className="bg-[#181A20] border border-[#23272b] rounded-2xl shadow-lg px-6 pt-2 pb-8 min-h-[60px] relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(input.trim().length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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

          {/* Suggestions */}
          {showSuggestions && input.trim().length > 0 && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#181A20] rounded-xl border border-[#23272b] shadow-lg z-10 max-h-64 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-[#23272b] transition-colors duration-150 border-b border-[#23272b] last:border-b-0 text-white cursor-pointer flex items-center gap-2"
                >
                  <FiSearch className="w-4 h-4 text-[#A3A3A3] flex-shrink-0" />
                  {highlightMatch(suggestion, input)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}