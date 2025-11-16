import React from 'react';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';

const fileTypeIcons = {
  PDF: '📄',
  DOCX: '📝',
  PPTX: '📊',
  XLSX: '📈',
  TXT: '📄',
  IMAGE: '🖼️',
  OTHER: '📎',
};

export function DocumentCard({ document }) {
  const handlePreview = () => {
    // Open document in new tab for preview
    window.open(document.file_url, '_blank');
  };

  const handleDownload = () => {
    // Trigger download
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name || document.title;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">
            {fileTypeIcons[document.file_type] || fileTypeIcons.OTHER}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {document.title}
            </h3>
            <p className="text-sm text-gray-500">
              {document.file_name} • {formatFileSize(document.file_size)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePreview}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {document.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {document.description}
        </p>
      )}

      {/* Metadata */}
      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{document.uploaded_by_name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(document.uploaded_at)}</span>
          </div>
        </div>

        {/* Teams and Projects */}
        <div className="flex flex-wrap gap-2">
          {document.team_name && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {document.team_name}
            </span>
          )}
          {document.project_name && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {document.project_name}
            </span>
          )}
        </div>

        {/* Topics */}
        {document.topics_list && document.topics_list.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.topics_list.slice(0, 3).map((topic) => (
              <span
                key={topic.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {topic.name}
              </span>
            ))}
            {document.topics_list.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{document.topics_list.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status Badge */}
      {document.status !== 'PROCESSED' && (
        <div className="mt-3">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              document.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {document.status === 'PENDING' ? 'Processing...' : 'Processing Failed'}
          </span>
        </div>
      )}
    </div>
  );
}