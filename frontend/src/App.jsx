import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { DocumentCard } from './components/Documents/DocumentCard';
import { UploadModal } from './components/Upload/UploadModal';
import { Search, Filter, Loader, AlertCircle } from 'lucide-react';

function AppContent() {
  const { 
    filteredDocuments, 
    loading, 
    error, 
    searchQuery,
    searchDocuments,
    clearError 
  } = useApp();

  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleSearch = (query) => {
    searchDocuments(query);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Data will be refreshed via context
  };

  // Auto-refresh documents when filters change
  useEffect(() => {
    if (searchQuery) {
      searchDocuments(searchQuery);
    }
  }, []); // We'll add filter dependencies later

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onSearch={handleSearch}
        onUploadClick={() => setShowUploadModal(true)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Results Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Documents
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredDocuments.length} documents found
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">{error}</span>
                <button
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-primary-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          )}

          {/* Documents Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? 'No documents found matching your search.'
                  : 'Get started by uploading a document.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary"
                >
                  Upload Document
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;