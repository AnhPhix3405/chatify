import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  autoDismiss?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ 
  type, 
  message, 
  isVisible, 
  onClose, 
  duration = 4000,
  autoDismiss = true
}) => {
  useEffect(() => {
    if (isVisible && duration > 0 && autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, autoDismiss, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-white" />;
      case 'info':
        return <Info className="h-5 w-5 text-white" />;
      default:
        return <Info className="h-5 w-5 text-white" />;
    }
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'info':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 max-w-sm w-full z-50 transform transition-all duration-300 ease-in-out
      ${isVisible ? 'animate-[toast-slide-in_0.3s_ease-out]' : 'animate-[toast-slide-out_0.3s_ease-in]'}
    `}>
      <div className={`
        ${getToastStyles()} 
        rounded-lg shadow-lg border overflow-hidden
      `}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-white">
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="inline-flex text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20 rounded-md p-1"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar for auto dismiss */}
        {autoDismiss && (
          <div className="h-1 bg-black/20">
            <div 
              className="h-full bg-white/30 transition-all linear"
              style={{
                width: '100%',
                animationDuration: `${duration}ms`,
                animationName: 'shrink-width',
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
