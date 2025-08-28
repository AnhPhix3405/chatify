import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Send, Paperclip, Smile, Image, ArrowLeft } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { Message, User } from '../types';

const MessageBubble: React.FC<{ 
  message: Message; 
  isOwn: boolean; 
  sender: User;
  onReaction: (emoji: string) => void;
}> = ({ message, isOwn, sender, onReaction }) => {
  const [showReactions, setShowReactions] = useState(false);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const reactions = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {!isOwn && (
        <img
          src={sender.avatar}
          alt={sender.display_name || sender.name}
          className="w-8 h-8 rounded-full mr-2 self-end"
        />
      )}
      
      <div className={`relative max-w-xs lg:max-w-md`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
          } shadow-sm`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatTime(message.timestamp)}
            </span>
            {message.seenBy && message.seenBy.length > 1 && isOwn && (
              <div className="flex -space-x-1 ml-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full border border-white"></div>
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2 left-2 flex space-x-1">
            {message.reactions.map((reaction, index) => (
              <span
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-1 py-0.5 text-xs shadow-sm"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg flex space-x-1 p-2 z-10`}>
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReaction(emoji)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors duration-150"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Removed avatar for current user messages */}
    </div>
  );
};

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, isMobileView } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <Image className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={`
              w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-full pr-12 text-sm 
              text-gray-900 dark:text-white placeholder-gray-500 
              focus:ring-2 focus:ring-blue-500 transition-all duration-200
              ${isMobileView ? 'py-3 px-4' : 'py-3 px-4'}
            `}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className={`rounded-full transition-all duration-200 ${
            message.trim()
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          } ${isMobileView ? 'p-3' : 'p-3'}`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export const ChatArea: React.FC = () => {
  const { 
    activeChat, 
    currentUser, 
    addReaction, 
    isMobileView, 
    setActiveChat, 
    initiateCall
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Chatify
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  // Thêm kiểu cho các tham số
  const otherParticipant = activeChat.participants.find((p: User) => p.id !== currentUser?.id);

  const handlePhoneCall = () => {
    if (otherParticipant && activeChat) {
      initiateCall(otherParticipant.id, activeChat.id, 'voice');
    }
  };

  const handleVideoCall = () => {
    if (otherParticipant && activeChat) {
      initiateCall(otherParticipant.id, activeChat.id, 'video');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back button for mobile */}
            {isMobileView && (
              <button 
                onClick={() => setActiveChat(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <img
              src={otherParticipant?.avatar}
              alt={otherParticipant?.display_name || otherParticipant?.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {otherParticipant?.display_name || otherParticipant?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {otherParticipant?.status === 'online' ? 'Online' : 
                 otherParticipant?.status === 'typing' ? 'Typing...' : 
                 otherParticipant?.lastSeen || 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={handlePhoneCall}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={handleVideoCall}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-1">
          {activeChat.messages.map((message: Message) => {
            const sender = activeChat.participants.find((p: User) => p.id === message.senderId) || currentUser;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser.id}
                sender={sender}
                onReaction={(emoji) => addReaction(message.id, emoji)}
              />
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  );
};