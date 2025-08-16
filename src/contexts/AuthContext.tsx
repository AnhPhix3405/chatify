import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { fullName: string; username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check localStorage on app start
  React.useEffect(() => {
    const savedUsername = localStorage.getItem('chatify_username');
    if (savedUsername) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string) => {
    // Simulate API call - in real app, call your API to get user data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock getting user data from API
    // In real app, you would get this from the login API response
    const userData = {
      id: 1, // This should come from your API
      username: username
    };
    
    // Save both username and user ID to localStorage
    localStorage.setItem('chatify_username', username);
    localStorage.setItem('chatify_user_id', userData.id.toString());
    
    console.log('Login successful:', { username, password, userData });
    setIsAuthenticated(true);
  };

  const register = async (data: { fullName: string; username: string; email: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Registration successful:', data);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('chatify_username');
    localStorage.removeItem('chatify_user_id');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
