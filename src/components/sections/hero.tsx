'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

const MavisCanvas = dynamic(() => import('@/components/MavisCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  // Scroll-linked exit fade: hero gently recedes as manifesto takes over.
  // Starts at 60% scroll progress (section 60% past viewport top), ends at 100%.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const exitOpacity = useTransform(scrollYProgress, [0.6, 1], [1, 0.65]);
  const exitY = useTransform(scrollYProgress, [0.6, 1], [0, -24]);

  return (
    <motion.section
      ref={heroRef}
      style={prefersReduced ? {} : { opacity: exitOpacity, y: exitY }}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-mavis-cream-50 via-mavis-cream-50 to-mavis-cream-100 flex flex-col md:block"
    >
      {/* Navigation — always absolute, outside flex flow */}
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

      {/* 3D Canvas
          Mobile:  relative, in flex flow, responsive square, clears nav
          Desktop: absolute, top-centered, 60vh × 60vh capped at 600px
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.6,
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={[
          // Mobile: in-flow, centered, clears 64px nav
          'relative mt-16 mx-auto flex-shrink-0',
          'w-[min(55vh,72vw)] h-[min(55vh,72vw)]',
          // Desktop: absolute, original framing
          'md:absolute md:top-[8%] md:left-1/2 md:-translate-x-1/2',
          'md:w-[60vh] md:h-[60vh] md:max-w-[600px] md:max-h-[600px]',
          'z-10',
        ].join(' ')}
      >
        <MavisCanvas />
      </motion.div>

      {/* Text Stack
          Mobile:  flex-1, items pushed to bottom of remaining space
          Desktop: absolute bottom-[18%], full width, centered
      */}
      <div className={[
        // Mobile: fill remaining space, anchor text at bottom
        'relative flex-1 flex flex-col items-center justify-end pb-16 px-8 text-center z-10',
        // Desktop: absolute bottom positioning
        'md:absolute md:bottom-[18%] md:left-0 md:right-0 md:pb-0',
        'md:flex md:flex-col md:items-center md:justify-center',
      ].join(' ')}>

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
            transition={{ delay: 1.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            Meet
          </motion.span>
          {' '}
          {/* CUT: spring overshoot [0.34,1.56,0.64,1] — cascade timing alone gives character */}
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ delay: 1.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display italic text-mavis-ink-700 leading-[1.3]"
          style={{ fontSize: 'clamp(20px, 2vw, 32px)' }}
        >
          A character revealed.
        </motion.p>
      </div>

      {/* Scroll Prompt
          Mobile:  last flex item, mx-auto
          Desktop: absolute bottom-8, centered
      */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
        className={[
          'relative flex-shrink-0 flex flex-col items-center gap-2 pb-8 mx-auto z-10',
          'md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:pb-0',
        ].join(' ')}
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
    </motion.section>
  );
}
