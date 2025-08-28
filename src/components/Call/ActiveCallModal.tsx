import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react';
import { CallData } from '../../types';
import { useWebRTC } from '../../hooks/useWebRTC';

interface ActiveCallModalProps {
  call: CallData | null;
  onEnd: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  call,
  onEnd
}) => {
  const { 
    endCall, 
    toggleMute, 
    toggleVideo, 
    isMuted, 
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    remoteAudioRef 
  } = useWebRTC();
  
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Update call duration
  useEffect(() => {
    if (!call) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [call]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    endCall();
    onEnd();
  };

  if (!call) return null;

  const isVideoCall = call.type === 'video';

  if (isMinimized) {
    // Minimized view - floating widget
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-900 text-white rounded-lg p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Call Active</span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-gray-400 mb-3">
            {formatDuration(duration)}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-colors ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handleEndCall}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-4xl max-h-4xl bg-gray-900 text-white relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                {isVideoCall ? 'Video Call' : 'Voice Call'}
              </h3>
              <p className="text-gray-300 text-sm">
                {call.callerId} • {formatDuration(duration)}
              </p>
            </div>
            
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video containers */}
        {isVideoCall ? (
          <div className="w-full h-full relative">
            {/* Remote video (main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute top-20 right-6 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          // Voice call UI
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{call.callerId}</h3>
              <p className="text-gray-400">{formatDuration(duration)}</p>
            </div>
          </div>
        )}

        {/* Hidden audio elements for voice calls */}
        <audio 
          ref={localAudioRef} 
          autoPlay 
          muted 
          style={{ display: 'none' }}
        />
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          style={{ display: 'none' }}
        />

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
          <div className="flex justify-center space-x-4">
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video toggle (only for video calls) */}
            {isVideoCall && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${
                  isVideoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}

            {/* End call button */}
            <button
              onClick={handleEndCall}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
              aria-label="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
