import React from 'react';

export const DefaultComponent: React.FC<{
  title: string;
  message: string;
  timestamp: string;
}> = ({ title, message, timestamp }) => (
  <div className="p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-center">
    <h2 className="text-xl font-bold mb-3">{title}</h2>
    <p className="mb-4 opacity-90">{message}</p>
    <div className="text-xs opacity-75">
      Generated at: {new Date(timestamp).toLocaleString()}
    </div>
  </div>
);