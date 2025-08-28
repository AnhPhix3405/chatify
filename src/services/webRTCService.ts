import { socketService } from './socketService';

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Event callbacks
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onLocalStreamCallback?: (stream: MediaStream) => void;
  private onCallEndedCallback?: () => void;
  private onCallErrorCallback?: (error: string) => void;

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Listen for WebRTC signaling events
    socketService.on('webrtc-offer', (data: unknown) => {
      this.handleOffer(data as { offer: RTCSessionDescriptionInit; callId: string });
    });
    socketService.on('webrtc-answer', (data: unknown) => {
      this.handleAnswer(data as { answer: RTCSessionDescriptionInit; callId: string });
    });
    socketService.on('webrtc-ice-candidate', (data: unknown) => {
      this.handleIceCandidate(data as { candidate: RTCIceCandidateInit; callId: string });
    });
  }

  // Initialize peer connection
  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.configuration);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          callId: this.currentCallId
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.endCall();
      }
    };

    return pc;
  }

  private currentCallId: string | null = null;

  // Start a call (caller)
  async startCall(callId: string, isVideoCall: boolean = false): Promise<void> {
    try {
      this.currentCallId = callId;
      this.peerConnection = this.createPeerConnection();

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall
      });

      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(this.localStream);
      }

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      socketService.emit('webrtc-offer', {
        offer,
        callId
      });

    } catch (error) {
      console.error('Error starting call:', error);
      if (this.onCallErrorCallback) {
        this.onCallErrorCallback('Failed to start call');
      }
    }
  }

  // Answer a call (callee)
  async answerCall(callId: string, isVideoCall: boolean = false): Promise<void> {
    try {
      this.currentCallId = callId;
      if (!this.peerConnection) {
        this.peerConnection = this.createPeerConnection();
      }

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall
      });

      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(this.localStream);
      }

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

    } catch (error) {
      console.error('Error answering call:', error);
      if (this.onCallErrorCallback) {
        this.onCallErrorCallback('Failed to answer call');
      }
    }
  }

  // Handle incoming offer
  private async handleOffer(data: { offer: RTCSessionDescriptionInit; callId: string }) {
    try {
      if (!this.peerConnection) {
        this.peerConnection = this.createPeerConnection();
      }

      await this.peerConnection.setRemoteDescription(data.offer);
      
      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      socketService.emit('webrtc-answer', {
        answer,
        callId: data.callId
      });

    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle incoming answer
  private async handleAnswer(data: { answer: RTCSessionDescriptionInit; callId: string }) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(data.answer);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  // Handle ICE candidate
  private async handleIceCandidate(data: { candidate: RTCIceCandidateInit; callId: string }) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // End call
  endCall(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;

    if (this.onCallEndedCallback) {
      this.onCallEndedCallback();
    }
  }

  // Mute/unmute audio
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Mute/unmute video
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Set event callbacks
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  onCallEnded(callback: () => void) {
    this.onCallEndedCallback = callback;
  }

  onCallError(callback: (error: string) => void) {
    this.onCallErrorCallback = callback;
  }

  // Get current streams
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

export const webRTCService = new WebRTCService();
