import React from 'react';
import { User, Calendar, LogOut, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useChat();

  if (!isOpen || !currentUser) return null;

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    // Reload page để reset app
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.display_name || currentUser.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${
              currentUser.status === 'online' ? 'bg-green-500' : 
              currentUser.status === 'typing' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
          </div>

          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {currentUser.display_name || currentUser.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {currentUser.status}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">#{currentUser.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {currentUser.status}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
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
