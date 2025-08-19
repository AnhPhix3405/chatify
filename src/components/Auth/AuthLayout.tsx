import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { AuthService, LoginCredentials, RegisterData } from '../../services/authService';
import { User } from '../../types';

interface AuthLayoutProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const credentials: LoginCredentials = { username: email, password };
      const result = await AuthService.login(credentials);
      
      if (result.success && result.data) {
        onAuthSuccess(result.data.user);
      } else {
        setError(result.message);
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
      const registerData: RegisterData = { username, email, password };
      const result = await AuthService.register(registerData);
      
      if (result.success && result.data) {
        onAuthSuccess(result.data.user);
      } else {
        setError(result.message);
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
