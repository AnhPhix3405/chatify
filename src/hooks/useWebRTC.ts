import { useState, useEffect, useRef, useCallback } from 'react';
import { webRTCService } from '../services/webRTCService';
import { useChat } from './useChat';

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  startCall: (targetUserId: string, chatId: string, isVideo?: boolean) => Promise<void>;
  answerCall: (callId: string, isVideo?: boolean) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  localAudioRef: React.RefObject<HTMLAudioElement>;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
}

export const useWebRTC = (): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const { activeCall, callStatus } = useChat();

  // Setup WebRTC service callbacks
  useEffect(() => {
    webRTCService.onLocalStream((stream: MediaStream) => {
      setLocalStream(stream);
      
      // Set up local audio/video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Prevent echo
      }
    });

    webRTCService.onRemoteStream((stream: MediaStream) => {
      setRemoteStream(stream);
      
      // Set up remote audio/video elements
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    });

    webRTCService.onCallEnded(() => {
      setIsCallActive(false);
      setLocalStream(null);
      setRemoteStream(null);
      setIsMuted(false);
      setIsVideoEnabled(false);
      
      // Clear video/audio elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    });

    webRTCService.onCallError((error: string) => {
      console.error('WebRTC error:', error);
      setIsCallActive(false);
    });

    return () => {
      // Cleanup on unmount
      webRTCService.endCall();
    };
  }, []);

  // Update call active state based on call status
  useEffect(() => {
    setIsCallActive(callStatus === 'connected');
  }, [callStatus]);

  const startCall = useCallback(async (_targetUserId: string, _chatId: string, isVideo: boolean = false) => {
    try {
      if (activeCall) {
        await webRTCService.startCall(activeCall.callId, isVideo);
        setIsCallActive(true);
        setIsVideoEnabled(isVideo);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  }, [activeCall]);

  const answerCall = useCallback(async (callId: string, isVideo: boolean = false) => {
    try {
      await webRTCService.answerCall(callId, isVideo);
      setIsCallActive(true);
      setIsVideoEnabled(isVideo);
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  }, []);

  const endCall = useCallback(() => {
    webRTCService.endCall();
    setIsCallActive(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = webRTCService.toggleAudio();
    setIsMuted(!newMutedState);
  }, []);

  const toggleVideo = useCallback(() => {
    const newVideoState = webRTCService.toggleVideo();
    setIsVideoEnabled(newVideoState);
  }, []);

  return {
    localStream,
    remoteStream,
    isCallActive,
    isMuted,
    isVideoEnabled,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    remoteAudioRef
  };
};
