import React from 'react';
import { X, Bell, BellOff, Palette, FileText, Image, Video } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ isOpen, onClose }) => {
  const { activeChat, currentUser } = useChat();
  const { isDark } = useTheme();

  if (!isOpen || !activeChat) return null;

  const otherParticipant = activeChat.participants.find(p => p.id !== currentUser.id);
  
  const sharedFiles = activeChat.messages.filter(m => m.type === 'file').length;
  const sharedImages = activeChat.messages.filter(m => m.type === 'image').length;

  return (
    <div className={`w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Info</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <div className="text-center">
          <img
            src={otherParticipant?.avatar}
            alt={otherParticipant?.name}
            className="w-20 h-20 rounded-full mx-auto mb-3"
          />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {otherParticipant?.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {otherParticipant?.status === 'online' ? 'Online' : 'Last seen 2 hours ago'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">Notifications</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">Theme</span>
          </button>
        </div>

        {/* Shared Media */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Shared Media</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">Files</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{sharedFiles}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">Photos</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{sharedImages}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">Videos</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">0</span>
            </div>
          </div>
        </div>

        {/* Theme Colors */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Chat Theme</h5>
          <div className="flex space-x-2">
            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};