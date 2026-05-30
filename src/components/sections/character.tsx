'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Mood } from '@/components/TraitCanvas';

const CharacterCanvas = dynamic(() => import('@/components/CharacterCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const TraitCanvas = dynamic(() => import('@/components/TraitCanvas'), {
  ssr: false,
  // Preserve 96×96 space during JS load — no layout shift
  loading: () => <div style={{ width: 96, height: 96, flexShrink: 0 }} />,
});

const traits: Array<{ label: string; name: string; mood: Mood; body: string }> = [
  {
    label: 'TRAIT 01',
    name: 'Quiet.',
    mood: 'quiet',
    body: 'Mavis doesn\'t speak. They don\'t need to. The presence is the conversation, and the silence is the answer.',
  },
  {
    label: 'TRAIT 02',
    name: 'Curious.',
    mood: 'curious',
    body: 'Mavis is always slightly turned toward you, as if you just said something interesting. You didn\'t. That\'s the trick.',
  },
  {
    label: 'TRAIT 03',
    name: 'Patient.',
    mood: 'patient',
    body: 'Mavis has been waiting longer than you have. Not for anything in particular. Just waiting, in the way that ancient things wait.',
  },
];

export default function Character() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Track scroll for MAVIS rotation
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });

    if (prefersReduced) return () => window.removeEventListener('scroll', onScroll);

    const ctx = gsap.context(() => {
      // Pin canvas during Act 1 — desktop only.
      // On mobile the sticky split stacks vertically; no pin needed.
      if (!isMobile) {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight}`,
          pin: canvasWrapRef.current,
          pinSpacing: false,
        });
      }

      // Trait cards stagger in when Act 2 enters — all breakpoints
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('.trait-card');
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: act2Ref.current,
              start: 'top 75%',
            },
          }
        );
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-mavis-cream-100 via-mavis-cream-50 to-mavis-cream-100"
      style={{ minHeight: '200vh' }}
    >
      {/* ACT 1 — Portrait
          Desktop: sticky split (canvas left / text right)
          Mobile:  vertical stack (canvas top / text below), no sticky
      */}
      <div className="overflow-hidden md:sticky md:top-0 md:h-screen">
        <div className="flex flex-col md:flex-row md:h-full">

          {/* Canvas: min(55vh,80vw) tall on mobile, full-height on desktop.
              Tailwind arbitrary value (not inline style) so md:h-full wins via CSS order. */}
          <div
            ref={canvasWrapRef}
            className="relative w-full h-[min(55vh,80vw)] md:w-1/2 md:h-full flex items-center justify-center"
          >
            {/* Cream mist */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 70% 70% at 50% 50%, var(--mavis-cream-200) 0%, transparent 70%)',
            }} />
            <div className="w-full h-full">
              <CharacterCanvas scrollY={scrollY} />
            </div>
          </div>

          {/* Text: full-width on mobile, right-half on desktop */}
          <div className="w-full md:w-1/2 md:h-full flex flex-col justify-center px-8 py-10 md:px-12 lg:px-16 xl:px-20">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 mb-10">
              Chapter II · Character
            </div>

            <h2
              className="font-display font-light text-mavis-ink-900 leading-[1.0] tracking-[-0.02em] mb-10"
              style={{ fontSize: 'clamp(40px, 5.5vw, 88px)' }}
            >
              Meet the one we kept<br />
              from the first batch.
            </h2>

            <p
              className="font-display text-mavis-ink-700 leading-[1.5] max-w-[420px] mb-12"
              style={{ fontSize: 'clamp(16px, 1.3vw, 20px)' }}
            >
              We made twelve. We kept one. The others were close.
              This one had something the others didn&#39;t — a way of
              sitting still that felt like waiting for you to come
              home. We named them MAVIS.
            </p>

            {/* Data pairs */}
            <div className="flex flex-col gap-4 border-t border-mavis-ink-300/30 pt-8">
              {[
                ['ORIGIN', 'Studio Folio, Atelier 03'],
                ['MATERIAL', 'Hand-formed, hand-finished'],
                ['EDITION', 'One of one. Reproducible by character only.'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-6 items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 w-24 shrink-0">
                    {label}
                  </span>
                  <span className="font-display text-mavis-ink-700" style={{ fontSize: 'clamp(14px, 1vw, 16px)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACT 2 — Traits grid */}
      <div ref={act2Ref} className="relative bg-gradient-to-b from-mavis-cream-100 to-mavis-cream-200">
        <div className="max-w-[1280px] mx-auto px-8 py-32">
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {traits.map((trait, i) => (
              <div
                key={trait.label}
                className="trait-card flex flex-col gap-4 opacity-0 bg-mavis-cream-100 rounded-[12px] cursor-pointer"
                style={{
                  padding: '32px 24px',
                  border: '1px solid var(--mavis-cream-300)',
                  // GSAP owns opacity + y-transform on entrance.
                  // React owns box-shadow + hover-lift (runs after entrance completes).
                  boxShadow: hoveredIdx === i
                    ? '0 12px 32px -8px rgba(26,22,18,0.08)'
                    : '0 2px 12px 0 rgba(26,22,18,0.04)',
                  transform: hoveredIdx === i ? 'translateY(-4px)' : 'translateY(0px)',
                  transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1), box-shadow 400ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Mood canvas — 96×96, centered */}
                <div className="flex justify-center">
                  <TraitCanvas mood={trait.mood} hovered={hoveredIdx === i} />
                </div>

                {/* Geist Mono label */}
                <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500">
                  {trait.label}
                </span>

                {/* Fraunces name */}
                <h3
                  className="font-display italic font-light text-mavis-ink-900 leading-[1.0]"
                  style={{ fontSize: 'clamp(32px, 3vw, 48px)' }}
                >
                  {trait.name}
                </h3>

                {/* Fraunces body */}
                <p
                  className="font-display text-mavis-ink-700 leading-[1.6]"
                  style={{ fontSize: 'clamp(15px, 1.1vw, 17px)' }}
                >
                  {trait.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
