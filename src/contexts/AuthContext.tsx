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
    try {
      // Call API to search user and get real user data
      const response = await fetch(`https://chatify-api-2g1a.onrender.com/api/users/search/${username}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const userData = data.data;
          
          // Save both username and user ID to localStorage
          localStorage.setItem('chatify_username', username);
          localStorage.setItem('chatify_user_id', userData.id.toString());
          
          console.log('Login successful:', { username, password, userData });
          setIsAuthenticated(true);
        } else {
          console.error('User not found:', data.message);
          alert('User not found. Please check your username.');
        }
      } else {
        console.error('API call failed:', response.status);
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please check your internet connection.');
    }
  };

  const register = async (data: { fullName: string; username: string; email: string; password: string }) => {
    try {
      // Simulate API call for registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful registration, search for the user to get their ID
      const response = await fetch(`https://chatify-api-2g1a.onrender.com/api/users/search/${data.username}`);
      
      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success) {
          const userData = apiResponse.data;
          
          // Save both username and user ID to localStorage
          localStorage.setItem('chatify_username', data.username);
          localStorage.setItem('chatify_user_id', userData.id.toString());
          
          console.log('Registration successful:', data, userData);
          setIsAuthenticated(true);
        } else {
          console.error('User not found after registration:', apiResponse.message);
          alert('Registration completed but failed to get user data. Please try logging in.');
        }
      } else {
        console.error('API call failed:', response.status);
        alert('Registration completed but failed to get user data. Please try logging in.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed. Please try again.');
    }
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
