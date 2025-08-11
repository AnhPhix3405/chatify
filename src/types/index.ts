export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string;
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
}