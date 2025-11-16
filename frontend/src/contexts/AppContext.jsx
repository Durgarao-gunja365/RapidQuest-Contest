import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { documentsAPI, searchAPI } from '../services/api';

// Create context outside the component to avoid recreation on hot reload
const AppContext = createContext();

const initialState = {
  documents: [],
  filteredDocuments: [],
  teams: [],
  projects: [],
  topics: [],
  stats: null,
  searchStats: null,
  searchSuggestions: [],
  loading: false,
  searchQuery: '',
  filters: {
    team: '',
    project: '',
    fileType: '',
    topic: '',
  },
  uploadProgress: 0,
  error: null,
  apiConnected: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_DOCUMENTS':
      return { 
        ...state, 
        documents: action.payload,
        filteredDocuments: action.payload,
        loading: false 
      };
    
    case 'SET_FILTERED_DOCUMENTS':
      return { ...state, filteredDocuments: action.payload };
    
    case 'SET_TEAMS':
      return { ...state, teams: action.payload };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    
    case 'SET_TOPICS':
      return { ...state, topics: action.payload };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_SEARCH_STATS':
      return { ...state, searchStats: action.payload };
    
    case 'SET_SEARCH_SUGGESTIONS':
      return { ...state, searchSuggestions: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_FILTER':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload } 
      };
    
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'ADD_DOCUMENT':
      return { 
        ...state, 
        documents: [action.payload, ...state.documents],
        filteredDocuments: [action.payload, ...state.filteredDocuments]
      };
    
    case 'SET_API_CONNECTED':
      return { ...state, apiConnected: action.payload };
    
    default:
      return state;
  }
}

// Export the provider as a named component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Test API connection first
  useEffect(() => {
    testAPIConnection();
  }, []);

  const testAPIConnection = async () => {
    try {
      // Test basic API connection
      await documentsAPI.getTeams();
      dispatch({ type: 'SET_API_CONNECTED', payload: true });
      loadInitialData();
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Cannot connect to server. Make sure the Django backend is running on http://localhost:8000' 
      });
      dispatch({ type: 'SET_API_CONNECTED', payload: false });
    }
  };

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [documentsRes, teamsRes, projectsRes, topicsRes, statsRes, searchStatsRes] = await Promise.all([
        documentsAPI.getDocuments().catch(() => ({ data: [] })),
        documentsAPI.getTeams().catch(() => ({ data: [] })),
        documentsAPI.getProjects().catch(() => ({ data: [] })),
        documentsAPI.getTopics().catch(() => ({ data: [] })),
        documentsAPI.getStats().catch(() => ({ data: null })),
        searchAPI.getSearchStats().catch(() => ({ data: null })),
      ]);

      dispatch({ type: 'SET_DOCUMENTS', payload: documentsRes.data.results || documentsRes.data || [] });
      dispatch({ type: 'SET_TEAMS', payload: teamsRes.data.results || teamsRes.data || [] });
      dispatch({ type: 'SET_PROJECTS', payload: projectsRes.data.results || projectsRes.data || [] });
      dispatch({ type: 'SET_TOPICS', payload: topicsRes.data.results || topicsRes.data || [] });
      dispatch({ type: 'SET_STATS', payload: statsRes.data });
      dispatch({ type: 'SET_SEARCH_STATS', payload: searchStatsRes.data });
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load data from server' 
      });
    }
  };

  const getSearchSuggestions = async (query) => {
    if (query.length < 2) {
      dispatch({ type: 'SET_SEARCH_SUGGESTIONS', payload: [] });
      return;
    }
    
    try {
      const response = await searchAPI.getSuggestions(query);
      dispatch({ 
        type: 'SET_SEARCH_SUGGESTIONS', 
        payload: response.data.suggestions 
      });
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
    }
  };

  const getSearchStats = async () => {
    try {
      const response = await searchAPI.getSearchStats();
      dispatch({ 
        type: 'SET_SEARCH_STATS', 
        payload: response.data 
      });
    } catch (error) {
      console.error('Failed to get search stats:', error);
    }
  };

  const advancedSearch = async (query, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
      
      const response = await searchAPI.search(query, filters);
      dispatch({ 
        type: 'SET_FILTERED_DOCUMENTS', 
        payload: response.data.results 
      });
      
    } catch (error) {
      console.error('Advanced search failed:', error);
      
      // Fallback to basic search if advanced search fails
      try {
        console.log('Falling back to basic search...');
        await basicSearch(query, filters);
      } catch (fallbackError) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Search is temporarily unavailable. Please try again.' 
        });
      }
    }
  };

  const basicSearch = async (query, filters = {}) => {
    try {
      const response = await documentsAPI.searchDocuments(query, filters);
      dispatch({ 
        type: 'SET_FILTERED_DOCUMENTS', 
        payload: response.data.results || response.data || [] 
      });
    } catch (error) {
      // If even basic search fails, show all documents
      console.error('Basic search also failed, showing all documents');
      dispatch({ 
        type: 'SET_FILTERED_DOCUMENTS', 
        payload: state.documents 
      });
    }
  };

  const applyFilters = (filters) => {
    dispatch({ type: 'SET_FILTER', payload: filters });
    
    // Apply filters to current search
    if (state.searchQuery) {
      if (state.apiConnected) {
        advancedSearch(state.searchQuery, { ...state.filters, ...filters });
      } else {
        filterDocumentsLocally({ ...state.filters, ...filters }, state.searchQuery);
      }
    } else {
      // If no search query, filter all documents locally
      filterDocumentsLocally({ ...state.filters, ...filters }, '');
    }
  };

  const filterDocumentsLocally = (filters, searchQuery) => {
    let filtered = state.documents;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.team) {
      filtered = filtered.filter(doc => doc.team?.id?.toString() === filters.team);
    }
    if (filters.project) {
      filtered = filtered.filter(doc => doc.project?.id?.toString() === filters.project);
    }
    if (filters.fileType) {
      filtered = filtered.filter(doc => doc.file_type === filters.fileType);
    }
    if (filters.topic) {
      filtered = filtered.filter(doc => 
        doc.topics_list?.some(topic => topic.id.toString() === filters.topic)
      );
    }

    dispatch({ type: 'SET_FILTERED_DOCUMENTS', payload: filtered });
  };

  const uploadDocument = async (formData, onProgress) => {
    try {
      const response = await documentsAPI.uploadDocument(formData);
      dispatch({ type: 'ADD_DOCUMENT', payload: response.data });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to upload document';
      dispatch({ 
        type: 'SET_ERROR', 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const reloadData = () => {
    loadInitialData();
  };

  const value = {
    ...state,
    searchDocuments: advancedSearch,
    getSearchSuggestions,
    getSearchStats,
    applyFilters,
    uploadDocument,
    clearError,
    loadInitialData: reloadData,
    testAPIConnection,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Export the hook as a named export
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Optional: Export the context itself if needed elsewhere
export { AppContext };