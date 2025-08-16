export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string;
}

export interface ApiUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away';
  last_seen: number;
  created_at: string;
  updated_at: string;
}

export interface ApiChatMember {
  user_id: number;
  role: string;
  user: {
    id: number;
    username: string;
    avatar_url?: string;
    status: 'online' | 'offline' | 'away';
  };
}

export interface ApiMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  reply_to_id?: string;
  sent_at: string;
  sender?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
}

export interface ApiChat {
  id: number;
  type: string;
  name?: string;
  avatar_url?: string;
  members: ApiChatMember[];
  lastMessage?: ApiMessage;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  reactions?: Reaction[];
  seenBy?: string[];
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Chat {
  id: string;
  type?: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  theme?: string;
}

export interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  currentUser: User;
  isMobileView: boolean;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => void;
  addReaction: (messageId: string, emoji: string) => void;
  searchChats: (query: string) => Chat[];
  setMobileView: (isMobile: boolean) => void;
  searchUser: (username: string) => void;
  searchResult: ApiUser | null;
  clearSearchResult: () => void;
  createChatWithUser: (apiUser: ApiUser) => Promise<void>;
  refreshUserChats: () => Promise<void>;
  loadChatMessages: (chatId: string) => Promise<void>;
}