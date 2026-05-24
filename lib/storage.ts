import { ChatSession, Language } from "./types";

const SESSIONS_KEY = "gcode_sessions";
const LANGUAGE_KEY = "gcode_language";
const CURRENT_SESSION_KEY = "gcode_current_session";

export function getSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return [];
    
    const sessions = JSON.parse(stored);
    return sessions.map((session: ChatSession) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getLanguage(): Language {
  if (typeof window === "undefined") return "id";
  
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return (stored as Language) || "id";
  } catch {
    return "id";
  }
}

export function saveLanguage(language: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_KEY, language);
}

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentSessionId(sessionId: string | null): void {
  if (typeof window === "undefined") return;
  
  if (sessionId) {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createNewSession(): ChatSession {
  const now = new Date();
  return {
    id: generateId(),
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function generateSessionTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 30) return trimmed;
  return trimmed.substring(0, 30) + "...";
}
