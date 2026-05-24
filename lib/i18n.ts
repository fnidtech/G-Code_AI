import { Language } from "./types";

type TranslationKeys = {
  // Header
  appName: string;
  tagline: string;
  
  // Sidebar
  newChat: string;
  chatHistory: string;
  noChats: string;
  deleteChat: string;
  
  // Chat
  placeholder: string;
  send: string;
  thinking: string;
  copyCode: string;
  copied: string;
  
  // Language
  language: string;
  indonesian: string;
  english: string;
  
  // Welcome
  welcomeTitle: string;
  welcomeSubtitle: string;
  
  // Errors
  errorOccurred: string;
  tryAgain: string;
};

const translations: Record<Language, TranslationKeys> = {
  id: {
    appName: "G-Code",
    tagline: "Tutor Pemrograman AI",
    
    newChat: "Chat Baru",
    chatHistory: "Riwayat Chat",
    noChats: "Belum ada riwayat chat",
    deleteChat: "Hapus",
    
    placeholder: "Ketik pertanyaan kamu di sini...",
    send: "Kirim",
    thinking: "G-Code sedang berpikir...",
    copyCode: "Salin kode",
    copied: "Tersalin!",
    
    language: "Bahasa",
    indonesian: "Indonesia",
    english: "English",
    
    welcomeTitle: "Selamat datang di G-Code!",
    welcomeSubtitle: "Tutor pemrogramanmu yang siap membantu kapan saja",
    
    errorOccurred: "Terjadi kesalahan",
    tryAgain: "Coba lagi",
  },
  en: {
    appName: "G-Code",
    tagline: "AI Programming Tutor",
    
    newChat: "New Chat",
    chatHistory: "Chat History",
    noChats: "No chat history yet",
    deleteChat: "Delete",
    
    placeholder: "Type your question here...",
    send: "Send",
    thinking: "G-Code is thinking...",
    copyCode: "Copy code",
    copied: "Copied!",
    
    language: "Language",
    indonesian: "Indonesia",
    english: "English",
    
    welcomeTitle: "Welcome to G-Code!",
    welcomeSubtitle: "Your programming tutor ready to help anytime",
    
    errorOccurred: "An error occurred",
    tryAgain: "Try again",
  },
};

export function t(key: keyof TranslationKeys, language: Language): string {
  return translations[language][key];
}

export function useTranslations(language: Language) {
  return (key: keyof TranslationKeys) => t(key, language);
}
