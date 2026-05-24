export interface MessagePart {
  type: 'text';
  text: string;
}

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type Language = "id" | "en";

export interface AppState {
  language: Language;
  sessions: ChatSession[];
  currentSessionId: string | null;
}