"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { FormattedMessage } from "@/components/ui/formatted-message";

const starterCategories = [
  {
    category: "🌾 Agriculture & Farmers",
    queries: [
      "What is PM-KISAN and who is eligible for the ₹6,000 yearly benefit?",
      "How do I apply for Pradhan Mantri Fasal Bima Yojana (PMFBY)?",
    ],
  },
  {
    category: "🏥 Health & Insurance",
    queries: [
      "Am I eligible for Ayushman Bharat PM-JAY ₹5 lakh health coverage?",
      "What documents are required for Deen Dayal Swasthya Seva Yojana?",
    ],
  },
  {
    category: "🎓 Education & Youth",
    queries: [
      "Can I get scholarships for higher education under OBC or SC schemes?",
      "What skills and training programs are available for rural unemployed youth?",
    ],
  },
  {
    category: "👩 Women & Child Welfare",
    queries: [
      "What is Pradhan Mantri Matru Vandana Yojana (PMMVY) maternity benefit?",
      "How does the Amma Two Wheeler Scheme assist working women?",
    ],
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! **I am AI Srithi**, powered by Groq Llama-3.3-70B.\n\nAsk me anything about central or state welfare schemes — exact eligibility rules, required documents, application procedures, or benefit amounts. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, loading]);

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
            "⚠️ **Connection Issue**: Could not reach the live intelligence server right now. Please verify your backend is active and try sending your request again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleClearChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! **I am AI Srithi**, powered by Groq Llama-3.3-70B.\n\nAsk me anything about central or state welfare schemes — exact eligibility rules, required documents, application procedures, or benefit amounts. How can I assist you today?",
      },
    ]);
  }

  return (
    <div className="flex h-[calc(100vh-65px)] max-h-[calc(100vh-65px)] flex-col bg-gradient-to-b from-[#F7F6FC] to-[#F3F1FA] overflow-hidden">
      {/* Hero Header Banner — Fixed at top */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white border-b border-orange-500/30 px-4 py-4 sm:px-8 sm:py-5 shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-500/40 px-3 py-0.5 text-[11px] font-bold text-orange-300 backdrop-blur-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span>AI Srithi • Groq Llama-3.3-70B Intelligence</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welfare Scheme Q&A Advisor
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed hidden sm:block">
              Real-time advice grounded strictly in live government scheme definitions. Ask about eligibility criteria, document vault matching, or application deadlines.
            </p>
          </div>

          {messages.length > 1 && (
            <Button
              onClick={handleClearChat}
              variant="outline"
              size="sm"
              className="self-start sm:self-center bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Conversation</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Conversation Container — Scrollable internally */}
      <main
        ref={scrollContainerRef}
        className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col overflow-y-auto px-4 sm:px-6 py-6"
      >
        {/* Starter Category Chips — Shown on new chat */}
        {messages.length === 1 && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Popular Scheme Categories & Sample Queries</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {starterCategories.map((group, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-orange-200/60 bg-white/90 p-4 shadow-sm hover:shadow-md transition-all space-y-2.5 group"
                >
                  <h3 className="font-bold text-sm text-[#1E1B4B] flex items-center gap-1.5">
                    {group.category}
                  </h3>
                  <div className="space-y-1.5">
                    {group.queries.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSend(q)}
                        className="w-full text-left rounded-xl bg-orange-50/50 hover:bg-orange-500 hover:text-white border border-orange-100/80 px-3 py-2 text-xs font-medium text-slate-700 transition-all flex items-center justify-between gap-2 group/btn"
                      >
                        <span className="line-clamp-2">{q}</span>
                        <svg className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubble List */}
        <div className="flex-1 space-y-6 pb-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`w-full max-w-[92%] sm:max-w-[82%] rounded-3xl transition-all ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[#1E1B4B] to-[#4338CA] text-white px-5 py-4 shadow-md shadow-navy-900/15 ml-auto"
                    : "bg-white border border-slate-200/90 text-[#1E1B4B] px-5 sm:px-6 py-5 shadow-sm rounded-tl-sm"
                }`}
              >
                {/* Assistant Card Header */}
                {msg.role === "assistant" && (
                  <div className="mb-3.5 pb-3 border-b border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500 text-white shadow-2xs">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1E1B4B] block">AI Srithi Advisor</span>
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Verified against Live Vault
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Body */}
                {msg.role === "assistant" ? (
                  <FormattedMessage content={msg.content} />
                ) : (
                  <p className="text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Loading Skeleton Card */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-full max-w-[85%] sm:max-w-[70%] rounded-3xl bg-white border border-slate-200/90 px-6 py-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-6 w-6 rounded-lg bg-orange-500/20 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 animate-pulse">
                    AI Srithi is analyzing scheme databases...
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded-md w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded-md w-full animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded-md w-5/6 animate-pulse" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Modern Fixed Input Bar right at bottom of container */}
      <div className="shrink-0 border-t border-orange-200/60 bg-white/95 backdrop-blur-md shadow-[0_-4px_25px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Srithi about any scheme eligibility, document checklist, or steps..."
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-5 py-3 text-sm font-medium text-[#1E1B4B] placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/15 transition-all"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-5.5 shadow-md shadow-orange-500/25 transition-all flex items-center gap-2"
            >
              <span>Send</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Answers generated strictly from live government datasets. Always verify deadlines on official portals.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
