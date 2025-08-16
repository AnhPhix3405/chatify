import React, { createContext, useState, useEffect } from 'react';
import { Chat, Message, User, ChatContextType, ApiUser } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'online'
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'offline',
    lastSeen: '2 hours ago'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'typing'
  },
  {
    id: '4',
    name: 'David Chen',
    avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'online'
  }
];

const currentUser: User = {
  id: 'current',
  name: 'You',
  avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150',
  status: 'online'
};

const mockChats: Chat[] = mockUsers.map((user, index) => ({
  id: `chat-${user.id}`,
  participants: [currentUser, user],
  messages: [
    {
      id: `msg-${index}-1`,
      senderId: user.id,
      content: index === 0 ? 'Hey! How are you doing today?' : 
               index === 1 ? 'Thanks for the files you sent yesterday!' :
               index === 2 ? 'Let\'s meet up for coffee sometime soon ☕' :
               'Great job on the project presentation!',
      type: 'text',
      timestamp: new Date(Date.now() - (index + 1) * 3600000),
      reactions: index === 0 ? [{ emoji: '❤️', userId: currentUser.id }] : undefined,
      seenBy: [currentUser.id]
    },
    {
      id: `msg-${index}-2`,
      senderId: currentUser.id,
      content: index === 0 ? 'I\'m doing great! Working on some exciting projects 🚀' :
               index === 1 ? 'You\'re welcome! Let me know if you need anything else' :
               index === 2 ? 'Absolutely! I know this great place downtown' :
               'Thank you! It was a team effort',
      type: 'text',
      timestamp: new Date(Date.now() - (index + 1) * 3500000),
      seenBy: [user.id]
    }
  ],
  unreadCount: index === 0 ? 0 : index === 2 ? 2 : 1,
  theme: index === 0 ? '#3B82F6' : undefined
}));

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchResult, setSearchResult] = useState<ApiUser | null>(null);

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
    if (!activeChat) return;

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
    if (!activeChat) return;

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
                        { emoji, userId: currentUser.id }
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

  return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      currentUser,
      isMobileView,
      setActiveChat,
      sendMessage,
      addReaction,
      searchChats,
      searchUser,
      searchResult,
      clearSearchResult,
      setMobileView: setIsMobileView
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext };