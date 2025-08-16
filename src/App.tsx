import { useState } from 'react';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InfoPanel } from './components/InfoPanel';
import { Header } from './components/Header';
import { SearchResult } from './components/SearchResult';
import { Profile } from './components/Profile';
import { AuthLayout } from './components/Auth/AuthLayout';
import { useChat } from './hooks/useChat';

// For demo purposes, we'll use a simple state to switch between auth and chat
// In a real app, this would be handled by authentication state
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

const AppWrapper = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  ) : (
    <AuthLayout />
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;