import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { SocketNewMessageData, SocketMessageUpdateData, SocketMessageDeleteData } from '../types';

// Call event types
interface CallIncomingData {
  callId: string;
  callerId: string;
  chatId: string;
  callType: string;
}

interface CallAcceptedData {
  callId: string;
  acceptedBy: string;
}

interface CallRejectedData {
  callId: string;
  rejectedBy: string;
}

interface CallEndedData {
  callId: string;
  endedBy: string;
  reason?: string;
}

interface CallFailedData {
  reason: string;
  message: string;
}

interface WebRTCOfferData {
  callId: string;
  offer: RTCSessionDescriptionInit;
  fromUserId: string;
}

interface WebRTCAnswerData {
  callId: string;
  answer: RTCSessionDescriptionInit;
  fromUserId: string;
}

interface WebRTCIceCandidateData {
  callId: string;
  candidate: RTCIceCandidateInit;
  fromUserId: string;
}

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

  // Generic emit method
  emit(event: string, data: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Generic on method
  on(event: string, callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // ========== CALL SIGNALING METHODS ==========
  
  // Initiate audio call
  initiateCall(targetUserId: string, chatId: string): void {
    if (this.socket && this.isConnected) {
      console.log('Initiating call to:', targetUserId);
      this.socket.emit('call:initiate', { targetUserId, chatId });
    } else {
      console.warn('WebSocket not connected, cannot initiate call');
    }
  }

  // Accept incoming call
  acceptCall(callId: string): void {
    if (this.socket && this.isConnected) {
      console.log('Accepting call:', callId);
      this.socket.emit('call:accept', { callId });
    } else {
      console.warn('WebSocket not connected, cannot accept call');
    }
  }

  // Reject incoming call
  rejectCall(callId: string): void {
    if (this.socket && this.isConnected) {
      console.log('Rejecting call:', callId);
      this.socket.emit('call:reject', { callId });
    } else {
      console.warn('WebSocket not connected, cannot reject call');
    }
  }

  // End active call
  endCall(callId: string): void {
    if (this.socket && this.isConnected) {
      console.log('Ending call:', callId);
      this.socket.emit('call:end', { callId });
    } else {
      console.warn('WebSocket not connected, cannot end call');
    }
  }

  // ========== WebRTC SIGNALING METHODS ==========
  
  // Send WebRTC offer
  sendWebRTCOffer(callId: string, offer: RTCSessionDescriptionInit): void {
    if (this.socket && this.isConnected) {
      console.log('Sending WebRTC offer for call:', callId);
      this.socket.emit('webrtc:offer', { callId, offer });
    } else {
      console.warn('WebSocket not connected, cannot send WebRTC offer');
    }
  }

  // Send WebRTC answer
  sendWebRTCAnswer(callId: string, answer: RTCSessionDescriptionInit): void {
    if (this.socket && this.isConnected) {
      console.log('Sending WebRTC answer for call:', callId);
      this.socket.emit('webrtc:answer', { callId, answer });
    } else {
      console.warn('WebSocket not connected, cannot send WebRTC answer');
    }
  }

  // Send ICE candidate
  sendIceCandidate(callId: string, candidate: RTCIceCandidateInit): void {
    if (this.socket && this.isConnected) {
      console.log('Sending ICE candidate for call:', callId);
      this.socket.emit('webrtc:ice-candidate', { callId, candidate });
    } else {
      console.warn('WebSocket not connected, cannot send ICE candidate');
    }
  }

  // ========== CALL EVENT LISTENERS ==========
  
  // Listen for incoming calls
  onIncomingCall(callback: (data: CallIncomingData) => void): void {
    if (this.socket) {
      this.socket.on('call:incoming', callback);
    }
  }

  // Listen for call accepted
  onCallAccepted(callback: (data: CallAcceptedData) => void): void {
    if (this.socket) {
      this.socket.on('call:accepted', callback);
    }
  }

  // Listen for call rejected
  onCallRejected(callback: (data: CallRejectedData) => void): void {
    if (this.socket) {
      this.socket.on('call:rejected', callback);
    }
  }

  // Listen for call ended
  onCallEnded(callback: (data: CallEndedData) => void): void {
    if (this.socket) {
      this.socket.on('call:ended', callback);
    }
  }

  // Listen for call timeout
  onCallTimeout(callback: (data: { callId: string }) => void): void {
    if (this.socket) {
      this.socket.on('call:timeout', callback);
    }
  }

  // Listen for call failed
  onCallFailed(callback: (data: CallFailedData) => void): void {
    if (this.socket) {
      this.socket.on('call:failed', callback);
    }
  }

  // ========== WebRTC EVENT LISTENERS ==========
  
  // Listen for WebRTC offer
  onWebRTCOffer(callback: (data: WebRTCOfferData) => void): void {
    if (this.socket) {
      this.socket.on('webrtc:offer', callback);
    }
  }

  // Listen for WebRTC answer
  onWebRTCAnswer(callback: (data: WebRTCAnswerData) => void): void {
    if (this.socket) {
      this.socket.on('webrtc:answer', callback);
    }
  }

  // Listen for ICE candidates
  onIceCandidate(callback: (data: WebRTCIceCandidateData) => void): void {
    if (this.socket) {
      this.socket.on('webrtc:ice-candidate', callback);
    }
  }

  // Remove listeners
  removeAllListeners(): void {
    if (this.socket) {
      // Message listeners
      this.socket.removeAllListeners('message:new');
      this.socket.removeAllListeners('message:updated');
      this.socket.removeAllListeners('message:deleted');
      
      // Call listeners
      this.socket.removeAllListeners('call:incoming');
      this.socket.removeAllListeners('call:accepted');
      this.socket.removeAllListeners('call:rejected');
      this.socket.removeAllListeners('call:ended');
      this.socket.removeAllListeners('call:timeout');
      this.socket.removeAllListeners('call:failed');
      
      // WebRTC listeners
      this.socket.removeAllListeners('webrtc:offer');
      this.socket.removeAllListeners('webrtc:answer');
      this.socket.removeAllListeners('webrtc:ice-candidate');
    }
  }

  // Remove only call listeners
  removeCallListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners('call:incoming');
      this.socket.removeAllListeners('call:accepted');
      this.socket.removeAllListeners('call:rejected');
      this.socket.removeAllListeners('call:ended');
      this.socket.removeAllListeners('call:timeout');
      this.socket.removeAllListeners('call:failed');
      this.socket.removeAllListeners('webrtc:offer');
      this.socket.removeAllListeners('webrtc:answer');
      this.socket.removeAllListeners('webrtc:ice-candidate');
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
