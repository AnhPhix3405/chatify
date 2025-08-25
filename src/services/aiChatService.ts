export interface AIMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class AIChatService {
  private readonly STORAGE_KEY = 'ai_conversations';

  // Lấy tất cả cuộc trò chuyện với AI từ localStorage
  getConversations(): AIConversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading AI conversations:', error);
      return [];
    }
  }

  // Lấy cuộc trò chuyện theo ID
  getConversation(conversationId: string): AIConversation | null {
    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === conversationId) || null;
  }

  // Tạo cuộc trò chuyện mới
  createConversation(): AIConversation {
    const newConversation: AIConversation = {
      id: `ai_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const conversations = this.getConversations();
    conversations.push(newConversation);
    this.saveConversations(conversations);

    return newConversation;
  }

  // Gửi tin nhắn tới AI và nhận phản hồi
  async sendMessage(conversationId: string, userMessage: string): Promise<AIMessage> {
    try {
      // Thêm tin nhắn của user vào cuộc trò chuyện
      const userMsg: AIMessage = {
        id: `msg_${Date.now()}_user`,
        content: userMessage,
        type: 'user',
        timestamp: new Date()
      };

      this.addMessageToConversation(conversationId, userMsg);

      // Gọi API để nhận phản hồi từ AI
      const aiResponse = await this.callGeminiAPI(userMessage);
      
      // Thêm phản hồi của AI vào cuộc trò chuyện
      const aiMsg: AIMessage = {
        id: `msg_${Date.now()}_ai`,
        content: aiResponse,
        type: 'ai',
        timestamp: new Date()
      };

      this.addMessageToConversation(conversationId, aiMsg);

      return aiMsg;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Trả về tin nhắn lỗi
      const errorMsg: AIMessage = {
        id: `msg_${Date.now()}_ai_error`,
        content: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.',
        type: 'ai',
        timestamp: new Date()
      };

      this.addMessageToConversation(conversationId, errorMsg);
      return errorMsg;
    }
  }

  // Gọi Gemini API
  private async callGeminiAPI(message: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:3001/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.content) {
        return data.data.content;
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  // Thêm tin nhắn vào cuộc trò chuyện
  private addMessageToConversation(conversationId: string, message: AIMessage): void {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (convIndex !== -1) {
      conversations[convIndex].messages.push(message);
      conversations[convIndex].updatedAt = new Date();
      this.saveConversations(conversations);
    }
  }

  // Xóa cuộc trò chuyện
  deleteConversation(conversationId: string): void {
    const conversations = this.getConversations();
    const filtered = conversations.filter(conv => conv.id !== conversationId);
    this.saveConversations(filtered);
  }

  // Xóa tất cả cuộc trò chuyện với AI (khi logout)
  clearAllConversations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Lưu cuộc trò chuyện vào localStorage
  private saveConversations(conversations: AIConversation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving AI conversations:', error);
    }
  }

  // Cập nhật tin nhắn cuối cùng
  getLastMessage(conversationId: string): AIMessage | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation || conversation.messages.length === 0) {
      return null;
    }
    return conversation.messages[conversation.messages.length - 1];
  }

  // Đếm số tin nhắn trong cuộc trò chuyện
  getMessageCount(conversationId: string): number {
    const conversation = this.getConversation(conversationId);
    return conversation ? conversation.messages.length : 0;
  }

  // Format thời gian hiển thị
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format ngày hiển thị
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

export const aiChatService = new AIChatService();
