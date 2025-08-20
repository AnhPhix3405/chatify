// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://chatify-api-2g1a.onrender.com',
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    
    // User endpoints
    USERS: '/api/users',
    GET_USER_BY_ID: (userId: string) => `/api/users/${userId}`,
    SEARCH_USER: (username: string) => `/api/users/search/${username}`,
    UPDATE_USER: (userId: string) => `/api/users/${userId}`,
    
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