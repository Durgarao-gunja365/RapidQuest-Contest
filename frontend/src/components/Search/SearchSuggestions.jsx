import React from 'react';
import { useApp } from '../../contexts/AppContext';

function SearchSuggestions({ onSelectSuggestion }) {
  const { searchSuggestions } = useApp();

  if (!searchSuggestions || searchSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1">
      <div className="py-2">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Suggestions
        </div>
        {searchSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">🔍</span>
              <span className="text-gray-800">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { SearchSuggestions };