'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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

export default function Universe() {
  const sectionRef = useRef<HTMLElement>(null);
  const panoramaRef = useRef<HTMLDivElement>(null);
  const particle1Ref = useRef<HTMLDivElement>(null);
  const particle2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

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
      {/* Horizontal panorama */}
      <div
        ref={panoramaRef}
        className="flex h-screen will-change-transform"
        style={{ width: 'max-content' }}
      >

        {/* MOMENT 1 — Title plate */}
        <div className="relative flex-none w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-mavis-cream-50 via-mavis-cream-100 to-mavis-cream-50 px-8 text-center">
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
        </div>

        {/* MOMENT 2 — MAVIS in mist */}
        <div className="relative flex-none w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-mavis-peach-100 via-mavis-cream-100 to-mavis-peach-100 px-8">
          {/* Particles */}
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
                  animation: `particleFloat ${5 + (i % 4)}s ease-in-out ${i * 0.4}s infinite alternate`,
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

        {/* MOMENT 3 — Empty pedestal */}
        <div className="relative flex-none w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-mavis-blush-100 via-mavis-cream-100 to-mavis-blush-100 px-8">
          {/* Particles */}
          <div ref={particle2Ref} className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-mavis-blush-200"
                style={{
                  width: `${2 + (i % 2)}px`,
                  height: `${2 + (i % 2)}px`,
                  left: `${10 + i * 8}%`,
                  top: `${20 + (i % 4) * 16}%`,
                  opacity: 0.35,
                  animation: `particleFloat ${4 + (i % 3)}s ease-in-out ${i * 0.5}s infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="w-[300px] h-[340px] relative z-10 mystery-pulse">
            <PedestalCanvas />
          </div>
          <div className="mt-10 text-center z-10">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 mb-2">
              002 · ???
            </div>
            <div
              className="font-display italic font-light text-mavis-ink-700"
              style={{ fontSize: 'clamp(22px, 2.2vw, 34px)' }}
            >
              Coming.
            </div>
          </div>
        </div>

        {/* MOMENT 4 — Folio promise */}
        <div className="relative flex-none w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-mavis-cream-50 via-mavis-cream-100 to-mavis-cream-50 px-8 text-center">
          <h2
            className="font-display font-light text-mavis-ink-900 leading-[1.05] tracking-[-0.02em] mb-10"
            style={{ fontSize: 'clamp(36px, 5vw, 76px)' }}
          >
            <span className="block">Twelve creatures.</span>
            <span className="block">Twelve stories.</span>
            <span className="block italic">One folio.</span>
          </h2>
          <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-mavis-ink-500">
            Stay close.
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
