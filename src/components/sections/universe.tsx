'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MavisCanvas = dynamic(() => import('@/components/MavisCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const PedestalCanvas = dynamic(() => import('@/components/PedestalCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

// ─── Moment 3: Interactive pedestal reveal ────────────────────────────────────

function InteractivePedestal() {
  const [revealed, setRevealed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const momentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    // Reset revealed when this moment leaves the viewport (mobile scroll-away).
    // On desktop, onMouseLeave handles deactivation — observer is belt-and-suspenders.
    const el = momentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setRevealed(false); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activate = () => {
    setRevealed(true);
    if (!hasInteracted) setHasInteracted(true);
  };
  const deactivate = () => setRevealed(false);

  return (
    <div
      ref={momentRef}
      className="relative flex-none w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-mavis-blush-100 via-mavis-cream-100 to-mavis-blush-100 px-8"
      onMouseEnter={() => { if (!isMobile) activate(); }}
      onMouseLeave={() => { if (!isMobile) deactivate(); }}
      onClick={() => { if (isMobile) { revealed ? deactivate() : activate(); } }}
    >
      {/* Static sky overlay from Day 3 — cool tint from above */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(184,212,227,0.08) 0%, transparent 100%)',
        }}
      />

      {/* Sky glow bloom — appears 150ms after hover/tap, reads as overhead light revealing something */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{
          duration: revealed ? 1.2 : 0.9,
          delay: revealed ? 0.15 : 0,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 40% at 50% 28%, rgba(184,212,227,0.18) 0%, transparent 100%)',
        }}
      />

      {/* Canvas — mystery-pulse removed while revealed (steady reveal, not pulsing) */}
      <div className={`w-[300px] h-[340px] relative z-10${revealed ? '' : ' mystery-pulse'}`}>
        <PedestalCanvas revealed={revealed} />
      </div>

      {/* Label + hint */}
      <div className="mt-10 text-center z-10">
        {/* "002 · ???" → "002 · UNREVEALED" with color + tracking shift */}
        <div
          className="font-mono text-[10px] uppercase mb-2"
          style={{
            letterSpacing: revealed ? '0.4em' : '0.32em',
            color: revealed ? 'var(--mavis-gold)' : 'var(--mavis-ink-500)',
            transition: 'color 600ms ease, letter-spacing 600ms ease',
          }}
        >
          {revealed ? '002 · UNREVEALED' : '002 · ???'}
        </div>

        <div
          className="font-display italic font-light text-mavis-ink-700"
          style={{ fontSize: 'clamp(22px, 2.2vw, 34px)' }}
        >
          Coming.
        </div>

        {/* Interaction hint — fades out after first interaction */}
        <motion.p
          aria-hidden="true"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: hasInteracted ? 0 : 0.4 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="font-mono text-[9px] italic mt-3"
          style={{
            letterSpacing: '0.2em',
            color: 'var(--mavis-cream-300)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {isMobile ? 'tap to glimpse' : 'hover to glimpse'}
        </motion.p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Universe() {
  const sectionRef = useRef<HTMLElement>(null);
  const panoramaRef = useRef<HTMLDivElement>(null);
  const particle1Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Mobile: skip horizontal scroll-jack entirely.
    // Horizontal scroll on touch = broken UX. Moments stack vertically instead.
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const ctx = gsap.context(() => {
      const panorama = panoramaRef.current;
      if (!panorama) return;

      // Horizontal scroll-jack: pin section, translate panorama on vertical scroll
      gsap.to(panorama, {
        x: () => -(panorama.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${panorama.scrollWidth - window.innerWidth + window.innerHeight * 0.5}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Subtle camera-like bob on whole panorama
      gsap.to(panorama, {
        y: 6,
        repeat: -1,
        yoyo: true,
        duration: 4,
        ease: 'sine.inOut',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-mavis-cream-50"
      style={{ minHeight: '150vh' }}
    >
      {/* Panorama
          Desktop: flex-row h-screen, GSAP translates horizontally
          Mobile:  flex-col, 4 moments stack vertically — no GSAP needed
      */}
      <div
        ref={panoramaRef}
        className="flex flex-col md:flex-row md:h-screen will-change-transform"
        style={{ width: 'max-content' }}
      >

        {/* MOMENT 1 — Title plate: pure cream-50, content 15% above center, gold line */}
        <div className="relative flex-none w-screen h-screen bg-mavis-cream-50 px-8">
          {/* Content pinned at 35vh (15% above 50vh center) */}
          <div
            className="absolute left-1/2 text-center"
            style={{ top: '35%', transform: 'translate(-50%, -50%)', width: 'max-content', maxWidth: '90vw' }}
          >
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 mb-10">
              Chapter III · The Folio Universe
            </div>
            <h2
              className="font-display font-light text-mavis-ink-900 leading-[0.95] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(56px, 9vw, 136px)' }}
            >
              <span className="block">A world made</span>
              <span className="block italic">one creature</span>
              <span className="block">at a time.</span>
            </h2>
            {/* Gold chapter-open line — 32px below subtitle */}
            <div
              aria-hidden="true"
              style={{
                width: 80,
                height: 1,
                backgroundColor: 'var(--mavis-gold)',
                opacity: 0.4,
                margin: '32px auto 0',
              }}
            />
          </div>
        </div>

        {/* MOMENT 2 — MAVIS in mist: warmer radial gradient, halved particle speed */}
        <div
          className="relative flex-none w-screen h-screen flex flex-col items-center justify-center px-8"
          style={{
            background: 'radial-gradient(ellipse 70% 70% at 50% 50%, var(--mavis-cream-100) 0%, var(--mavis-peach-100) 40%, var(--mavis-cream-50) 100%)',
          }}
        >
          {/* Particles — tinted peach-100, drift speed halved (2× duration) */}
          <div ref={particle1Ref} className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-mavis-peach-100"
                style={{
                  width: `${2 + (i % 3)}px`,
                  height: `${2 + (i % 3)}px`,
                  left: `${8 + i * 7.5}%`,
                  top: `${15 + (i % 5) * 14}%`,
                  opacity: 0.4,
                  animation: `particleFloat ${(5 + (i % 4)) * 2}s ease-in-out ${i * 0.4}s infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="w-[360px] h-[360px] relative z-10">
            <MavisCanvas />
          </div>
          <div className="mt-10 text-center z-10">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 mb-2">
              001 · MAVIS
            </div>
            <div
              className="font-display italic font-light text-mavis-ink-700"
              style={{ fontSize: 'clamp(22px, 2.2vw, 34px)' }}
            >
              The Listener.
            </div>
          </div>
        </div>

        {/* MOMENT 3 — Interactive pedestal reveal */}
        <InteractivePedestal />

        {/* MOMENT 4 — Folio promise: pure cream-50, grounded close */}
        <div className="relative flex-none w-screen h-screen flex flex-col items-center justify-center bg-mavis-cream-50 px-8 text-center">
          <h2
            className="font-display font-light text-mavis-ink-900 leading-[1.05] tracking-[-0.02em] mb-10"
            style={{ fontSize: 'clamp(36px, 5vw, 76px)' }}
          >
            <span className="block">Twelve creatures.</span>
            <span className="block">Twelve stories.</span>
            <span className="block italic">One folio.</span>
          </h2>
          {/* Chapter-close signature — 4px gold dot + em-dash */}
          <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-mavis-ink-500 flex items-center justify-center">
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'var(--mavis-gold)',
                marginRight: 8,
                flexShrink: 0,
              }}
            />
            <span>&#8212;&ensp;Stay close.</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes particleFloat {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(-14px); }
        }
        @keyframes mysteryPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.75; }
        }
        .mystery-pulse {
          animation: mysteryPulse 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mystery-pulse { animation: none; }
        }
      `}</style>
    </section>
  );
}
