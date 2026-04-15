"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";

const QUICK_SUGGESTIONS = [
  "How do I find the best funders for my agency?",
  "What makes a strong grant application?",
  "How does the match score work?",
  "Help me write a problem statement",
  "What federal grants are available for police?",
  "How do I follow up after submitting?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AshleenChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Ashleen 👋 Your AI grant writing expert. I can help you find the right funders, write stronger applications, and increase your win rate. What do you need help with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agencyContext, setAgencyContext] = useState<Record<string, unknown> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !agencyContext) {
      api.get("/organizations").then((res) => {
        const orgs = res.data?.data;
        if (Array.isArray(orgs) && orgs.length > 0) setAgencyContext(orgs[0]);
      }).catch(() => {});
    }
  }, [isOpen, agencyContext]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || isTyping) return;

    const userMessage: Message = { role: "user", content: msgText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    const contextMessages = newMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    let systemSuffix = "";
    if (agencyContext) {
      const types = (agencyContext.agencyTypes as string[] | undefined)?.filter(Boolean) ?? [];
      const typeLine = types.length ? types.join(", ") : "—";
      const loc = (agencyContext.location as string)?.trim() || "—";
      const problems = ((agencyContext.mainProblems as string[]) || []).join(", ") || "—";
      const priorities = ((agencyContext.fundingPriorities as string[]) || []).join(", ") || "—";
      systemSuffix = `\n\nCURRENT USER CONTEXT:\nAgency: ${(agencyContext.name as string) || "Unknown"}\nAgency types: ${typeLine}\nLocation: ${loc}\nMain problems: ${problems}\nFunding priorities: ${priorities}`;
    }

    try {
      const res = await api.post("/ashleen/chat", {
        messages: contextMessages,
        systemSuffix,
      });
      const reply = res.data.data?.reply ?? "I'm having trouble connecting right now. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Hi again! I'm Ashleen 👋 What can I help you with?" }]);
  };

  const showSuggestions = messages.length === 1;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="Chat with Ashleen"
        className="fixed bottom-7 right-4 z-[10000] flex h-[60px] w-[60px] items-center justify-center rounded-full border-0 shadow-[0_4px_20px_rgba(229,57,53,0.45)] transition-transform duration-200"
        style={{
          background: "linear-gradient(135deg,#ef3e34 0%,#b71c1c 100%)",
          transform: isOpen ? "scale(0.92)" : "scale(1)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = isOpen ? "scale(0.92)" : "scale(1)"; }}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <span style={{ color: "white", fontWeight: 700, fontSize: 22, fontFamily: "Oswald, sans-serif", letterSpacing: "-1px" }}>A</span>
        )}
      </button>

      {/* Online dot when closed */}
      {!isOpen && (
        <span
          className="fixed z-[10001] h-[10px] w-[10px] rounded-full border-2 border-white bg-green-500"
          style={{ bottom: 78, right: 20 }}
        />
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-[#f0f0f0] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
          style={{
            bottom: 100,
            right: 16,
            width: "min(380px, calc(100vw - 32px))",
            height: "min(560px, calc(100dvh - 120px))",
            fontFamily: "Montserrat, Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center gap-3 px-4 py-3.5"
            style={{ background: "linear-gradient(135deg,#ef3e34 0%,#b71c1c 100%)" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <span className="text-base font-bold text-white" style={{ fontFamily: "Oswald,sans-serif" }}>A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight text-white" style={{ fontFamily: "Oswald,sans-serif", letterSpacing: "0.5px" }}>ASHLEEN</p>
              <p className="text-xs text-white/80">AI Grant Writing Expert</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs text-white/80">Online</span>
              <button
                onClick={clearChat}
                className="ml-1 rounded-md bg-white/15 px-2 py-1 text-xs text-white hover:bg-white/25"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Agency context banner */}
          {agencyContext && (
            <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-1.5 text-xs text-red-700 flex items-center gap-1.5">
              <span>📍</span>
              <span>
                {(agencyContext.name as string)}
                {agencyContext.location ? ` · ${agencyContext.location as string}` : ""}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ef3e34] mt-0.5">
                    <span className="text-xs font-bold text-white">A</span>
                  </div>
                )}
                <div
                  className={`max-w-[78%] whitespace-pre-wrap break-words text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-[16px_4px_16px_16px] bg-[#ef3e34] px-3.5 py-2.5 text-white"
                      : "rounded-[4px_16px_16px_16px] bg-[#f5f5f5] px-3.5 py-2.5 text-[#222]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Quick suggestions */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="rounded-full border border-[#ef3e34] bg-white px-3 py-1 text-xs text-[#ef3e34] hover:bg-red-50 transition-colors text-left leading-relaxed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ef3e34]">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
                <div className="flex items-center gap-1 rounded-[4px_16px_16px_16px] bg-[#f5f5f5] px-4 py-3">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="inline-block h-[7px] w-[7px] rounded-full bg-[#bbb]"
                      style={{ animation: `ashleenBounce 1.2s ease-in-out ${delay}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer branding */}
          <p className="shrink-0 py-1 text-center text-[10.5px] text-[#bbb]">
            ⚡ Powered by Ashleen AI · Red Dog Grant Intelligence
          </p>

          {/* Input */}
          <div className="flex shrink-0 items-end gap-2 border-t border-[#f0f0f0] bg-white px-3 pb-3.5 pt-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 100) + "px";
              }}
              placeholder="Ask Ashleen anything about grants..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#e0e0e0] px-3 py-2 text-sm outline-none transition-colors focus:border-[#ef3e34]"
              style={{ maxHeight: 100, overflowY: "auto", lineHeight: 1.5 }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 transition-colors disabled:cursor-not-allowed"
              style={{ background: input.trim() && !isTyping ? "#ef3e34" : "#e0e0e0" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ashleenBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
