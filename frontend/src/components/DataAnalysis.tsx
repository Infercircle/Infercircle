import React from 'react';
import { FiExternalLink, FiCalendar, FiTrendingUp, FiUsers, FiYoutube, FiTwitter } from 'react-icons/fi';

export interface DataSource {
  title: string;
  content: string;
  url: string;
  date: string;
  source: 'news' | 'twitter' | 'medium' | 'youtube';
}

interface DataAnalysisProps {
  title: string;
  items: DataSource[];
  source: string;
  timestamp: string;
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'twitter':
      return <FiTwitter className="w-4 h-4" />;
    case 'youtube':
      return <FiYoutube className="w-4 h-4" />;
    case 'medium':
      return <FiUsers className="w-4 h-4" />;
    case 'news':
    default:
      return <FiTrendingUp className="w-4 h-4" />;
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'twitter':
      return 'text-blue-400';
    case 'youtube':
      return 'text-red-400';
    case 'medium':
      return 'text-green-400';
    case 'news':
    default:
      return 'text-purple-400';
  }
};

export const DataAnalysis: React.FC<DataAnalysisProps> = ({ 
  title, 
  items = [], 
  timestamp 
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-[#1A1C23] border border-[#2A2D34] rounded-lg p-6">
        <h3 className="text-[#E5E7EB] text-lg font-semibold mb-4">{title}</h3>
        <p className="text-[#6B7280]">No data found for this topic.</p>
      </div>
    );
  }

  const groupedBySource = items.reduce((acc, item) => {
    if (!acc[item.source]) {
      acc[item.source] = [];
    }
    acc[item.source].push(item);
    return acc;
  }, {} as Record<string, DataSource[]>);

  return (
    <div className="bg-[#1A1C23] border border-[#2A2D34] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#2A2D34] pb-4">
        <h3 className="text-[#E5E7EB] text-xl font-bold mb-2">{title}</h3>
        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
          <div className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            <span>Generated at: {new Date(timestamp).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiTrendingUp className="w-4 h-4" />
            <span>Total items: {items.length}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(groupedBySource).map(([sourceType, sourceItems]) => (
          <div key={sourceType} className="bg-[#0F1114] border border-[#2A2D34] rounded-lg p-4">
            <div className={`flex items-center gap-2 mb-2 ${getSourceColor(sourceType)}`}>
              {getSourceIcon(sourceType)}
              <span className="text-sm font-medium capitalize">{sourceType}</span>
            </div>
            <div className="text-2xl font-bold text-[#E5E7EB]">{sourceItems.length}</div>
          </div>
        ))}
      </div>

      {/* Data Sources */}
      <div className="space-y-4">
        <h4 className="text-[#E5E7EB] text-lg font-semibold">Recent Sources</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.slice(0, 10).map((item, index) => (
            <div key={index} className="bg-[#0F1114] border border-[#2A2D34] rounded-lg p-4 hover:border-[#A259FF]/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex items-center gap-1 ${getSourceColor(item.source)}`}>
                      {getSourceIcon(item.source)}
                      <span className="text-xs font-medium capitalize">{item.source}</span>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h5 className="text-[#E5E7EB] font-medium mb-2 line-clamp-2">
                    {item.title}
                  </h5>
                  <p className="text-[#6B7280] text-sm line-clamp-3">
                    {item.content}
                  </p>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 text-[#A259FF] hover:text-[#8B4FD1] transition-colors"
                    title="Open source"
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {items.length > 10 && (
        <div className="text-center py-2 text-[#6B7280] text-sm border-t border-[#2A2D34]">
          Showing 10 of {items.length} total sources
        </div>
      )}
    </div>
  );
};
