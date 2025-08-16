// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://chatify-api-2g1a.onrender.com',
  ENDPOINTS: {
    USERS: '/api/users',
    SEARCH_USER: (username: string) => `/api/users/search/${username}`,
    CHATS: '/api/chats',
    MESSAGES: '/api/messages'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
