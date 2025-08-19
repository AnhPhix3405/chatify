import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Chat, Message, User, ChatContextType, ApiUser, ApiChat, ApiChatMember, ApiMessage } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';
import { socketService } from '../services/socketService';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchResult, setSearchResult] = useState<ApiUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Helper function to filter chats
  const filterChats = useCallback((chatsToFilter: Chat[], currentUserId: string) => {
    return chatsToFilter.filter((chat) => {
      const hasMessages = chat.lastMessage || chat.messages.length > 0;
      const isCreator = chat.created_by === currentUserId;
      
      // If chat has messages, show to everyone
      if (hasMessages) {
        return true;
      }
      // If no messages, only show to creator
      if (isCreator) {
        return true;
      }
      
      return false;
    });
  }, []);

  // Load user chats from API
  const loadUserChats = useCallback(async (userId: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GET_USER_CHATS_WITH_LAST_MESSAGES(userId)));
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiChats: ApiChat[] = data.data;
          const directChats = apiChats.filter(chat => chat.type === 'direct');
          
          const formattedChats: Chat[] = directChats.map((apiChat: ApiChat) => {
            const participants: User[] = apiChat.members.map((member: ApiChatMember) => ({
              id: member.user.id.toString(),
              name: member.user.username,
              display_name: member.user.display_name,
              avatar: member.user.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
              status: member.user.status === 'away' ? 'offline' : member.user.status
            }));

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
              created_by: apiChat.created_by.toString(),
              participants,
              messages: lastMessage ? [lastMessage] : [],
              lastMessage,
              unreadCount: 0
            };
          });

          const filteredChats = filterChats(formattedChats, userId);
          setChats(filteredChats);
          console.log('Loaded chats:', filteredChats);
        }
      }
    } catch (error) {
      console.error('Error loading user chats:', error);
    }
  }, [filterChats]);

  // Load current user from API
  const loadCurrentUser = useCallback(async () => {
    const savedUserId = localStorage.getItem('user_id');
    
    if (!savedUserId) {
      setIsLoadingUser(false);
      return;
    }

    try {
      setIsLoadingUser(true);
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GET_USER_BY_ID(savedUserId)));
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data); // Debug log
        
        if (data.success && data.data) {
          const apiUser = data.data; // Sửa từ data.user thành data.data
          
          const user: User = {
            id: apiUser.id.toString(),
            name: apiUser.username,
            display_name: apiUser.display_name,
            avatar: apiUser.avatar_url || 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150',
            status: apiUser.status === 'away' ? 'offline' : apiUser.status
          };
          
          setCurrentUser(user);
          console.log('Current user loaded successfully:', user);
          
          // Load user chats after setting current user
          loadUserChats(savedUserId);
        } else {
          console.error('API returned success=false or no user data:', data);
        }
      } else {
        console.error('API call failed:', response.status);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoadingUser(false);
    }
  }, [loadUserChats]);

  // Initialize user and WebSocket on mount
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Initialize WebSocket when user is loaded
  useEffect(() => {
    if (currentUser) {
      const currentUserId = localStorage.getItem('user_id');
      if (currentUserId) {
        console.log('Connecting to WebSocket...');
        socketService.connect(currentUserId);

        // Listen for new messages
        socketService.onNewMessage((data) => {
          console.log('Received new message via WebSocket:', data);
          handleNewMessage(data);
        });

        // Cleanup on unmount
        return () => {
          socketService.removeAllListeners();
          socketService.disconnect();
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Handle new message from WebSocket
  const handleNewMessage = useCallback((data: { message: { id: number; sender_id: number; content: string; message_type: string; sent_at: string }; chatId: string }) => {
    const { message, chatId } = data;
    
    const newMessage: Message = {
      id: message.id.toString(),
      senderId: message.sender_id.toString(),
      content: message.content,
      type: message.message_type as 'text' | 'image' | 'file',
      timestamp: new Date(message.sent_at),
      seenBy: []
    };

    // Update chats list
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, newMessage];
          return {
            ...chat,
            messages: updatedMessages,
            lastMessage: newMessage
          };
        }
        return chat;
      });
    });

    // Update active chat if it matches
    setActiveChat(prevActiveChat => {
      if (prevActiveChat && prevActiveChat.id === chatId) {
        return {
          ...prevActiveChat,
          messages: [...prevActiveChat.messages, newMessage],
          lastMessage: newMessage
        };
      }
      return prevActiveChat;
    });
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

  // Send message function
  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!activeChat || !currentUser) return;

    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) return;

    // Try WebSocket first
    if (socketService.isSocketConnected()) {
      socketService.sendMessage({
        chatId: activeChat.id,
        content,
        message_type: type,
        sender_id: currentUserId
      });
      return;
    }

    // Fallback to HTTP
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GET_CHAT_MESSAGES(activeChat.id)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          message_type: type,
          sender_id: parseInt(currentUserId)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiMessage = data.data;
          
          const newMessage: Message = {
            id: apiMessage.id.toString(),
            senderId: apiMessage.sender_id.toString(),
            content: apiMessage.content,
            type: apiMessage.message_type,
            timestamp: new Date(apiMessage.sent_at),
            seenBy: [currentUserId]
          };

          // Update chats and active chat
          setChats(prevChats =>
            prevChats.map(chat =>
              chat.id === activeChat.id
                ? { ...chat, messages: [...chat.messages, newMessage], lastMessage: newMessage }
                : chat
            )
          );

          setActiveChat(prev => 
            prev ? { ...prev, messages: [...prev.messages, newMessage], lastMessage: newMessage } : null
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [activeChat, currentUser]);

  // Add reaction function
  const addReaction = useCallback((messageId: string, emoji: string) => {
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
                        { emoji, userId: currentUser.id }
                      ]
                    }
                  : msg
              )
            }
          : chat
      )
    );
  }, [activeChat, currentUser]);

  // Search chats function
  const searchChats = useCallback((query: string): Chat[] => {
    return chats.filter(chat =>
      chat.participants.some(p => 
        (p.display_name || p.name).toLowerCase().includes(query.toLowerCase())
      ) ||
      chat.messages.some(m => 
        m.content.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [chats]);

  // Search user function
  const searchUser = useCallback(async (username: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SEARCH_USER(username)));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setSearchResult(data.data);
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Error searching user. Please check your internet connection.');
    }
  }, []);

  const clearSearchResult = useCallback(() => {
    setSearchResult(null);
  }, []);

  // Create chat with user function
  const createChatWithUser = useCallback(async (apiUser: ApiUser) => {
    if (!currentUser) return;
    
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) return;

    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.id === apiUser.id.toString())
    );

    if (existingChat) {
      setActiveChat(existingChat);
      return;
    }

    try {
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
          
          const participants: User[] = apiChat.members.map((member: ApiChatMember) => ({
            id: member.user.id.toString(),
            name: member.user.username,
            display_name: member.user.display_name,
            avatar: member.user.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
            status: member.user.status === 'away' ? 'offline' : member.user.status
          }));

          const newChat: Chat = {
            id: apiChat.id.toString(),
            type: apiChat.type,
            created_by: apiChat.created_by.toString(),
            participants,
            messages: [],
            unreadCount: 0
          };

          setChats(prevChats => {
            const allChats = [newChat, ...prevChats];
            return filterChats(allChats, currentUserId);
          });
          
          setActiveChat(newChat);
        } else {
          alert('Failed to create chat');
        }
      } else {
        alert('Failed to create chat. Please try again.');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please check your internet connection.');
    }
  }, [currentUser, chats, filterChats]);

  // Refresh user chats
  const refreshUserChats = useCallback(async () => {
    const currentUserId = localStorage.getItem('user_id');
    if (currentUserId) {
      await loadUserChats(currentUserId);
    }
  }, [loadUserChats]);

  // Load chat messages
  const loadChatMessages = useCallback(async (chatId: string) => {
    try {
      const currentUserId = localStorage.getItem('user_id');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GET_CHAT_MESSAGES(chatId) + `?userId=${currentUserId}&limit=100`));
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiMessages = data.data.messages;
          
          const formattedMessages: Message[] = apiMessages.map((apiMessage: ApiMessage) => ({
            id: apiMessage.id.toString(),
            senderId: apiMessage.sender_id.toString(),
            content: apiMessage.content,
            type: apiMessage.message_type as 'text' | 'image' | 'file',
            timestamp: new Date(apiMessage.sent_at),
            seenBy: []
          }));

          setChats(prevChats =>
            prevChats.map(chat =>
              chat.id === chatId
                ? { ...chat, messages: formattedMessages }
                : chat
            )
          );

          setActiveChat(prevActiveChat => 
            prevActiveChat && prevActiveChat.id === chatId
              ? { ...prevActiveChat, messages: formattedMessages }
              : prevActiveChat
          );
        }
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('Logging out...');
    
    socketService.removeAllListeners();
    socketService.disconnect();
    
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_data');
    
    // 4. Reset all states
    setCurrentUser(null);
    setChats([]);
    setActiveChat(null);
    setSearchResult(null);
    setIsLoadingUser(false);
    
    // 5. Redirect to login
    window.location.href = '/login';
  }, []);

  const contextValue: ChatContextType = {
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
    refreshUserChats,
    loadChatMessages,
    logout
  };

  // Don't render children until user is loaded or confirmed not logged in
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext };
