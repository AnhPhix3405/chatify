import React from 'react';
import { Moon, Sun, Settings, Info, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onInfoToggle: () => void;
  showInfo: boolean;
  onProfileToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onInfoToggle, showInfo, onProfileToggle }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 md:p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm">CA</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Chatify</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            {isDark ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          
          <button
            onClick={onInfoToggle}
            className={`p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 ${
              showInfo 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          <button 
            onClick={onProfileToggle}
            className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          <button className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200">
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};