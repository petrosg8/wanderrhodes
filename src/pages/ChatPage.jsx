// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";

const SUGGESTIONS = [
  "Where should I eat tonight in Faliraki?",
  "Show me secret beaches in Lindos",
  "Plan a day trip in Rhodes old town"
];

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const FREE_LIMIT = 5;
  const [replyCount, setReplyCount] = useState(0);
  const [blurNext, setBlurNext] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      message:
        "Hi! I’m your local Rhodes AI assistant. Ask me anything—food, sights, or secrets!",
      time: new Date(),
      blur: false
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastSent, setLastSent] = useState(0);

  const freeRemaining = Math.max(FREE_LIMIT - replyCount, 0);

  // auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sanitize = (str) => str.replace(/<\/?[^>]+(>|$)/g, "");

  const handleSend = async (overrideText) => {
    if (replyCount > FREE_LIMIT) {
      navigate("/paywall");
      return;
    }
    const now = Date.now();
    if (isTyping || now - lastSent < 2000) return;

    const text = overrideText != null ? overrideText : sanitize(input).trim();
    if (!text || text.length > 500) return;

    if (replyCount === FREE_LIMIT) setBlurNext(true);

    setInput("");
    setLastSent(now);
    setIsTyping(true);

    setMessages((m) => [
      ...m,
      { sender: "user", message: text, time: new Date(), blur: false }
    ]);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.message
      }));
      const endpoint = import.meta.env.DEV
        ? "http://localhost:3001/api/chat"
        : "/api/chat";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, prompt: text })
      });
      const { reply = "(no reply)" } = await res.json();

      setMessages((m) => [
        ...m,
        {
          sender: "ai",
          message: reply,
          time: new Date(),
          blur: blurNext
        }
      ]);
      if (blurNext) setBlurNext(false);
      setReplyCount((c) => c + 1);
    } catch {
      setMessages((m) => [
        ...m,
        {
          sender: "ai",
          message: "Sorry, something went wrong.",
          time: new Date(),
          blur: false
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-[#1a1f3d] via-[#242b50] to-transparent"
      style={{
        backgroundImage: "url('/sea-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#1a1f3d] py-3 px-4 grid grid-cols-3 items-center">
        {/* back */}
        <button
          onClick={() => navigate("/")}
          className="justify-self-start w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
        >
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <path
              d="M13.5 17L7.5 10L13.5 3"
              stroke="#F4E1C1"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* logo */}
        <div className="justify-self-center">
          <Logo className="h-8 whitespace-nowrap" />
        </div>
        {/* placeholder */}
        <div className="w-8 h-8" />
      </header>

      {/* CHAT */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
      >
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            sender={m.sender}
            message={m.message}
            time={m.time}
            blur={m.blur}
          />
        ))}
        {isTyping && <TypingBubble />}
        <div ref={chatEndRef} />
      </div>

      {/* BOTTOM: suggestions + free-pill + input */}
      <div className="sticky bottom-0 z-50 bg-gradient-to-b from-transparent to-[#242b50] px-4 pt-3 pb-safe">
        {/* suggestions (always visible if you have free prompts) */}
        {freeRemaining > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="w-full text-left rounded-full px-4 py-2 bg-white/10 text-[#F4E1C1] font-medium backdrop-blur-md shadow-sm border border-[#F4E1C120] hover:bg-[#E8D5C180] hover:text-[#242b50] transition text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* free-prompts pill */}
        <div className="flex justify-center mb-2">
          <div className="px-3 py-1 text-xs font-semibold rounded-full border border-[#F4E1C1] bg-white/10 text-[#F4E1C1] whitespace-nowrap">
            {freeRemaining} free {freeRemaining !== 1 ? "prompts" : "prompt"} left
          </div>
        </div>

        {/* input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 mb-safe"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              freeRemaining > 0 ? "Ask anything about Rhodes…" : "Upgrade to continue"
            }
            disabled={isTyping}
            className="flex-1 rounded-full px-4 py-2 bg-[#1a1f3d] text-white placeholder:text-[#888faa] outline-none shadow-inner text-sm"
          />
          <button
            type="submit"
            disabled={isTyping}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              isTyping
                ? "bg-gray-600 cursor-not-allowed text-gray-300"
                : "bg-gradient-to-r from-[#E8D5A4] to-[#CAB17B] text-[#242b50] hover:from-[#CAB17B] hover:to-[#E8D5A4]"
            }`}
          >
            {isTyping ? "Waiting…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ sender, message, time, blur }) {
  const navigate = useNavigate();
  const isUser = sender === "user";

  return (
    <div className={`relative flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-5 py-3 max-w-[75%] break-words filter ${
          blur && !isUser ? "blur-sm" : ""
        }`}
        style={{
          background: isUser
            ? "linear-gradient(135deg, #E8D5A4 30%, #CAB17B 100%)"
            : "rgba(0,0,0,0.6)",
          color: isUser ? "#242b50" : "#F4E1C1",
          borderRadius: "20px",
          fontSize: "1rem",
          fontWeight: 500,
          boxShadow: isUser
            ? "0 4px 12px rgba(0,0,0,0.15)"
            : "0 2px 8px rgba(0,0,0,0.5)"
        }}
      >
        {message}
        <div className="text-[0.7rem] text-[#888faa] text-right mt-1">
          {formatTime(time)}
        </div>
      </div>
      {blur && !isUser && (
        <button
          onClick={() => navigate("/paywall")}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-semibold rounded-lg"
        >
          Upgrade to continue
        </button>
      )}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 px-5 py-3 max-w-[60%] rounded-[20px] bg-[#1a1f3d] text-[#F4E1C1] shadow-inner">
        <span>Wander Rhodes is typing</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-[#E8D5A4] rounded-full animate-ping" />
          <div className="w-2 h-2 bg-[#E8D5A4] rounded-full animate-ping animation-delay-150" />
          <div className="w-2 h-2 bg-[#E8D5A4] rounded-full animate-ping animation-delay-300" />
        </div>
      </div>
    </div>
  );
}
