import React from 'react';
import { User as UserIcon, Mail, Circle } from 'lucide-react';
import { ApiUser } from '../types';

interface SearchResultProps {
  user: ApiUser;
  onClose: () => void;
  onAddToChat?: (user: ApiUser) => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({ user, onClose, onAddToChat }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Found
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <Circle 
                className={`w-4 h-4 ${
                  user.status === 'online' ? 'text-green-500' : 
                  user.status === 'away' ? 'text-yellow-500' : 'text-gray-400'
                } fill-current`}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {user.display_name || user.username}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{user.username}
            </p>
            <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="w-4 h-4 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onAddToChat && (
            <button
              onClick={() => onAddToChat(user)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Start Chat
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
