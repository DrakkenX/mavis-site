'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const sigRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 0.8,
        },
      });

      // Stage 0: section fades in
      tl.fromTo(sectionRef.current, { opacity: 0.6 }, { opacity: 1, duration: 0.1 });

      // Stage 1 (0–30%): lines settle into place — 8px travel, not 16. Feels inevitable, not theatrical.
      tl.fromTo(line1Ref.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.05);
      tl.fromTo(line2Ref.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.15);
      tl.fromTo(line3Ref.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.25);

      // Stage 2 (30–60%): heading scales, body arrives — 12px travel (halved from 24)
      tl.to(headingRef.current, { scale: 0.96, duration: 0.2, ease: 'power1.inOut' }, 0.35);
      tl.fromTo(bodyRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.38);

      // Stage 3 (60–90%): signature fades in, heading blurs — capped at 4px (atmospheric, not trashy)
      tl.fromTo(sigRef.current, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.62);
      tl.to(headingRef.current, { filter: 'blur(4px)', duration: 0.2 }, 0.65);

      // Stage 4 (90–100%): whole section recedes
      tl.to(sectionRef.current, { opacity: 0.4, duration: 0.1 }, 0.9);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, var(--mavis-cream-200) 0%, transparent 70%)',
          animation: 'gradientDrift 60s ease-in-out infinite alternate',
        }}
      />

      {/* Chapter label */}
      <div className="absolute top-12 left-8 font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 pointer-events-none">
        Chapter I · Manifesto
      </div>

      {/* Center stage */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">

        {/* Main heading */}
        <h2
          ref={headingRef}
          className="font-display font-light text-mavis-ink-900 leading-[0.95] tracking-[-0.02em] will-change-transform"
          style={{ fontSize: 'clamp(56px, 8vw, 128px)' }}
        >
          <span ref={line1Ref} className="block opacity-0">Not a product.</span>
          <span ref={line2Ref} className="block opacity-0">Not a pet.</span>
          <span ref={line3Ref} className="block opacity-0">
            A <em className="not-italic italic presence-shimmer">presence</em>.
          </span>
        </h2>

        {/* Body */}
        <p
          ref={bodyRef}
          className="font-display text-mavis-ink-700 leading-[1.5] max-w-[520px] mt-[60px] opacity-0"
          style={{ fontSize: 'clamp(18px, 1.4vw, 22px)' }}
        >
          MAVIS was made the way certain objects are made. Slowly.
          By hand, mostly. With the kind of attention that produces
          things you keep on a shelf and look at when nothing else
          feels right.
        </p>

        {/* Signature */}
        <div
          ref={sigRef}
          className="font-mono text-[11px] tracking-[0.32em] text-mavis-ink-500 mt-[60px] opacity-0"
        >
          — FOLIO, MMXXVI
        </div>
      </div>

      <style>{`
        @keyframes gradientDrift {
          0%   { background-position: 50% 40%; }
          100% { background-position: 52% 46%; }
        }
        @keyframes presenceShimmer {
          0%, 100% { text-shadow: 0 0 0px transparent; }
          50%       { text-shadow: 0 0 18px color-mix(in oklch, var(--mavis-sky) 40%, var(--mavis-gold) 30%); }
        }
        .presence-shimmer {
          animation: presenceShimmer 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .presence-shimmer { animation: none; }
        }
      `}</style>
    </section>
  );
}
