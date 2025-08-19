import React, { useState, useEffect } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

interface AuthLayoutProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { login, register, currentUser, isAuthenticated } = useAuth();

  // Listen for authentication success
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      onAuthSuccess(currentUser);
    }
  }, [isAuthenticated, currentUser, onAuthSuccess]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await login({ username: email, password });
      
      if (!success) {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch {
      setError('Đã xảy ra lỗi không mong muốn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await register({ username, email, password });
      
      if (!success) {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch {
      setError('Đã xảy ra lỗi không mong muốn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {isLogin ? (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setIsLogin(false)}
          isLoading={isLoading}
        />
      ) : (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsLogin(true)}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
