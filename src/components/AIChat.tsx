import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiChatService, AIConversation, AIMessage } from '../services/aiChatService';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createNewConversation = useCallback(() => {
    const newConv = aiChatService.createConversation();
    setCurrentConversation(newConv);
    setConversations(prev => [...prev, newConv]);
  }, []);

  // Load conversations khi component mount
  const loadConversations = useCallback(() => {
    const convs = aiChatService.getConversations();
    setConversations(convs);
    
    // Nếu chưa có conversation nào, tạo mới
    if (convs.length === 0) {
      createNewConversation();
    } else {
      // Load conversation gần nhất
      setCurrentConversation(convs[convs.length - 1]);
    }
  }, [createNewConversation]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Focus input khi mở modal
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentConversation || isLoading) return;

    setIsLoading(true);
    const userMessage = message.trim();
    setMessage('');

    try {
      await aiChatService.sendMessage(currentConversation.id, userMessage);
      
      // Reload conversation để get tin nhắn mới
      const updatedConv = aiChatService.getConversation(currentConversation.id);
      if (updatedConv) {
        setCurrentConversation(updatedConv);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const deleteConversation = (convId: string) => {
    aiChatService.deleteConversation(convId);
    const updatedConvs = aiChatService.getConversations();
    setConversations(updatedConvs);
    
    // Nếu đang xem conversation bị xóa
    if (currentConversation?.id === convId) {
      if (updatedConvs.length > 0) {
        setCurrentConversation(updatedConvs[updatedConvs.length - 1]);
      } else {
        createNewConversation();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex overflow-hidden">
        {/* Sidebar - Danh sách conversations */}
        <div className="w-80 border-r dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🤖 Chat với AI
              </h3>
              <button
                onClick={createNewConversation}
                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                title="Cuộc trò chuyện mới"
              >
                ➕
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => setCurrentConversation(conv)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Cuộc trò chuyện {conversations.indexOf(conv) + 1}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {conv.messages.length} tin nhắn
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {aiChatService.formatDate(conv.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                    title="Xóa cuộc trò chuyện"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chatify AI Assistant
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hỏi tôi bất cứ điều gì!
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentConversation?.messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2">Chào bạn!</h3>
                <p>Tôi là AI Assistant của Chatify. Hãy hỏi tôi bất cứ điều gì bạn muốn!</p>
              </div>
            ) : (
              currentConversation?.messages.map((msg: AIMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={`text-xs mt-1 opacity-70 ${
                        msg.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {aiChatService.formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn của bạn..."
                className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
