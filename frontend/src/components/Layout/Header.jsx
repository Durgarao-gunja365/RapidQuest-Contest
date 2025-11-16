import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SearchSuggestions } from '../Search/SearchSuggestions';

function Header({ onSearch, onUploadClick }) {
  const { getSearchSuggestions, searchSuggestions } = useApp();
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (value.length >= 2) {
      getSearchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchValue(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchValue('');
    setShowSuggestions(false);
    onSearch('');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Search
              </h1>
            </div>
          </div>

          {/* Advanced Search Bar */}
          <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search documents, content, files..."
                />
                {searchValue && (
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1 mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Search Suggestions */}
                {showSuggestions && (
                  <SearchSuggestions onSelectSuggestion={handleSelectSuggestion} />
                )}
              </div>
            </form>
          </div>

          {/* Upload Button */}
          <div>
            <button
              onClick={onUploadClick}
              className="btn-primary flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Use named export for React Fast Refresh compatibility
export { Header };