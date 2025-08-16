import { useState } from 'react';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InfoPanel } from './components/InfoPanel';
import { Header } from './components/Header';
import { SearchResult } from './components/SearchResult';
import { useChat } from './hooks/useChat';

const AppContent = () => {
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const { activeChat, isMobileView, searchResult, clearSearchResult } = useChat();

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header - only show on desktop */}
      {!isMobileView && (
        <Header 
          onInfoToggle={() => setShowInfoPanel(!showInfoPanel)}
          showInfo={showInfoPanel}
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
          onAddToChat={(user) => {
            // TODO: Implement add to chat functionality
            console.log('Add to chat:', user);
            clearSearchResult();
          }}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;