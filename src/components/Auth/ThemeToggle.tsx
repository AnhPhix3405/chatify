import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
      ) : (
        <Moon className="w-5 h-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
      )}
    </button>
  );
};
