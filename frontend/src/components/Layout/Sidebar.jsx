import React from 'react';
import { useApp } from '../../contexts/AppContext';

export function Sidebar() {
  const { teams, projects, topics, stats, filters, applyFilters } = useApp();

  const handleFilterChange = (filterType, value) => {
    applyFilters({ [filterType]: value });
  };

  const clearFilters = () => {
    applyFilters({
      team: '',
      project: '',
      fileType: '',
      topic: '',
    });
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-6">
        {/* Stats Summary */}
        {stats && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Documents</span>
                <span className="font-medium">{stats.total_documents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Size</span>
                <span className="font-medium">{stats.total_size_mb} MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filters
            </h3>
            
            {/* Team Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                value={filters.team}
                onChange={(e) => handleFilterChange('team', e.target.value)}
                className="input-field"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
                className="input-field"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={filters.fileType}
                onChange={(e) => handleFilterChange('fileType', e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">Word</option>
                <option value="PPTX">PowerPoint</option>
                <option value="XLSX">Excel</option>
                <option value="TXT">Text</option>
                <option value="IMAGE">Image</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full btn-secondary text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}