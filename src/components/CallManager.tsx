import React, { useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useWebRTC } from '../hooks/useWebRTC';

export const CallManager: React.FC = () => {
  const { outgoingCall, activeCall } = useChat();
  const { startCall } = useWebRTC();

  // Trigger WebRTC when outgoing call is initiated
  useEffect(() => {
    if (outgoingCall && !activeCall) {
      console.log('Triggering WebRTC for outgoing call:', outgoingCall);
      startCall(
        outgoingCall.targetUserId, 
        outgoingCall.chatId, 
        outgoingCall.type === 'video'
      );
    }
  }, [outgoingCall, activeCall, startCall]);

  // This component doesn't render anything
  return null;
};
