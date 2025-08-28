export interface User {
  id: string;
  name: string;
  display_name?: string;
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
  last_seen: string; // Changed from number to string (ISO timestamp)
}

export interface ApiChatMember {
  user_id: number;
  role: string;
  user: {
    id: number;
    username: string;
    display_name?: string;
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
  created_by: number;
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
  created_by?: string;
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
  logout: () => void;
  // Call related properties
  initiateCall: (targetUserId: string, chatId: string, callType?: 'voice' | 'video') => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  endCall: () => void;
  incomingCall: CallData | null;
  activeCall: CallData | null;
  outgoingCall: CallData | null;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected';
}


// WebSocket event types
export interface SocketNewMessageData {
  message: {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    message_type: string;
    sent_at: string;
    sender?: {
      id: number;
      username: string;
      avatar_url?: string;
    };
  };
  chatId: string;
}

export interface SocketMessageUpdateData {
  message: {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    message_type: string;
    sent_at: string;
  };
  chatId: string;
  updatedBy: string;
}

export interface SocketMessageDeleteData {
  messageId: string;
  chatId: string;
  deletedBy: string;
}

// Call related interfaces
export interface CallData {
  callId: string;
  callerId: string;
  targetUserId: string;
  chatId: string;
  type: 'voice' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  isInitiator?: boolean;
}

export interface CallIncomingData {
  callId: string;
  callerId: string;
  chatId: string;
  callType: string;
}

export interface CallAcceptedData {
  callId: string;
  acceptedBy: string;
}

export interface CallRejectedData {
  callId: string;
  rejectedBy: string;
}

export interface CallEndedData {
  callId: string;
  endedBy: string;
  reason?: string;
}

export interface CallFailedData {
  reason: string;
}

// WebRTC related interfaces
export interface WebRTCOfferData {
  callId: string;
  offer: RTCSessionDescriptionInit;
  fromUserId: string;
}

export interface WebRTCAnswerData {
  callId: string;
  answer: RTCSessionDescriptionInit;
  fromUserId: string;
}

export interface WebRTCIceCandidateData {
  callId: string;
  candidate: RTCIceCandidateInit;
  fromUserId: string;
}