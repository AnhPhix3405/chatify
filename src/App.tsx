import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InfoPanel } from './components/InfoPanel';
import { Header } from './components/Header';
import { SearchResult } from './components/SearchResult';
import { Profile } from './components/Profile';
import { LoginPage } from './components/Auth/LoginPage';
import { RegisterPage } from './components/Auth/RegisterPage';
import { useChat } from './hooks/useChat';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userId = localStorage.getItem('user_id');
  
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Chat interface component
const AppContent = () => {
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { activeChat, isMobileView, searchResult, clearSearchResult, createChatWithUser } = useChat();

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header - only show on desktop */}
      {!isMobileView && (
        <Header 
          onInfoToggle={() => setShowInfoPanel(!showInfoPanel)}
          showInfo={showInfoPanel}
          onProfileToggle={() => setShowProfile(!showProfile)}
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - show/hide based on mobile state */}
        <div className={`
          transition-all duration-300 ease-in-out
          ${isMobileView 
            ? (activeChat ? 'hidden' : 'w-full') 
            : 'w-80'
          }
        `}>
          <Sidebar />
        </div>
        
        {/* Chat Area - show/hide based on mobile state */}
        <div className={`
          flex transition-all duration-300 ease-in-out
          ${isMobileView 
            ? (activeChat ? 'flex-1 w-full' : 'hidden') 
            : 'flex-1'
          }
        `}>
          <ChatArea />
          
          {/* Info Panel - only show on desktop */}
          {!isMobileView && showInfoPanel && (
            <InfoPanel
              isOpen={showInfoPanel}
              onClose={() => setShowInfoPanel(false)}
            />
          )}
        </div>
      </div>
      
      {/* Search Result Modal */}
      {searchResult && (
        <SearchResult
          user={searchResult}
          onClose={clearSearchResult}
          onAddToChat={async (user) => {
            await createChatWithUser(user);
            clearSearchResult();
          }}
        />
      )}

      {/* Profile Modal */}
      <Profile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={
            <LoginPage 
              onLogin={async () => {}} 
              onSwitchToRegister={() => window.location.href = '/register'} 
              isLoading={false} 
            />
          } />
          <Route path="/register" element={
            <RegisterPage 
              onRegister={async () => {}} 
              onSwitchToLogin={() => window.location.href = '/login'} 
              isLoading={false} 
            />
          } />
          
          {/* Main app route */}
          <Route path="/" element={
            <ProtectedRoute>
              <ChatProvider>
                <AppContent />
              </ChatProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;