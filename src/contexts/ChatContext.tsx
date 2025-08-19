import React, { createContext, useState, useEffect } from 'react';
import { Chat, Message, User, ChatContextType, ApiUser, ApiChat, ApiChatMember, ApiMessage, SocketNewMessageData, SocketMessageUpdateData, SocketMessageDeleteData } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';
import { socketService } from '../services/socketService';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchResult, setSearchResult] = useState<ApiUser | null>(null);

  // Helper function to filter chats
  const filterChats = (chatsToFilter: Chat[], currentUserId: string) => {
    return chatsToFilter.filter((chat) => {
      const hasMessages = chat.lastMessage || chat.messages.length > 0;
      const isCreator = chat.created_by === currentUserId;
      
      console.log(`Filtering chat ${chat.id}: hasMessages=${hasMessages}, isCreator=${isCreator}, created_by=${chat.created_by}, currentUserId=${currentUserId}`);
      
      // If chat has messages, show to everyone
      if (hasMessages) {
        console.log(`Chat ${chat.id}: Showing because has messages`);
        return true;
      }
      // If no messages, only show to creator
      if (isCreator) {
        console.log(`Chat ${chat.id}: Showing because user is creator`);
        return true;
      }
      
      console.log(`Chat ${chat.id}: Hiding because no messages and user is not creator`);
      return false;
    });
  };
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadCurrentUser = async () => {
      const savedUserId = localStorage.getItem('user_id');
      
      console.log('Loading user data:', { savedUserId });
      
      if (savedUserId) {
        // Tạo mock user từ user_id
        const mockUser: User = {
          id: savedUserId,
          name: `User ${savedUserId}`,
          avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150',
          status: 'online'
        };
        
        console.log('Setting current user:', mockUser);
        setCurrentUser(mockUser);
        
        // Load user chats after setting current user
        loadUserChats(savedUserId);
      }
    };

    loadCurrentUser();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const currentUserId = localStorage.getItem('user_id');
    if (currentUserId && currentUser) {
      console.log('Connecting to WebSocket...');
      socketService.connect(currentUserId);

      // Listen for new messages
      socketService.onNewMessage((data: SocketNewMessageData) => {
        console.log('Received new message via WebSocket:', data);
        handleNewMessageFromSocket(data);
      });

      // Listen for message updates
      socketService.onMessageUpdated((data: SocketMessageUpdateData) => {
        console.log('Received message update via WebSocket:', data);
        handleMessageUpdateFromSocket(data);
      });

      // Listen for message deletions
      socketService.onMessageDeleted((data: SocketMessageDeleteData) => {
        console.log('Received message deletion via WebSocket:', data);
        handleMessageDeleteFromSocket(data);
      });

      // Cleanup on unmount
      return () => {
        socketService.removeAllListeners();
        socketService.disconnect();
      };
    }
  }, [currentUser]);

  // Handle new message from WebSocket
  const handleNewMessageFromSocket = (data: SocketNewMessageData) => {
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

    // Apply filtering to ensure consistent behavior
    if (currentUser) {
      setChats(prevChats => filterChats(prevChats, currentUser.id));
    }
  };

  // Handle message update from WebSocket
  const handleMessageUpdateFromSocket = (data: SocketMessageUpdateData) => {
    const { message, chatId } = data;
    
    const updatedMessage: Message = {
      id: message.id.toString(),
      senderId: message.sender_id.toString(),
      content: message.content,
      type: message.message_type as 'text' | 'image' | 'file',
      timestamp: new Date(message.sent_at),
      seenBy: []
    };

    // Update chats
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = chat.messages.map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
          return {
            ...chat,
            messages: updatedMessages,
            lastMessage: chat.lastMessage?.id === updatedMessage.id ? updatedMessage : chat.lastMessage
          };
        }
        return chat;
      })
    );

    // Update active chat
    setActiveChat(prevActiveChat => {
      if (prevActiveChat && prevActiveChat.id === chatId) {
        const updatedMessages = prevActiveChat.messages.map(msg =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        );
        return {
          ...prevActiveChat,
          messages: updatedMessages,
          lastMessage: prevActiveChat.lastMessage?.id === updatedMessage.id ? updatedMessage : prevActiveChat.lastMessage
        };
      }
      return prevActiveChat;
    });
  };

  // Handle message deletion from WebSocket
  const handleMessageDeleteFromSocket = (data: SocketMessageDeleteData) => {
    const { messageId, chatId } = data;

    // Update chats
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const filteredMessages = chat.messages.filter(msg => msg.id !== messageId);
          const newLastMessage = filteredMessages.length > 0 ? filteredMessages[filteredMessages.length - 1] : undefined;
          return {
            ...chat,
            messages: filteredMessages,
            lastMessage: newLastMessage
          };
        }
        return chat;
      })
    );

    // Update active chat
    setActiveChat(prevActiveChat => {
      if (prevActiveChat && prevActiveChat.id === chatId) {
        const filteredMessages = prevActiveChat.messages.filter(msg => msg.id !== messageId);
        const newLastMessage = filteredMessages.length > 0 ? filteredMessages[filteredMessages.length - 1] : undefined;
        return {
          ...prevActiveChat,
          messages: filteredMessages,
          lastMessage: newLastMessage
        };
      }
      return prevActiveChat;
    });
  };

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
              display_name: member.user.display_name,
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
              created_by: apiChat.created_by.toString(),
              participants,
              messages: lastMessage ? [lastMessage] : [], // Include last message in messages array
              lastMessage,
              unreadCount: 0
            };
          });

          // Filter chats: if no messages, only show to creator
          const filteredChats = filterChats(formattedChats, userId);
          
          console.log('Loaded direct chats with last messages:', filteredChats);
          setChats(filteredChats);
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

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!activeChat || !currentUser) return;

    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) return;

    // Try to send via WebSocket first
    if (socketService.isSocketConnected()) {
      console.log('Sending message via WebSocket');
      socketService.sendMessage({
        chatId: activeChat.id,
        content,
        message_type: type,
        sender_id: currentUserId
      });
      return; // WebSocket will handle the response via onNewMessage
    }

    // Fallback to HTTP API if WebSocket not available
    console.log('Sending message via HTTP API (WebSocket not available)');
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

          // Update chats
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

          // Update active chat
          setActiveChat(prev => 
            prev ? {
              ...prev,
              messages: [...prev.messages, newMessage],
              lastMessage: newMessage
            } : null
          );

          console.log('Message sent successfully via HTTP:', newMessage);
        }
      }
    } catch (error) {
      console.error('Error sending message via HTTP:', error);
    }
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
        (p.display_name || p.name).toLowerCase().includes(query.toLowerCase())
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
    const currentUserId = localStorage.getItem('user_id');
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

          // Add to chats list - but only if it should be visible based on filtering rules
          setChats(prevChats => {
            const allChats = [newChat, ...prevChats];
            // Apply filtering to ensure consistent behavior
            if (currentUser) {
              return filterChats(allChats, currentUser.id);
            }
            return allChats;
          });
          
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
    
    const currentUserId = localStorage.getItem('user_id');
    if (currentUserId) {
      await loadUserChats(currentUserId);
    }
  };

  // Load messages for a specific chat
  const loadChatMessages = async (chatId: string) => {
    try {
      const currentUserId = localStorage.getItem('user_id');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GET_CHAT_MESSAGES(chatId) + `?userId=${currentUserId}&limit=100`));
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiMessages = data.data.messages;
          
          // Convert API messages to frontend format
          const formattedMessages: Message[] = apiMessages.map((apiMessage: ApiMessage) => ({
            id: apiMessage.id.toString(),
            senderId: apiMessage.sender_id.toString(),
            content: apiMessage.content,
            type: apiMessage.message_type as 'text' | 'image' | 'file',
            timestamp: new Date(apiMessage.sent_at),
            seenBy: []
          }));

          // Update the specific chat with messages
          setChats(prevChats =>
            prevChats.map(chat =>
              chat.id === chatId
                ? { ...chat, messages: formattedMessages }
                : chat
            )
          );

          // Update active chat if it matches
          setActiveChat(prevActiveChat => 
            prevActiveChat && prevActiveChat.id === chatId
              ? { ...prevActiveChat, messages: formattedMessages }
              : prevActiveChat
          );

          console.log('Loaded messages for chat:', chatId, formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
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
      refreshUserChats,
      loadChatMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext };