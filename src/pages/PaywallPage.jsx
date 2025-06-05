import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import {
  MessageCircle,
  Compass,
  Calendar,
  Info,
  Sparkles,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { createCheckoutSession, simulateSuccessfulPayment } from '../utils/api';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export default function PaywallPage() {
  const navigate = useNavigate();

  // 10-minute countdown
  const [timeLeft, setTimeLeft] = useState(600);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const expired = timeLeft <= 0;

  // paywall modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // carousel images
  const images = [
    { src: '/assets/secret-beach.jpg',   caption: 'AI reveals this secret cove' },
    { src: '/assets/hidden-taverna.png', caption: 'AI guides you to hidden tavernas' },
    { src: '/assets/sunset-view.webp',   caption: 'AI plans your perfect sunset view' },
    { src: '/assets/lost-ruins.jpg',     caption: 'AI uncovers lost ruins' },
  ];
  const carouselSettings = {
    dots: true,
    infinite: true,
    autoplay: true,
    arrows: false,
    speed: 600,
    autoplaySpeed: 3500,
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-evenly px-4 text-white"
      style={{
        backgroundImage: "url('/sea-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Logo */}
      <div className="pt-8 cursor-pointer" onClick={() => navigate('/')}>
        <Logo />
      </div>

      {/* Carousel */}
      <div className="w-full max-w-sm">
        <Slider {...carouselSettings}>
          {images.map((img, i) => (
            <div key={i} className="px-1">
              <img
                src={img.src}
                alt={img.caption}
                className="rounded-2xl w-full h-40 object-cover shadow-lg"
              />
              <div className="mt-2 text-center text-xs font-sans drop-shadow-sm">
                {img.caption}
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Headline & Subtext */}
      <div className="text-center px-2 max-w-sm">
        <h1 className="font-serif text-3xl leading-snug mb-2 drop-shadow-lg">
          Chat with Rhodes AI Expert
        </h1>
        <p className="font-sans text-lg mb-4 drop-shadow-md">
          Unlock personalized local knowledge and hidden spots—no apps, no accounts.
        </p>
      </div>

      {/* Countdown */}
      {!expired && (
        <div className="inline-block bg-[#F4E1C1]/80 px-4 py-1 rounded-full text-sm font-medium drop-shadow-md text-[#3E2F1B] animate-pulse">
          Intro offer ends in <strong>{minutes}:{seconds}</strong>
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={() => !expired && setIsModalOpen(true)}
        disabled={expired}
        className={`w-full max-w-sm py-5 rounded-full text-lg font-semibold transition transform ${
          expired
            ? 'bg-gray-300 cursor-not-allowed text-gray-600'
            : 'bg-gradient-to-r from-[#E8D5A4] to-[#CAB17B] text-[#3E2F1B] hover:scale-105 hover:shadow-xl'
        }`}
      >
        {expired ? '🔒 Offer Expired' : '🔓 Access Rhodes AI — €3.49'}
      </button>

      {/* AI Chat Features */}
      <div className="grid grid-cols-2 gap-6 mt-6 max-w-xs text-center">
        {[
          { Icon: MessageCircle, label: 'Chat with Rhodes AI Expert' },
          { Icon: Compass,        label: 'Tailored Local Recommendations' },
          { Icon: Calendar,       label: 'Plan Your Perfect Day' },
          { Icon: Info,           label: 'Instant Insider Tips' },
        ].map(({ Icon, label }, i) => (
          <div
            key={i}
            className="flex flex-col items-center opacity-90 hover:opacity-100 transform hover:scale-105 transition duration-300"
          >
            <div className="bg-[#F4E1C1] p-4 rounded-full shadow-lg mb-2">
              <Icon className="h-7 w-7 text-[#3E2F1B]" />
            </div>
            <span className="text-sm font-sans drop-shadow-sm text-white">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionId={sessionId}
      />
    </div>
  );
}

function PaywallModal({ isOpen, onClose, sessionId }) {
  const [status, setStatus]     = useState('idle');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsLoading(true);
    setStatus('processing');
    try {
      await createCheckoutSession();
      // simulate webhook callback
      await new Promise(r => setTimeout(r, 2000));
      simulateSuccessfulPayment(sessionId);
      setStatus('success');
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#F4E1C1] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-transform duration-300 ease-out hover:scale-105"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#CAB17B] to-[#E8D5A4] p-6 text-[#3E2F1B]">
          <h2 className="text-2xl font-bold flex items-center opacity-95">
            <Sparkles className="mr-2" size={24} />
            Unlock More Prompts
          </h2>
          <p className="mt-2 opacity-80">
            You've used all your free prompts. Continue with premium access.
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Purchase Successful!</h3>
              <p className="text-[#3E2F1B]">You now have 50 additional prompts.</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-100 border border-[#CAB17B] rounded-lg p-4 mb-6">
                <h3 className="font-medium text-black mb-3">What you’ll get:</h3>
                <ul className="space-y-2 text-black">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-0.5" size={16} />
                    50 additional AI prompts
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-0.5" size={16} />
                    Continue your current session
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-0.5" size={16} />
                    No account creation required
                  </li>
                </ul>
              </div>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-[#3E2F1B] mb-1">€3.49</div>
                <div className="text-[#3E2F1B] text-sm">One-time payment</div>
              </div>
              <button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-[#CAB17B] hover:bg-[#B49B5A] text-[#3E2F1B] font-medium py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isLoading
                  ? 'Processing...'
                  : (
                    <>
                      <CreditCard className="mr-2" size={18} />
                      Purchase Now
                    </>
                  )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#CAB17B] text-center text-xs text-[#3E2F1B]">
          Secured by Stripe • No account required • Instant access
        </div>
      </div>
    </div>
  );
}
