import React from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthLayout } from './AuthLayout';
import { User } from '../../types';

interface AuthAppProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthApp: React.FC<AuthAppProps> = ({ onAuthSuccess }) => {
  return (
    <ThemeProvider>
      <AuthLayout onAuthSuccess={onAuthSuccess} />
    </ThemeProvider>
  );
};
