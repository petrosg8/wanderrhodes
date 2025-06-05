import React from 'react';
import Logo from '../components/ui/Logo';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between items-center p-4 text-white"
      style={{
        backgroundImage: "url('/sea-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Logo */}
      <div className="pt-6">
        <Logo />
      </div>

      {/* Intro + Map */}
      <div className="flex flex-col items-center">
        <div className="text-center mb-3">
          <h2 className="font-serif text-xl mb-1 drop-shadow-md">
            Your personal Rhodes AI travel companion
          </h2>
          <p className="font-sans text-sm drop-shadow-sm">
            Ask for hidden spots, local eats, or plan your perfect day.
          </p>
        </div>
        <img
          src="/rhodes-bg.png"
          alt="Rhodes glowing map"
          className="w-auto h-[38vh] max-w-[90vw] object-contain drop-shadow-lg mb-4"
        />
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center w-full max-w-xs gap-4">
        <button
          className="w-full py-4 text-base rounded-full bg-[#FF6B00] text-white font-medium hover:bg-[#ff7d24] transition shadow-md"
          onClick={() =>
            navigate('/chat', {
              state: { prefill: 'Hello! 😊 What local secret are you after today?' }
            })
          }
        >
          🔍 Chat Now — It’s Free
        </button>
        <button
          className="w-full py-4 text-base rounded-full border border-[#F4E1C1] text-white font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 transition shadow-sm"
          onClick={() => navigate('/features')}
        >
          📖 See How It Works
        </button>
      </div>

      {/* Feature Icons */}
      <div className="grid grid-cols-2 gap-6 items-center mb-6">
        {[
          { icon: '💬', label: 'Instant AI Chat' },
          { icon: '🗺️', label: 'Secret Spot Finder' },
          { icon: '🍴', label: 'Local Food Tips' },
          { icon: '📅', label: 'Custom Day Plans' }
        ].map((feat, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-3xl mb-1 drop-shadow-sm">{feat.icon}</span>
            <span className="text-sm font-sans drop-shadow-sm">{feat.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="w-full text-xs text-slate-300 text-center pb-0">
        &copy; {new Date().getFullYear()} Wander Rhodes. All rights reserved.
      </footer>
    </div>
  );
}

export default HomePage;
