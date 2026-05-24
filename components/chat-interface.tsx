"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Trash2, Menu, X, Globe, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatSession, Language, UIMessage } from "@/lib/types";
import { t } from "@/lib/i18n";
import { getWelcomeMessage } from "@/lib/prompt";
import {
  getSessions,
  saveSessions,
  getLanguage,
  saveLanguage,
  getCurrentSessionId,
  saveCurrentSessionId,
  createNewSession,
  generateSessionTitle,
  generateId,
} from "@/lib/storage";
import { MessageContent } from "./message-content";

export function ChatInterface() {
  const [language, setLanguage] = useState<Language>("id");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage
  useEffect(() => {
    const storedLanguage = getLanguage();
    const storedSessions = getSessions();
    const storedCurrentSessionId = getCurrentSessionId();

    setLanguage(storedLanguage);
    setSessions(storedSessions);

    if (storedCurrentSessionId && storedSessions.find((s) => s.id === storedCurrentSessionId)) {
      setCurrentSessionId(storedCurrentSessionId);
      const session = storedSessions.find((s) => s.id === storedCurrentSessionId);
      if (session && session.messages.length > 0) {
        setMessages(
          session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
          }))
        );
      }
    } else if (storedSessions.length > 0) {
      const latestSession = storedSessions[0];
      setCurrentSessionId(latestSession.id);
      if (latestSession.messages.length > 0) {
        setMessages(
          latestSession.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
          }))
        );
      }
    } else {
      // Create first session
      const newSession = createNewSession();
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      saveSessions([newSession]);
      saveCurrentSessionId(newSession.id);
    }

    setIsInitialized(true);
  }, [setMessages]);

  // Save messages to current session
  useEffect(() => {
    if (!isInitialized || !currentSessionId || messages.length === 0) return;

    const updatedSessions = sessions.map((session) => {
      if (session.id === currentSessionId) {
        const newMessages = messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.parts?.filter((p) => p.type === "text").map((p) => (p as { type: "text"; text: string }).text).join("") || "",
          timestamp: new Date(),
        }));

        // Generate title from first user message if not set
        let title = session.title;
        if (title === "New Chat" && newMessages.length > 0) {
          const firstUserMessage = newMessages.find((m) => m.role === "user");
          if (firstUserMessage) {
            title = generateSessionTitle(firstUserMessage.content);
          }
        }

        return {
          ...session,
          title,
          messages: newMessages,
          updatedAt: new Date(),
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  }, [messages, currentSessionId, isInitialized]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save language preference
  useEffect(() => {
    if (isInitialized) {
      saveLanguage(language);
    }
  }, [language, isInitialized]);

  // Save current session ID
  useEffect(() => {
    if (isInitialized && currentSessionId) {
      saveCurrentSessionId(currentSessionId);
    }
  }, [currentSessionId, isInitialized]);

  const handleNewChat = () => {
    const newSession = createNewSession();
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    saveSessions(updatedSessions);
    setSidebarOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      if (session.messages.length > 0) {
        setMessages(
          session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
          }))
        );
      } else {
        setMessages([]);
      }
    }
    setSidebarOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        handleSelectSession(updatedSessions[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userText = input;
    setInput("");

    // Add user message
    const userMsg: UIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", text: userText }],
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      console.log("[CLIENT] Fetching chat response...");
      // Fetch response from API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      const assistantMsgId = `msg-${Date.now() + 1}`;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[CLIENT] Stream finished.");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === "[DONE]") {
              console.log("[CLIENT] Received [DONE] signal.");
              continue;
            }

            try {
              const chunk = JSON.parse(jsonStr);
              if (chunk.type === "text-delta" && chunk.delta) {
                console.log(`[CLIENT] Received text-delta: ${chunk.delta.substring(0, 50)}...`);
                fullText += chunk.delta;

                // Add or update assistant message
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === assistantMsgId);
                  if (!exists) {
                    return [
                      ...prev,
                      {
                        id: assistantMsgId,
                        role: "assistant",
                        parts: [{ type: "text", text: fullText }],
                      },
                    ];
                  } else {
                    return prev.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            parts: [{ type: "text", text: fullText }],
                          }
                        : m
                    );
                  }
                });
              }
            } catch (e) {
              console.error("[CLIENT] JSON parse error on chunk:", e, jsonStr);
              // Ignore JSON parse errors from malformed SSE
            }
          }
        }
      }
    } catch (error) {
      console.error("[CLIENT] Chat error during fetch:", error);
      const errorMsg: UIMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Sorry, there was an error processing your request. Please try again.",
          },
        ],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      console.log("[CLIENT] Fetch process completed.");
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "id" ? "en" : "id"));
  };

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
<aside
        className={`sticky left-0 top-0 z-50 flex w-72 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="size-9 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">{t("appName", language)}</h1>
              <p className="text-xs text-muted-foreground">{t("tagline", language)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="size-4" />
            {t("newChat", language)}
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-hidden">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">{t("chatHistory", language)}</p>
          </div>
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-1 px-3">
              {sessions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("noChats", language)}
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      currentSessionId === session.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <span className="truncate">{session.title}</span>
                    <button
                      className="size-6 rounded p-0 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      type="button"
                      aria-label="Delete session"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Language Toggle */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={toggleLanguage}
          >
            <Globe className="size-4" />
            <span>{t("language", language)}:</span>
            <span className="font-medium">{language === "id" ? "Indonesia" : "English"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="size-8 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                G
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium">{t("appName", language)}</h2>
              <p className="text-xs text-muted-foreground">{t("tagline", language)}</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-transparent box-content">
  <img src="/logo.png" alt="Logo" className="size-16 text-primary" />
</div>
                <h2 className="mb-2 text-xl font-semibold">{t("welcomeTitle", language)}</h2>
                <p className="mb-6 max-w-md text-muted-foreground">{t("welcomeSubtitle", language)}</p>
                <div className="rounded-lg border border-border bg-card p-4 text-left">
                  <MessageContent content={getWelcomeMessage(language)} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  const content = message.parts
                    ?.filter((p) => p.type === "text")
                    .map((p) => (p as { type: "text"; text: string }).text)
                    .join("") || "";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="size-8 shrink-0 bg-primary">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                            G
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        <MessageContent content={content} isUser={message.role === "user"} />
                      </div>
                      {message.role === "user" && (
                        <Avatar className="size-8 shrink-0 bg-secondary">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="size-8 shrink-0 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        G
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                      <div className="flex gap-1">
                        <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <span className="size-2 animate-bounce rounded-full bg-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{t("thinking", language)}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={t("placeholder", language)}
                disabled={isLoading}
                rows={1}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
