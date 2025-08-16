import React, { createContext, useState, useEffect } from 'react';
import { Chat, Message, User, ChatContextType, ApiUser } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Initialize empty current user - will be loaded from API
const initialCurrentUser: User = {
  id: '',
  name: '',
  avatar: '',
  status: 'online'
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchResult, setSearchResult] = useState<ApiUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadCurrentUser = async () => {
      const savedUsername = localStorage.getItem('chatify_username');
      if (savedUsername) {
        try {
          const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SEARCH_USER(savedUsername)));
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const apiUser = data.data;
              const user: User = {
                id: apiUser.id.toString(),
                name: apiUser.display_name || apiUser.username,
                avatar: apiUser.avatar_url || 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150',
                status: apiUser.status === 'away' ? 'offline' : apiUser.status
              };
              setCurrentUser(user);
            }
          }
        } catch (error) {
          console.error('Error loading current user:', error);
        }
      }
    };

    loadCurrentUser();
  }, []);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!activeChat || !currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content,
      type,
      timestamp: new Date(),
      seenBy: [currentUser.id]
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage
            }
          : chat
      )
    );

    setActiveChat(prev => 
      prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: newMessage
      } : null
    );
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!activeChat || !currentUser) return;

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === messageId
                  ? {
                      ...msg,
                      reactions: [
                        ...(msg.reactions || []),
                        { emoji, userId: currentUser!.id }
                      ]
                    }
                  : msg
              )
            }
          : chat
      )
    );
  };

  const searchChats = (query: string): Chat[] => {
    return chats.filter(chat =>
      chat.participants.some(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      ) ||
      chat.messages.some(m => 
        m.content.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const searchUser = async (username: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SEARCH_USER(username)));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        console.log('User found:', data.data);
        setSearchResult(data.data);
      } else {
        console.error('User not found:', data.message);
        alert('User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Error searching user. Please check your internet connection.');
    }
  };

  const clearSearchResult = () => {
    setSearchResult(null);
  };

  const createChatWithUser = (apiUser: ApiUser) => {
    if (!currentUser) return;
    
    // Convert ApiUser to User format
    const newUser: User = {
      id: apiUser.id.toString(),
      name: apiUser.display_name || apiUser.username,
      avatar: apiUser.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      status: apiUser.status === 'away' ? 'offline' : apiUser.status
    };

    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.id === newUser.id)
    );

    if (existingChat) {
      // If chat exists, just set it as active
      setActiveChat(existingChat);
      console.log('Chat already exists, switching to:', existingChat);
      return;
    }

    // Create new chat
    const newChat: Chat = {
      id: `chat-${newUser.id}`,
      participants: [currentUser, newUser],
      messages: [],
      unreadCount: 0
    };

    // Add to chats list
    setChats(prevChats => [newChat, ...prevChats]);
    
    // Set as active chat
    setActiveChat(newChat);
    
    console.log('Created new chat with user:', newUser);
  };

  return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      currentUser: currentUser!,
      isMobileView,
      setActiveChat,
      sendMessage,
      addReaction,
      searchChats,
      searchUser,
      searchResult,
      clearSearchResult,
      createChatWithUser,
      setMobileView: setIsMobileView
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext };