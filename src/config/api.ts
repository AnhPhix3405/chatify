// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    
    // User endpoints
    USERS: '/api/users',
    SEARCH_USER: (username: string) => `/api/users/search/${username}`,
    
    // Chat endpoints
    CHATS: '/api/chats',
    CREATE_CHAT: '/api/chats',
    GET_USER_CHATS: (userId: string) => `/api/chats?userId=${userId}`,
    GET_USER_CHATS_WITH_LAST_MESSAGES: (userId: string) => `/api/chats/user/${userId}/with-last-messages`,
    GET_LAST_MESSAGE: (chatId: string) => `/api/chats/${chatId}/last-message`,
    GET_CHAT_MESSAGES: (chatId: string) => `/api/chats/${chatId}/messages`,
    
    // Message endpoints
    MESSAGES: '/api/messages'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
