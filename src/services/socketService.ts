import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { SocketNewMessageData, SocketMessageUpdateData, SocketMessageDeleteData } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string): void {
    if (this.isConnected) return;

    console.log('Connecting to WebSocket with userId:', userId);
    
    this.socket = io(API_CONFIG.BASE_URL, {
      query: { userId },
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected manually');
    }
  }

  // Listen for new messages
  onNewMessage(callback: (data: SocketNewMessageData) => void): void {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  // Listen for message updates
  onMessageUpdated(callback: (data: SocketMessageUpdateData) => void): void {
    if (this.socket) {
      this.socket.on('message:updated', callback);
    }
  }

  // Listen for message deletions
  onMessageDeleted(callback: (data: SocketMessageDeleteData) => void): void {
    if (this.socket) {
      this.socket.on('message:deleted', callback);
    }
  }

  // Send message via WebSocket
  sendMessage(data: { chatId: string; content: string; message_type: string; sender_id?: string }): void {
    if (this.socket && this.isConnected) {
      console.log('Sending message via WebSocket:', data);
      this.socket.emit('message:send', data);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Remove listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners('message:new');
      this.socket.removeAllListeners('message:updated');
      this.socket.removeAllListeners('message:deleted');
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
