"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { FormattedMessage } from "@/components/ui/formatted-message";

const quickQuestions = [
  "What is PM-KISAN and who gets ₹6,000?",
  "Am I eligible for Ayushman Bharat ₹5L health cover?",
  "Scholarships and training for rural youth?",
];

export function ChatFloatingButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! **I am AI Srithi**, powered by Groq Llama-3.3-70B.\n\nAsk me anything about central or state welfare schemes right here, without leaving your page!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change inside the open assistance window
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, loading, isOpen]);

  // Do not show on full chat page, login, or register
  if (pathname === "/chat" || pathname === "/login" || pathname === "/register") return null;

  async function handleSend(customText?: string) {
    const userMsg = (customText ?? input).trim();
    if (!userMsg || loading) return;

    if (!customText) setInput("");
    const updated: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await sendChatMessage(userMsg, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ **Connection Issue**: Could not reach the live intelligence server right now. Please check your backend and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! **I am AI Srithi**, powered by Groq Llama-3.3-70B.\n\nAsk me anything about central or state welfare schemes right here, without leaving your page!",
      },
    ]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Collapsed Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-full shadow-xl shadow-orange-500/35 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-orange-400/30"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
          <svg
            className="h-5 w-5 text-white transition-transform group-hover:rotate-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>Ask AI Srithi</span>
        </button>
      )}

      {/* Expanded Assistance Section Widget */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] max-h-[82vh] flex flex-col rounded-2xl bg-[#F7F6FC] border border-orange-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Tricolour Accent Stripe */}
          <div className="h-1 shrink-0 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white shrink-0 border-b border-orange-500/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-sm">
                AI
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-display text-sm font-bold text-white">
                  <span>AI Srithi Assistant</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-orange-300/90 font-medium leading-none">
                  Groq Llama-3.3-70B Live
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear History */}
              {messages.length > 1 && (
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {/* Open Full Screen */}
              <Link
                href="/chat"
                title="Open full screen chat page"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>

              {/* Close Widget */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close assistance section"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F7F6FC]"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold shadow-sm mt-0.5">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-xs font-medium"
                      : "bg-white border border-orange-500/20 text-[#1E1B4B] rounded-bl-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <FormattedMessage content={msg.content} />
                  )}
                </div>
              </div>
            ))}

            {/* Quick Questions on New Chat */}
            {messages.length === 1 && !loading && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  💡 Quick Suggestions
                </p>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="w-full text-left rounded-xl bg-white hover:bg-orange-50/80 border border-slate-200 hover:border-orange-300 px-3 py-2 text-xs font-medium text-slate-700 hover:text-orange-900 transition-all shadow-2xs flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <svg
                      className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold shadow-sm">
                  AI
                </div>
                <div className="rounded-2xl rounded-bl-xs bg-white border border-orange-500/20 px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any government scheme..."
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-300/80 bg-slate-50/50 focus:bg-white px-3.5 py-2 text-xs sm:text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:border-orange-500 focus:outline-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
            <p className="mt-1.5 text-[10px] text-center text-slate-400">
              Grounded strictly in live government scheme documentation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatFloatingButton;
