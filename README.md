# G-Code: AI Programming Tutor Chatbot

## Project Overview

**G-Code** is an intelligent education chatbot designed to help students learn programming concepts and languages. Built with Next.js, React, and the Google Gemini AI SDK, G-Code provides personalized programming education with a professional tutor persona.

### Key Features

✨ **Educational Focus**
- Specialized in programming education (Python, JavaScript, Java, etc.)
- Professional tutor persona with friendly communication style
- Explains complex concepts in easy-to-understand ways

🌍 **Bilingual Support**
- Full UI available in Indonesian and English
- Seamless language switching
- Contextual responses in selected language

💾 **Chat Memory & Persistence**
- Stores conversation history locally using localStorage
- Maintains up to 15 recent messages for context
- Automatic chat session management

🎨 **Modern Interface**
- Clean dark theme with teal/cyan accents
- Responsive design for mobile and desktop
- Real-time message streaming
- Beautiful syntax highlighting for code

🛠️ **Technical Architecture**
- Built with Next.js 16 and React 19
- Google Gemini AI SDK for LLM integration
- Streaming SSE responses for real-time chat
- TypeScript for type safety
- shadcn/ui components for consistent design

## Tech Stack

- **Frontend Framework**: Next.js 16.2.6 with App Router
- **UI Library**: React 19 with shadcn/ui
- **AI Integration**: Google Gemini AI SDK 6 (supports Gemini via AI Gateway)
- **Styling**: Tailwind CSS v4
- **Components**: Lucide React icons
- **Data Persistence**: Browser localStorage
- **Language Support**: next-intl (i18n)
- **Type Safety**: TypeScript

## Project Structure

```
app/
├── api/
│   └── chat/
│       └── route.ts          # Chat streaming API endpoint
├── layout.tsx                # Root layout with theme
├── globals.css               # Tailwind config & theme colors
└── page.tsx                  # Main page

components/
├── chat-interface.tsx        # Main chat component
├── message-content.tsx       # Message renderer with markdown
└── ui/                       # shadcn components

lib/
├── types.ts                  # TypeScript types
├── prompt.ts                 # System prompts & welcome messages
├── storage.ts                # localStorage utilities
└── i18n.ts                   # Translations for Indonesian & English
```

## Features Breakdown

### 1. **Bilingual Interface**
- **Indonesian (id)** - Default language
- **English (en)** - Available with language toggle
- Toggle button in sidebar for easy switching
- All UI text, prompts, and responses adapt to selected language

### 2. **Chat Sessions**
- Create new chat sessions with the "+ Chat Baru" button
- View conversation history in left sidebar
- Click to switch between sessions
- Delete individual sessions with the trash icon
- Session titles auto-generated from first user message

### 3. **Professional Tutor Persona**
- Responds as G-Code, an AI programming tutor
- Friendly but formal communication style
- Provides structured, educational responses
- Specializes in:
  - Programming languages (Python, JavaScript, Java, etc.)
  - Programming concepts (OOP, algorithms, data structures)
  - Debugging and error handling
  - Best practices and clean code
  - Project ideas and implementation

### 4. **Real-time Streaming**
- Messages stream in real-time for better UX
- Loading animation while waiting for responses
- Smooth message transitions

### 5. **Message Features**
- User messages displayed in cyan bubble (right-aligned)
- Bot messages in card with border (left-aligned)
- Avatar badges for easy visual distinction
- Markdown rendering with syntax highlighting

### 6. **Data Persistence**
- All conversations stored in browser localStorage
- Automatic saving on every message
- Session restoration on page reload
- No data loss during browser session

## UI Screenshots

The chatbot features:
- **Welcome screen** with bot introduction and capabilities
- **Sidebar** with chat history and language switcher
- **Dark theme** with code-friendly color palette
- **Responsive layout** adapting to all screen sizes

## Usage

### Installation

```bash
# Clone repository
git clone <your-repo-url>

# Install dependencies
pnpm install

# Run dev server
pnpm dev
```

Visit `http://localhost:3000` to use the chatbot.

### Using the Chatbot

1. **Start Conversation**: Type your programming question in the input field
2. **Send Message**: Click the send button or press Shift+Enter
3. **Switch Language**: Click "Bahasa" button in sidebar to toggle Indonesian/English
4. **New Chat**: Click "+ Chat Baru" to start fresh conversation
5. **Review History**: Click past conversations in sidebar to view them

## API Integration

The chatbot includes a demo response system that works without requiring external API keys. For production use with real AI responses:

1. **Setup Google Gemini AI Gateway**:
   ```bash
   # Add environment variable
   export AI_GATEWAY_API_KEY=<your-key>
   ```

2. **Available Models**:
   - Google Gemini 2.0 Flash (via Google AI Studio)

## Deliverables for Class

✅ **Functional Chatbot**
- Fully working programming education chatbot
- Bilingual support (Indonesian & English)
- Chat memory and persistence

✅ **Repository**
- GitHub repository with complete source code
- Well-documented code structure
- Ready for deployment

✅ **Screenshots**
- Home/welcome screen
- Chat with responses
- Language switching demonstration
- Sidebar session management

## Future Enhancements

- Real LLM integration (Gemini, GPT, Claude)
- Code snippet execution environment
- Quiz and assessment features
- Resource recommendations
- User accounts and cloud sync
- Export conversations to PDF
- Share chat sessions

## License

This project is created for educational purposes as part of a class assignment.

## Support

For issues or questions about the chatbot, please refer to the project repository or create an issue in GitHub.

---

**Created with ❤️ for programming learners everywhere**
