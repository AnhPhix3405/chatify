import React from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { CallData } from '../../types';
import { useWebRTC } from '../../hooks/useWebRTC';

interface IncomingCallModalProps {
  call: CallData | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onReject
}) => {
  const { answerCall } = useWebRTC();

  if (!call) return null;

  const handleAccept = async () => {
    try {
      console.log('Accepting call and starting WebRTC for call:', call.callId);
      await answerCall(call.callId, call.type === 'video');
      onAccept();
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const isVideoCall = call.type === 'video';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Call type icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            {isVideoCall ? (
              <Video className="w-12 h-12 text-white" />
            ) : (
              <Phone className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Call info */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Incoming {isVideoCall ? 'Video' : 'Voice'} Call
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            From: {call.callerId}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            Call ID: {call.callId}
          </p>

          {/* Action buttons */}
          <div className="flex justify-center space-x-6">
            {/* Reject button */}
            <button
              onClick={onReject}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
              aria-label="Decline call"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
              aria-label="Accept call"
            >
              {isVideoCall ? (
                <Video className="w-8 h-8" />
              ) : (
                <Phone className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Additional controls for video calls */}
          {isVideoCall && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Answer with:
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => answerCall(call.callId, false)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">Audio only</span>
                </button>
                <button
                  onClick={handleAccept}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span className="text-sm">With video</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
