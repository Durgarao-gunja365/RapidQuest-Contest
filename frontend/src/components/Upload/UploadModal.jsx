import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Upload, FileText } from 'lucide-react';

function UploadModal({ onClose, onSuccess }) {
  const { teams, projects, topics, uploadDocument } = useApp();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    team: '',
    project: '',
    topics: [],
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Auto-fill title from filename if not set
    if (!formData.title && file) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, title: fileNameWithoutExt }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      
      if (formData.team) {
        uploadFormData.append('team', formData.team);
      }
      if (formData.project) {
        uploadFormData.append('project', formData.project);
      }

      await uploadDocument(uploadFormData);
      onSuccess();
      
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Upload failed. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <FileText className="h-8 w-8" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to select a file
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel, PowerPoint, Text, Images
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Enter document title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Enter document description"
            />
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team
            </label>
            <select
              name="team"
              value={formData.team}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              name="project"
              value={formData.project}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Select Project</option>
              {projects
                .filter(project => !formData.team || project.team == formData.team)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { UploadModal };