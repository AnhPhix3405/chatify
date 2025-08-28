import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useWebRTC } from '../hooks/useWebRTC';

export const CallManager: React.FC = () => {
  const { outgoingCall } = useChat();
  const { startCall } = useWebRTC();
  const hasTriggeredWebRTC = useRef(false);

  // Trigger WebRTC when outgoing call is initiated
  useEffect(() => {
    if (outgoingCall && !hasTriggeredWebRTC.current) {
      console.log('Triggering WebRTC for outgoing call:', outgoingCall);
      
      // Start WebRTC for caller
      startCall(outgoingCall.targetUserId, outgoingCall.chatId, outgoingCall.type === 'video')
        .then(() => {
          console.log('✅ WebRTC started successfully for outgoing call');
        })
        .catch((error) => {
          console.error('❌ Failed to start WebRTC for outgoing call:', error);
        });
      
      hasTriggeredWebRTC.current = true;
    }

    // Reset flag when outgoingCall changes
    if (!outgoingCall) {
      hasTriggeredWebRTC.current = false;
    }
  }, [outgoingCall, startCall]);

  // This component doesn't render anything
  return null;
};
