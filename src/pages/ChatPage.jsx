// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/ui/Logo";
import LocationCard from "../components/LocationCard";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, BookMarked, ArrowLeft, Send, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { isPaid } from "@/utils/auth";
import { getSavedPlans, canSaveAnotherPlan } from '@/utils/plans';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [currentPlan, setCurrentPlan] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('wr_current_plan');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [planSaved, setPlanSaved] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [planName, setPlanName] = useState('');

  const freeRemaining = Math.max(FREE_LIMIT - replyCount, 0);

  // Determine if the overall trial (single free plan) has expired
  const trialExpired = !isPaid() && !canSaveAnotherPlan();

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

    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: 'start' });
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
    if (trialExpired) {
      navigate("/paywall");
      return;
    }

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
      const endpoint = "/api/chat"; // proxy handles dev -> backend
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
        const planObj = {
          title: text.substring(0, 60),
          locations: structuredData.locations,
          timestamp: Date.now(),
        };
        setCurrentPlan(planObj);
        try { sessionStorage.setItem('wr_current_plan', JSON.stringify(planObj)); } catch {}
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
      <header className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/10 shrink-0">
        {/* left group: back & logo */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-white/10"
            title="Back"
          >
            <ArrowLeft className="text-white/80" />
          </motion.button>
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
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-32"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
      >
        <AnimatePresence>
        {messages.map((m, i) => {
          if (m.type === 'location') {
            return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`relative flex justify-start my-1 ${m.blur ? 'blur-sm' : ''}`}
                >
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
                </motion.div>
            );
          }
          
          return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
            <ChatBubble
              sender={m.sender}
              message={m.message}
              time={m.time}
              blur={m.blur}
            />
              </motion.div>
          );
        })}
        </AnimatePresence>
        {isTyping && <TypingBubble />}
        <div ref={chatEndRef} />
      </div>

      {/* BOTTOM: suggestions + free-pill + input */}
      <motion.footer
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="p-4 bg-black/30 backdrop-blur-md"
      >
        {/* suggestions (always visible if you have free prompts) */}
        {!trialExpired && freeRemaining > 0 && messages.length <= 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 space-y-2"
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSend(s)}
                className="w-full text-left rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-[#F4E1C1] font-medium backdrop-blur-sm shadow-sm hover:bg-white/10 transition text-sm flex items-center gap-3"
              >
                <Sparkles className="w-4 h-4 text-[#E8D5A4] shrink-0" />
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* save plan button */}
        {currentPlan && !planSaved && (
          <div className="flex justify-center mb-2">
            <button
              onClick={() => {
                import('@/utils/plans').then(({ canSaveAnotherPlan }) => {
                  if (!canSaveAnotherPlan()) { navigate('/paywall'); return; }
                  setPlanName(`Travel plan #${Date.now().toString().slice(-5)}`);
                  setShowNameDialog(true);
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
          <div className="px-3 py-1 text-xs font-semibold rounded-full border border-white/20 bg-black/20 text-white/70">
            {trialExpired
              ? "Free plan used – upgrade for unlimited access"
              : freeRemaining > 0
                ? `${freeRemaining} free ${freeRemaining !== 1 ? "prompts" : "prompt"} left`
                : "Upgrade for unlimited access"}
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
          {!trialExpired ? (
            <>
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
            <motion.button
              type="submit"
              disabled={isTyping || !input.trim()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#E8D5A4] to-[#B89E6A] text-[#1a1f3d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </motion.button>
            </>
          ) : (
          <button
              type="button"
              onClick={() => navigate('/paywall')}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#E8D5A4] to-[#B89E6A] text-[#1a1f3d] font-semibold hover:from-[#B89E6A] hover:to-[#E8D5A4] transition"
            >
              Upgrade for Unlimited Chat
          </button>
          )}
        </form>
      </motion.footer>

      {/* Toast notifications */}
      <Toaster />

      {/* dialog JSX after footer */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="bg-[#1a1f3d] text-[#F4E1C1] border border-white/10">
          <DialogHeader>
            <DialogTitle>Save travel plan</DialogTitle>
          </DialogHeader>
          <input
            value={planName}
            onChange={(e)=>setPlanName(e.target.value)}
            className="w-full mt-4 p-2 rounded-md bg-black/30 border border-white/20 placeholder:text-white/50 outline-none"
            placeholder="Travel plan name"
          />
          <DialogFooter className="mt-6">
            <Button
              onClick={()=>{
                import('@/utils/plans').then(({ savePlan })=>{
                  const ok = savePlan({ ...currentPlan, title: planName || currentPlan.title, chatHistory: messages });
                  if(ok){
                    setPlanSaved(true);
                    setShowNameDialog(false);
                    try { sessionStorage.removeItem('wr_current_plan'); } catch {}
                    toast({ title: 'Plan saved!' });
                  } else { navigate('/paywall'); }
                })
              }}
            >Save</Button>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChatBubble({ sender, message, time, blur }) {
  const isUser = sender === "user";
  const navigate = useNavigate();

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`relative flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`px-4 py-3 max-w-[80%] break-words rounded-3xl shadow-lg transition-all duration-300 ${
          blur && !isUser ? "blur-md" : ""
        }`}
        style={{
          background: isUser
            ? "linear-gradient(135deg, #E8D5A4, #B89E6A)"
            : "rgba(26, 31, 61, 0.7)",
          backdropFilter: "blur(10px)",
          border: isUser ? "none" : "1px solid rgba(244, 225, 193, 0.1)",
          color: isUser ? "#1a1f3d" : "#F4E1C1",
          fontWeight: 500,
        }}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        <div className="text-xs text-right mt-2 opacity-60">
          {formatTime(time)}
        </div>
      </div>
      {blur && !isUser && (
        <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => navigate("/paywall")}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#E8D5A4] to-[#CAB17B] text-[#242b50] shadow-xl hover:scale-105 transition-transform"
        >
            Unlock Full Access
        </button>
        </div>
      )}
    </motion.div>
  );
}

const TypingBubble = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="flex items-center space-x-1.5"
  >
    <div
      className="h-2 w-2 bg-[#F4E1C1] rounded-full"
      style={{ animation: "bounce 1s infinite" }}
    />
    <div
      className="h-2 w-2 bg-[#F4E1C1] rounded-full"
      style={{ animation: "bounce 1s infinite 0.2s" }}
    />
    <div
      className="h-2 w-2 bg-[#F4E1C1] rounded-full"
      style={{ animation: "bounce 1s infinite 0.4s" }}
    />
    <style>{`
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `}</style>
  </motion.div>
  );

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
