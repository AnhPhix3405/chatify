import React, { useState } from 'react';
import { Plus, MessageCircle, UserPlus } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { Chat, User } from '../types';

const StatusIndicator: React.FC<{ user: User }> = ({ user }) => {
  const getStatusColor = () => {
    switch (user.status) {
      case 'online': return 'bg-green-500';
      case 'typing': return 'bg-blue-500 animate-pulse';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor()}`} />
  );
};

const ChatItem: React.FC<{ 
  chat: Chat; 
  isActive: boolean; 
  onClick: () => void;
}> = ({ chat, isActive, onClick }) => {
  const { currentUser } = useChat();
  
  // Find the other participant (not the current user)
  const otherParticipant = chat.participants.find((p: User) => p.id !== currentUser?.id);
  console.log('Debug otherParticipant:', otherParticipant);
  if (!otherParticipant) return null;

  const lastMessage = chat.lastMessage || (chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null);
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) return date.toLocaleDateString();
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
        isActive ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="relative">
        <img
          src={otherParticipant.avatar}
          alt={otherParticipant.display_name || otherParticipant.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <StatusIndicator user={otherParticipant} />
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {otherParticipant.display_name || otherParticipant.name}
          </h3>
          {lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {otherParticipant.status === 'typing' ? (
              <span className="flex items-center text-blue-500">
                <div className="flex space-x-1 mr-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                typing...
              </span>
            ) : lastMessage ? (
              lastMessage.content
            ) : (
              'No messages yet'
            )}
          </div>
          
          {chat.unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { chats, activeChat, setActiveChat, isMobileView, loadChatMessages, searchUser, searchResult, clearSearchResult, createChatWithUser, currentUser } = useChat();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');

  console.log('Sidebar rendering with chats:', chats.length);
  console.log('Current user:', currentUser);
  chats.forEach(chat => {
    console.log(`Chat ${chat.id}: created_by=${chat.created_by}, hasLastMessage=${!!chat.lastMessage}, messagesCount=${chat.messages?.length || 0}`);
  });

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
    // Load messages for this chat
    loadChatMessages(chat.id);
  };

  const handleSearchUser = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchUsername('');
    clearSearchResult();
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      searchUser(searchUsername.trim());
    }
  };

  const handleCreateChat = () => {
    if (searchResult) {
      createChatWithUser(searchResult);
      handleCloseSearchModal();
    }
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
      ${isMobileView ? 'h-screen' : 'h-full'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Search User Button */}
        <button 
          onClick={handleSearchUser}
          className="w-full mb-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-3 text-left transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <UserPlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">Search on Chatify</span>
          </div>
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chatify</h1>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChat?.id === chat.id}
              onClick={() => handleChatSelect(chat)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">No chats found</p>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${isMobileView ? 'fixed bottom-4 right-4 p-0 border-0' : ''}`}>
        {isMobileView ? (
          <button className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-200">
            <Plus className="w-6 h-6" />
          </button>
        ) : (
          <button className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200">
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        )}
      </div>

      {/* Search User Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search User</h2>
              <button
                onClick={handleCloseSearchModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUserSearch} className="mb-4">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Search
              </button>
            </form>

            {searchResult && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img
                    src={searchResult.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={searchResult.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{searchResult.display_name || searchResult.username}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{searchResult.username}</p>
                  </div>
                  <button
                    onClick={handleCreateChat}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                  >
                    Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};