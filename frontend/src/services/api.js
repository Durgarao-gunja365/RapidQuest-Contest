import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Set to false to avoid CSRF issues for now
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  // For file uploads, don't set Content-Type - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.error('Authentication required');
    } else if (error.response?.status === 404) {
      console.error('Resource not found');
    } else if (error.response?.status >= 500) {
      console.error('Server error');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const documentsAPI = {
  // Get all documents with optional filters
  getDocuments: (params = {}) => 
    api.get('/documents/documents/', { params }),
  
  // Search documents
  searchDocuments: (query, params = {}) =>
    api.get('/documents/documents/', { 
      params: { search: query, ...params } 
    }),
  
  // Get document by ID
  getDocument: (id) => 
    api.get(`/documents/documents/${id}/`),
  
  // Upload document - fixed to not set Content-Type header
  uploadDocument: (formData) =>
    api.post('/documents/documents/upload/', formData),
  
  // Get recent documents
  getRecentDocuments: () =>
    api.get('/documents/documents/recent/'),
  
  // Get statistics
  getStats: () =>
    api.get('/documents/documents/stats/'),
  
  // Get teams
  getTeams: () =>
    api.get('/documents/teams/'),
  
  // Get projects
  getProjects: () =>
    api.get('/documents/projects/'),
  
  // Get topics
  getTopics: () =>
    api.get('/documents/topics/'),
};

// Update the searchAPI section
export const searchAPI = {
  // Advanced search
  search: (query, filters = {}) => {
    const params = new URLSearchParams({ q: query });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/search/?${params}`);
  },
  
  // Get search suggestions
  getSuggestions: (query) =>
    api.get(`/search/suggestions/?q=${encodeURIComponent(query)}`),
  
  // Get search statistics
  getSearchStats: () =>
    api.get('/search/stats/'),
};

// Test API connection
export const testAPI = async () => {
  try {
    const response = await api.get('/documents/');
    return response.data;
  } catch (error) {
    console.error('API test failed:', error);
    throw error;
  }
};

export default api;