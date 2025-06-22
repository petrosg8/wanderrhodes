// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/ui/Logo";
import LocationCard from "../components/LocationCard";
import { Copy, BookMarked } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { isPaid } from "@/utils/auth";
import { getSavedPlans } from '@/utils/plans';

const SUGGESTIONS = [
  "Where should I eat tonight in Faliraki?",
  "Show me secret beaches in Lindos",
  "Plan a day trip in Rhodes old town"
];

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const parseAiResponse = (reply, structuredData, blur) => {
  const newMessages = [];
  const locations = structuredData?.locations || [];

  if (!locations.length) {
    if (reply.trim()) {
      newMessages.push({
        sender: 'ai',
        type: 'text',
        message: reply.trim(),
        time: new Date(),
        blur: blur,
      });
    }
    return newMessages;
  }

  const textParts = reply.split('|||LOCATION|||');

  textParts.forEach((text, i) => {
    const trimmedText = text.trim();
    if (trimmedText) {
      newMessages.push({
        sender: 'ai',
        type: 'text',
        message: trimmedText,
        time: new Date(),
        blur: blur,
      });
    }
    if (locations[i]) {
      newMessages.push({
        sender: 'ai',
        type: 'location',
        locationData: locations[i],
        time: new Date(),
        blur: blur,
      });
    }
  });

  return newMessages;
};

export default function ChatPage() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const FREE_LIMIT = 5;

  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');

  // Initialize replyCount based on how many AI responses already exist (useful when loading from a saved plan)
  const initialMessages = (() => {
    if (typeof window === 'undefined') return [];

    if (planId) {
      try {
        const plans = getSavedPlans();
        const plan = plans.find((p) => String(p.timestamp) === String(planId));
        if (plan && plan.chatHistory) {
          return plan.chatHistory.map((m) => ({ ...m, time: new Date(m.time) }));
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem('wr_chat_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.map((m) => ({ ...m, time: new Date(m.time) }));
      }
    } catch {}
    return [
      {
        sender: 'ai',
        type: 'text',
        message: "Hi! I'm your local Rhodes AI assistant. Ask me anything—food, sights, or secrets!",
        time: new Date(),
        blur: false,
      },
    ];
  })();

  const [messages, setMessages] = useState(initialMessages);

  const [replyCount, setReplyCount] = useState(() => {
    const count = initialMessages.filter((m) => m.sender === 'ai').length;
    return Math.max(0, count - 1); // exclude greeting if present
  });

  const [blurNext, setBlurNext] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [planConfig, setPlanConfig] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('wr_plan_config');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planSaved, setPlanSaved] = useState(false);

  const freeRemaining = Math.max(FREE_LIMIT - replyCount, 0);

  // auto-scroll
  useEffect(() => {
    // Attempt to detect user's geolocation once
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          if (err.code === err.PERMISSION_DENIED) {
            setLocationDenied(true);
            toast({
              title: "Location permission denied",
              description: "We'll plan your trip starting from the island center. You can specify a different start point in chat.",
              variant: "destructive",
            });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const target = e.target;
      
      // Don't focus if the user is already in an input, textarea, or contentEditable element.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Don't focus if a modifier key is pressed.
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Focus on character key presses, but ignore special keys like Enter, Tab, etc.
      if (e.key.length === 1) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

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
      { sender: "user", type: "text", message: text, time: new Date(), blur: false }
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
        body: JSON.stringify({ history, prompt: text, userLocation })
      });
      const { reply = "(no reply)", structuredData = null } = await res.json();

      const newAiMessages = parseAiResponse(reply, structuredData, blurNext);

      if (newAiMessages.length > 0) {
        setMessages((m) => [...m, ...newAiMessages]);
      } else {
        setMessages((m) => [
          ...m,
          {
            sender: "ai",
            type: "text",
            message: reply || "Sorry, I had trouble generating a response.",
            time: new Date(),
            blur: blurNext
          }
        ]);
      }

      if (blurNext) setBlurNext(false);
      setReplyCount((c) => c + 1);

      // If AI returned locations, store as currentPlan
      if (structuredData?.locations?.length > 0) {
        setCurrentPlan({
          title: text.substring(0, 60),
          locations: structuredData.locations,
          timestamp: Date.now(),
        });
        setPlanSaved(false);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          sender: "ai",
          type: "text",
          message: "Sorry, something went wrong.",
          time: new Date(),
          blur: false
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Copies the full conversation (user & AI messages) to the clipboard
  const handleCopyTranscript = () => {
    const transcriptText = messages
      .map((m) => {
        if (m.type === "location") {
          const name = m.locationData?.name || "Location";
          return `${m.sender === "user" ? "You" : "Rhodes"} shared: ${name}`;
        }
        return `${m.sender === "user" ? "You" : "Rhodes"}: ${m.message}`;
      })
      .join("\n\n");

    navigator.clipboard
      .writeText(transcriptText)
      .then(() => {
        toast({ title: "Transcript copied to clipboard" });
      })
      .catch(() => {
        toast({ title: "Failed to copy transcript", variant: "destructive" });
      });
  };

  // Persist messages on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('wr_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // If user hasn't configured the plan yet, show configuration overlay
  if (!planConfig) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1f3d] via-[#242b50] to-transparent p-6 text-[#F4E1C1] relative">
        <Logo className="h-10 mb-6" />

        <h2 className="text-2xl font-semibold mb-4">Plan preferences</h2>

        <PlanConfigurator
          onSubmit={(cfg) => {
            setPlanConfig(cfg);
            try {
              localStorage.setItem('wr_plan_config', JSON.stringify(cfg));
            } catch {}
            // Compose a single-line instruction for the assistant
            let intro = `Here are my preferences: pace: ${cfg.pace}, water activities: ${cfg.waterActivities}, transport: ${cfg.transport}, start time: ${cfg.startTime}.`;
            if (cfg.extraDetails && cfg.extraDetails.trim()) {
              intro += ` Additional details: ${cfg.extraDetails.trim()}.`;
            }
            intro += " Please tailor the plan accordingly.";
            handleSend(intro); // automatically send
          }}
        />
        <Toaster />
      </div>
    );
  }

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
      <header className="sticky top-0 z-50 bg-[#1a1f3d] py-3 px-4 flex items-center justify-between">
        {/* left group: back & logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
            title="Back"
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
          <Logo className="h-6 whitespace-nowrap" />
        </div>

        {/* right buttons */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigate('/plans')}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
            title="My Plans"
          >
            <BookMarked size={18} color="#F4E1C1" />
          </button>
          <button
            onClick={handleCopyTranscript}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
            title="Copy transcript"
          >
            <Copy size={18} color="#F4E1C1" />
          </button>
        </div>
      </header>

      {/* CHAT */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
      >
        {messages.map((m, i) => {
          if (m.type === 'location') {
            return (
              <div key={i} className={`relative flex justify-start my-1 ${m.blur ? 'blur-sm' : ''}`}>
                <div className="max-w-[75%]">
                  <LocationCard location={m.locationData} />
                </div>
                {m.blur && (
                  <button
                    onClick={() => navigate("/paywall")}
                    className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center text-white font-bold text-lg z-10"
                  >
                    Unlock Full Response
                  </button>
                )}
              </div>
            );
          }
          
          return (
            <ChatBubble
              key={i}
              sender={m.sender}
              message={m.message}
              time={m.time}
              blur={m.blur}
            />
          );
        })}
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

        {/* save plan button */}
        {currentPlan && !planSaved && (
          <div className="flex justify-center mb-2">
            <button
              onClick={() => {
                import('@/utils/plans').then(({ savePlan, canSaveAnotherPlan }) => {
                  if (!canSaveAnotherPlan()) {
                    navigate('/paywall');
                    return;
                  }
                  const name = window.prompt('Name this travel plan:', currentPlan.title || 'My Rhodes Plan');
                  if (name === null) return; // user cancelled
                  const ok = savePlan({ ...currentPlan, title: name, chatHistory: messages });
                  if (ok) {
                    setPlanSaved(true);
                    toast({ title: 'Plan saved!' });
                  } else {
                    navigate('/paywall');
                  }
                });
              }}
              className="px-4 py-1 rounded-full text-xs font-semibold bg-[#E8D5A4] text-[#242b50] hover:bg-[#CAB17B] transition"
            >
              Save this plan
            </button>
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
            ref={inputRef}
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

      {/* Toast notifications */}
      <Toaster />
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
            : "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <p className="whitespace-pre-wrap">{message}</p>
        <div className="text-[0.7rem] text-[#888faa] text-right mt-1">
          {formatTime(time)}
        </div>
      </div>
      {blur && !isUser && (
        <button
          onClick={() => navigate("/paywall")}
          className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center text-white font-bold text-lg z-10"
        >
          Unlock Full Response
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

// ---------------- PlanConfigurator component ----------------
function PlanConfigurator({ onSubmit }) {
  const [pace, setPace] = useState(null);
  const [waterActivities, setWaterActivities] = useState(null);
  const [transport, setTransport] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [extraDetails, setExtraDetails] = useState("");

  const isReady = pace && waterActivities !== null && transport && startTime;

  const buttonBase =
    "px-4 py-2 rounded-full border border-[#F4E1C120] backdrop-blur-md text-sm font-medium focus:outline-none";

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Pace */}
      <div>
        <h3 className="font-semibold mb-2">Pace</h3>
        <div className="flex gap-2">
          {[
            { label: "Fast-Paced", value: "fast" },
            { label: "Relaxed", value: "relaxed" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`${buttonBase} ${
                pace === opt.value ? "bg-[#E8D5A4] text-[#242b50]" : "bg-white/10 text-[#F4E1C1]"
              }`}
              onClick={() => setPace(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Water activities */}
      <div>
        <h3 className="font-semibold mb-2">Water Activities</h3>
        <div className="flex gap-2">
          {[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`${buttonBase} ${
                waterActivities === opt.value ? "bg-[#E8D5A4] text-[#242b50]" : "bg-white/10 text-[#F4E1C1]"
              }`}
              onClick={() => setWaterActivities(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transport */}
      <div>
        <h3 className="font-semibold mb-2">Transport</h3>
        <div className="flex gap-2">
          {[
            { label: "Car", value: "car" },
            { label: "Public", value: "public" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`${buttonBase} ${
                transport === opt.value ? "bg-[#E8D5A4] text-[#242b50]" : "bg-white/10 text-[#F4E1C1]"
              }`}
              onClick={() => setTransport(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start Time */}
      <div>
        <h3 className="font-semibold mb-2">Start Time</h3>
        <div className="flex gap-2">
          {[
            "08:00",
            "09:00",
            "10:00",
            "11:00",
          ].map((time) => (
            <button
              key={time}
              className={`${buttonBase} ${
                startTime === time ? "bg-[#E8D5A4] text-[#242b50]" : "bg-white/10 text-[#F4E1C1]"
              }`}
              onClick={() => setStartTime(time)}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Additional personalisation (optional) */}
      <div>
        <h3 className="font-semibold mb-2">Additional Details <span className="text-xs text-[#888faa]">(optional)</span></h3>
        <textarea
          value={extraDetails}
          onChange={(e) => setExtraDetails(e.target.value)}
          rows={3}
          placeholder="e.g. I love historical sites and local tavernas"
          className="w-full rounded-lg px-4 py-2 bg-white/10 text-[#F4E1C1] placeholder:text-[#888faa] focus:outline-none resize-none"
        />
      </div>

      <button
        disabled={!isReady}
        onClick={() =>
          onSubmit({ pace, waterActivities, transport, startTime, extraDetails })
        }
        className={`w-full py-3 rounded-full text-sm font-semibold mt-2 transition ${
          isReady
            ? "bg-gradient-to-r from-[#E8D5A4] to-[#CAB17B] text-[#242b50] hover:from-[#CAB17B] hover:to-[#E8D5A4]"
            : "bg-gray-600 text-gray-300 cursor-not-allowed"
        }`}
      >
        Start Planning
      </button>
    </div>
  );
}
