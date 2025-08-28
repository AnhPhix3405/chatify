import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { CallData } from '../../types';

interface OutgoingCallModalProps {
  call: CallData | null;
  onCancel: () => void;
}

export const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({
  call,
  onCancel
}) => {
  const [dots, setDots] = useState('');

  // Animate dots for "calling" effect
  useEffect(() => {
    if (!call) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [call]);

  if (!call) return null;

  const isVideoCall = call.type === 'video';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Call type icon with pulsing animation */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            {isVideoCall ? (
              <Video className="w-12 h-12 text-white" />
            ) : (
              <Phone className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Call info */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Calling{dots}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {isVideoCall ? 'Video call to:' : 'Voice call to:'}
          </p>
          
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {call.targetUserId}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            Waiting for answer...
          </p>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 mx-auto"
            aria-label="Cancel call"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          {/* Additional info */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Call ID: {call.callId}
          </p>
        </div>
      </div>
    </div>
  );
};
