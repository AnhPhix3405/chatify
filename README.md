# 💬 Chatify - Modern Real-time Chat Application

A feature-rich, modern chat application built with React, TypeScript, Node.js, and Socket.io. Chatify provides seamless real-time messaging with AI integration for an enhanced communication experience.

## 🌐 Live Demo

- **Frontend:** [https://chatify-neon-five.vercel.app/](https://chatify-neon-five.vercel.app/)
- **Backend API:** [https://chatify-api-2g1a.onrender.com/](https://chatify-api-2g1a.onrender.com/)

## ✨ Features

### 🔥 Core Features
- **Real-time Messaging** - Instant message delivery with Socket.io
- **User Authentication** - Secure login/register system
- **Direct Chat** - 1-on-1 private conversations
- **AI Chat Integration** - Chat with AI assistant powered by Google Gemini
- **Dark/Light Mode** - Toggle between themes
- **File Upload** - Share images and files
- **Message Status** - Read receipts and delivery status
- **Responsive Design** - Mobile-first approach

### 🤖 AI Features
- **AI Assistant** - Powered by Google Gemini API
- **Conversation Management** - Multiple AI chat sessions
- **Local Storage** - AI conversations persist locally
- **Smart Responses** - Context-aware AI replies

### 📱 Mobile Experience
- **Progressive Web App** - Install on mobile devices
- **Touch-friendly Interface** - Optimized for mobile interaction
- **Offline Support** - Basic functionality without internet
- **Slide Navigation** - Intuitive mobile navigation patterns

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Socket.io Client** for real-time communication
- **Vite** for fast development and building

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Socket.io** for WebSocket connections
- **JWT** for authentication
- **Multer** for file uploads
- **Google Gemini API** for AI integration

### Infrastructure
- **Vercel** for frontend deployment
- **Render** for backend hosting
- **Cloudinary** for file storage

## 📸 Screenshots

### 🏠 Main Chat Interface
*Add screenshot of the main chat interface showing the sidebar with conversations and active chat area*

### 🤖 AI Chat
*Add screenshot of the AI chat modal with conversation history and modern chat bubbles*

### 📱 Mobile View
*Add screenshot of mobile responsive design showing the hamburger menu and mobile-optimized chat interface*

### 🌙 Dark Mode
*Add screenshot showcasing the dark theme with proper contrast and modern design*

### 💬 Chat Features
*Add screenshot highlighting features like file sharing, message status, and user profiles*

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AnhPhix3405/chatify.git
   cd chatify
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd src/api
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in the backend directory:
   ```env
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

5. **Database Setup**
   ```bash
   # Run database migrations
   npm run migrate
   ```

6. **Start Development Servers**
   
   Backend:
   ```bash
   cd src/api
   npm run dev
   ```
   
   Frontend:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
chatify/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Authentication components
│   │   ├── AIChat.tsx      # AI chat modal
│   │   ├── ChatArea.tsx    # Main chat interface
│   │   ├── Header.tsx      # App header
│   │   └── Sidebar.tsx     # Chat sidebar
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   └── api/                # Backend server
│       ├── controllers/    # Route controllers
│       ├── models/         # Database models
│       ├── routes/         # API routes
│       └── middleware/     # Express middleware
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Chat
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/messages` - Send message

### AI
- `POST /api/ai/chat` - Chat with AI assistant

### File Upload
- `POST /api/upload` - Upload files

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**AnhPhix3405**
- GitHub: [@AnhPhix3405](https://github.com/AnhPhix3405)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Socket.io](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Google Gemini](https://ai.google.dev/) - AI integration
- [Lucide](https://lucide.dev/) - Icon library
