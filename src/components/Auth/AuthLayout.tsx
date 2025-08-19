import React from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 dark:from-gray-900 dark:via-purple-900 dark:to-violet-900 flex">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Side - Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-600/20 backdrop-blur-sm"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-white">
          <div className="max-w-lg text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Chat with anyone, anytime
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Connect instantly with friends, family, and colleagues around the world. 
              Experience seamless communication like never before.
            </p>
            
            {/* Illustration SVG */}
            <div className="relative">
              <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto">
                <defs>
                  <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                
                {/* Chat bubbles */}
                <rect x="50" y="80" width="120" height="40" rx="20" fill="url(#chatGradient)" opacity="0.8" />
                <rect x="200" y="130" width="100" height="35" rx="17.5" fill="rgba(255,255,255,0.2)" />
                <rect x="80" y="180" width="140" height="40" rx="20" fill="url(#chatGradient)" opacity="0.6" />
                
                {/* Phone/Device outline */}
                <rect x="100" y="40" width="200" height="220" rx="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">Chatify</span>
              </div>
              <p className="text-sm text-white/70">connect instantly</p>
            </div>

            {/* Form Container */}
            <div className="relative overflow-hidden">
              <div 
                className={`transition-transform duration-500 ease-in-out ${
                  isLogin ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                {isLogin && (
                  <LoginPage 
                    onLogin={async () => {}} 
                    onSwitchToRegister={() => window.location.href = '/register'} 
                    isLoading={false} 
                  />
                )}
              </div>
              
              <div 
                className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                  isLogin ? 'translate-x-full' : 'translate-x-0'
                }`}
              >
                {!isLogin && (
                  <RegisterPage 
                    onRegister={async () => {}} 
                    onSwitchToLogin={() => window.location.href = '/login'} 
                    isLoading={false} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};