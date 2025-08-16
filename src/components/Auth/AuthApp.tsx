import React from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthLayout } from './AuthLayout';

export const AuthApp: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthLayout />
    </ThemeProvider>
  );
};
