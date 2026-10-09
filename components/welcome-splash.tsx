'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

interface WelcomeSplashProps {
  /** Total time the splash is shown, in ms. Defaults to 6000 (6 seconds). */
  duration?: number;
  /** Optional name to personalise the greeting. */
  name?: string | null;
  onFinish?: () => void;
}

export function WelcomeSplash({ duration = 6000, name, onFinish }: WelcomeSplashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  const greeting = name ? `Welcome back, ${name.split(' ')[0]}` : 'Welcome back';

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#1a1510' }}
          aria-label="Welcome"
          role="status"
        >
          {/* Ambient gold glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(60% 50% at 50% 40%, rgba(217,180,102,0.14), transparent 70%), radial-gradient(40% 40% at 50% 100%, rgba(140,100,31,0.12), transparent 70%)',
            }}
          />
          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 220px 60px rgba(0,0,0,0.6)' }}
          />

          <div className="relative flex flex-col items-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(217,180,102,0.35), transparent 70%)' }}
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
                className="relative"
              >
                <Image
                  src="/icon-512.png"
                  alt="AI Author"
                  width={132}
                  height={132}
                  priority
                  className="h-[132px] w-[132px] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
                />
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 text-xs font-medium uppercase tracking-[0.42em] text-teal-400/80"
            >
              {greeting}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display mt-3 text-5xl font-semibold tracking-tight text-gold-gradient sm:text-6xl"
            >
              AI Author
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif mt-4 max-w-sm text-base italic text-gray-300"
            >
              Where every great story begins.
            </motion.p>

            {/* Progress bar fills across the full duration */}
            <div className="relative mt-12 h-[3px] w-56 overflow-hidden rounded-full bg-gray-700/70">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: duration / 1000, ease: 'easeInOut' }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: 'linear-gradient(90deg, #8c641f, #d9b466, #f3e3b0)' }}
              />
              <div className="splash-shimmer absolute inset-0" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeSplash;
