'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const MavisCanvas = dynamic(() => import('@/components/MavisCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-mavis-cream-50 via-mavis-cream-50 to-mavis-cream-100">
      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex items-center justify-between"
      >
        <div className="font-display text-[18px] text-mavis-ink-900 tracking-tight">
          mavis
        </div>
        <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500">
          MMXXVI · Coming Soon
        </div>
      </motion.nav>

      {/* 3D Mascot Stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.6,
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[60vh] h-[60vh] max-w-[600px] max-h-[600px] z-10"
      >
        <MavisCanvas />
      </motion.div>

      {/* Text Stack — positioned below 3D */}
      <div className="absolute bottom-[18%] left-0 right-0 flex flex-col items-center text-center px-8 z-10">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="font-mono text-[11px] tracking-[0.32em] uppercase text-mavis-ink-500 mb-6"
        >
          [ Introducing ]
        </motion.div>

        {/* Main Heading */}
        <h1
          className="font-display font-light text-mavis-ink-900 leading-[0.92] mb-8"
          style={{ fontSize: 'clamp(80px, 12vw, 180px)' }}
        >
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="inline-block"
          >
            Meet
          </motion.span>
          {' '}
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.55, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-block italic"
          >
            MAVIS
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.4 }}
            className="inline-block"
          >
            .
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.6 }}
          className="font-display italic text-mavis-ink-700 leading-[1.3]"
          style={{ fontSize: 'clamp(20px, 2vw, 32px)' }}
        >
          A character revealed.
        </motion.p>
      </div>

      {/* Scroll Prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500">
          Scroll
        </div>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-[1px] h-[24px] bg-mavis-ink-500/40"
        />
      </motion.div>
    </section>
  );
}
