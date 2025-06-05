import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home2Page = () => {
  const navigate = useNavigate();

  const pageVariants = {
    initial: { opacity: 0, x: "100%" },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: "-100%" }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  };
  
  const handleMapClick = () => {
    navigate('/choose-region');
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-navy-gradient flex flex-col items-center justify-center text-center p-4 overflow-hidden"
      onClick={handleMapClick} 
    >
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-4xl md:text-5xl font-bold mb-2 text-slate-100"
      >
        Reveal what’s hidden
      </motion.h1>
      <motion.p 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-md md:text-lg text-slate-300 mb-10"
      >
        Tap a region to explore hidden gems.
      </motion.p>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.7, type: 'spring', stiffness: 100 }}
        className="relative w-72 h-72 md:w-96 md:h-96 cursor-pointer group"
      >
        <img  
          className="w-full h-full object-contain filter brightness-110 saturate-125 group-hover:brightness-125 transition-all duration-300"
          alt="Glowing nighttime map of Rhodes with faint boundary lines"
         src="https://images.unsplash.com/photo-1603664920868-56aa7717b0aa" />
        <div className="absolute inset-0 bg-black opacity-10 group-hover:opacity-0 transition-opacity duration-300 rounded-full"></div>
      </motion.div>
      <footer className="absolute bottom-4 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Wander Rhodes. All rights reserved.</p>
      </footer>
    </motion.div>
  );
};

export default Home2Page;