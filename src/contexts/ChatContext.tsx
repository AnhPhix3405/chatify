import React, { createContext, useState, useEffect } from 'react';
import { Chat, Message, User, ChatContextType, ApiUser, ApiChat, ApiChatMember } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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
      const savedUserId = localStorage.getItem('chatify_user_id');
      
      console.log('Loading user data:', { savedUsername, savedUserId });
      
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
              
              console.log('Setting current user:', user);
              setCurrentUser(user);
              
              // Load user chats after setting current user
              loadUserChats(apiUser.id.toString());
            }
          }
        } catch (error) {
          console.error('Error loading current user:', error);
        }
      }
    };

    loadCurrentUser();
  }, []);

  // Load user chats from API with last messages
  const loadUserChats = async (userId: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GET_USER_CHATS_WITH_LAST_MESSAGES(userId)));
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiChats: ApiChat[] = data.data;
          // Filter only direct chats
          const directChats = apiChats.filter(chat => chat.type === 'direct');
          
          const formattedChats: Chat[] = directChats.map((apiChat: ApiChat) => {
            // Convert API chat format to frontend Chat format
            const participants: User[] = apiChat.members.map((member: ApiChatMember) => ({
              id: member.user.id.toString(),
              name: member.user.username,
              avatar: member.user.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
              status: member.user.status === 'away' ? 'offline' : member.user.status
            }));

            // Convert last message if exists
            let lastMessage: Message | undefined = undefined;
            if (apiChat.lastMessage) {
              lastMessage = {
                id: apiChat.lastMessage.id.toString(),
                senderId: apiChat.lastMessage.sender_id.toString(),
                content: apiChat.lastMessage.content,
                type: apiChat.lastMessage.message_type as 'text' | 'image' | 'file',
                timestamp: new Date(apiChat.lastMessage.sent_at),
                seenBy: []
              };
            }

            return {
              id: apiChat.id.toString(),
              type: apiChat.type,
              participants,
              messages: lastMessage ? [lastMessage] : [], // Include last message in messages array
              lastMessage,
              unreadCount: 0
            };
          });
          
          console.log('Loaded direct chats with last messages:', formattedChats);
          setChats(formattedChats);
        }
      }
    } catch (error) {
      console.error('Error loading user chats:', error);
    }
  };

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

  const createChatWithUser = async (apiUser: ApiUser) => {
    if (!currentUser) return;
    
    // Get current user ID from localStorage
    const currentUserId = localStorage.getItem('chatify_user_id');
    console.log('Creating chat with user:', { 
      apiUser: apiUser.username, 
      apiUserId: apiUser.id,
      currentUserId: currentUserId,
      currentUser: currentUser.name 
    });
    
    if (!currentUserId) {
      console.error('Current user ID not found in localStorage');
      return;
    }

    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.id === apiUser.id.toString())
    );

    if (existingChat) {
      // If chat exists, just set it as active
      setActiveChat(existingChat);
      console.log('Chat already exists, switching to:', existingChat);
      return;
    }

    try {
      // Call API to create new chat
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_CHAT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'direct',
          memberIds: [apiUser.id],
          created_by: parseInt(currentUserId)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiChat: ApiChat = data.data;
          
          // Convert API chat to frontend format
          const participants: User[] = apiChat.members.map((member: ApiChatMember) => ({
            id: member.user.id.toString(),
            name: member.user.username,
            avatar: member.user.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
            status: member.user.status === 'away' ? 'offline' : member.user.status
          }));

          const newChat: Chat = {
            id: apiChat.id.toString(),
            type: apiChat.type,
            participants,
            messages: [],
            unreadCount: 0
          };

          // Add to chats list
          setChats(prevChats => [newChat, ...prevChats]);
          
          // Set as active chat
          setActiveChat(newChat);
          
          console.log('Created new chat successfully:', newChat);
        } else {
          console.error('Failed to create chat:', data.message);
          alert('Failed to create chat');
        }
      } else {
        console.error('API call failed:', response.status);
        alert('Failed to create chat. Please try again.');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please check your internet connection.');
    }
  };

  const refreshUserChats = async () => {
    if (!currentUser) return;
    
    const currentUserId = localStorage.getItem('chatify_user_id');
    if (currentUserId) {
      await loadUserChats(currentUserId);
    }
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
      setMobileView: setIsMobileView,
      refreshUserChats
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext };