import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashLoaderProps {
  onComplete: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress percentage from 0 to 100 over 2.5 seconds
    const duration = 2500;
    const intervalTime = 25;
    const steps = duration / intervalTime;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 500); // Hold at 100% for brief visual completion
      } else {
        setProgress(Math.floor(currentProgress));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Calculate the y coordinate for liquid level:
  // Liquid cavity goes from y = 263 (empty) to y = 80 (full)
  const emptyY = 263;
  const fullY = 80;
  const liquidY = emptyY - (progress / 100) * (emptyY - fullY);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed inset-0 z-50 bg-[#070707] flex flex-col items-center justify-center select-none"
    >
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-6">
        
        {/* SVG Luxury Perfume Bottle */}
        <div className="relative w-64 h-80">
          <svg
            viewBox="0 0 200 300"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gold Gradient for Cap and Borders */}
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="30%" stopColor="#FFF8DC" />
                <stop offset="70%" stopColor="#AA7C11" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>

              {/* Liquid Gold Gradient */}
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.95" />
                <stop offset="20%" stopColor="#FFD700" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#DAA520" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#8B6508" stopOpacity="0.95" />
              </linearGradient>

              {/* Cavity clip path for the rising liquid */}
              <clipPath id="liquid-clip">
                <path d="M 80 75 L 120 75 L 120 78 L 155 100 L 155 250 C 155 258 150 263 142 263 L 58 263 C 50 263 45 258 45 250 L 45 100 L 80 78 Z" />
              </clipPath>
            </defs>

            {/* 1. Liquid Group (clipping to the inner cavity) */}
            <g clipPath="url(#liquid-clip)">
              {/* Liquid Level Base container */}
              <motion.rect
                x="30"
                y={liquidY}
                width="140"
                height="220"
                fill="url(#liquidGrad)"
                animate={{ y: liquidY }}
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.15 }}
              />

              {/* Animated Wave on top of liquid */}
              <motion.path
                d="M 0 0 Q 30 8 60 0 T 120 0 T 180 0 T 240 0 L 240 40 L 0 40 Z"
                fill="url(#liquidGrad)"
                style={{ y: liquidY - 5 }}
                animate={{ x: [-80, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 2 }}
              />
            </g>

            {/* 2. Glass Bottle Outer Silhouette */}
            <path
              d="M 75 50 L 125 50 L 125 70 L 165 95 L 165 260 C 165 270 160 275 150 275 L 50 275 C 40 275 35 270 35 260 L 35 95 L 75 70 Z"
              stroke="url(#goldGrad)"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]"
            />

            {/* 3. Gold Luxury Cap */}
            <path
              d="M 80 15 L 120 15 C 125 15 125 20 125 20 L 125 50 L 75 50 L 75 20 C 75 20 75 15 80 15 Z"
              fill="url(#goldGrad)"
            />
            {/* Ridges/details on cap for high-end look */}
            <line x1="88" y1="20" x2="88" y2="45" stroke="#4A3B12" strokeWidth="1" />
            <line x1="96" y1="20" x2="96" y2="45" stroke="#4A3B12" strokeWidth="1" />
            <line x1="104" y1="20" x2="104" y2="45" stroke="#4A3B12" strokeWidth="1" />
            <line x1="112" y1="20" x2="112" y2="45" stroke="#4A3B12" strokeWidth="1" />

            {/* 4. Central luxury label/tag (drawn on top of liquid) */}
            <g transform="translate(60, 154)">
              <rect
                width="80"
                height="32"
                rx="4"
                fill="#070707"
                stroke="url(#goldGrad)"
                strokeWidth="1.5"
                className="shadow-lg"
              />
              <text
                x="40"
                y="21"
                textAnchor="middle"
                fill="#D4AF37"
                fontSize="10"
                fontFamily="var(--font-serif)"
                fontWeight="bold"
                letterSpacing="2.5"
              >
                SCENTIX
              </text>
            </g>
          </svg>
        </div>

        {/* Loading Progress Indicator */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-serif font-light text-accent-gold tracking-widest">
            {progress}%
          </span>
          <span className="text-[10px] uppercase font-sans tracking-[0.3em] text-gray-500 animate-pulse mb-2">
            Pouring Liquid Gold
          </span>
        </div>

        {/* Static description text */}
        <p className="text-center text-xs text-gray-400 font-sans tracking-wider leading-relaxed font-light opacity-80 mt-2 border-t border-white/5 pt-4">
          Explore all the Perfumes, Body Spray and Attars for Men, Women and for Both from{' '}
          <span className="text-accent-gold font-medium">SCENTiX</span> for Wholesale and Retail.
          For more details contact{' '}
          <a
            href="https://wa.me/94703215170"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-accent-gold font-medium select-text underline decoration-accent-gold/40 underline-offset-4 cursor-pointer transition-colors"
          >
            0703215170
          </a>
          .
        </p>

      </div>
    </motion.div>
  );
};
