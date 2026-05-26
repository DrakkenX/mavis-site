'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const CharacterCanvas = dynamic(() => import('@/components/CharacterCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const traits = [
  {
    label: 'TRAIT 01',
    name: 'Quiet.',
    body: 'Mavis doesn\'t speak. They don\'t need to. The presence is the conversation, and the silence is the answer.',
  },
  {
    label: 'TRAIT 02',
    name: 'Curious.',
    body: 'Mavis is always slightly turned toward you, as if you just said something interesting. You didn\'t. That\'s the trick.',
  },
  {
    label: 'TRAIT 03',
    name: 'Patient.',
    body: 'Mavis has been waiting longer than you have. Not for anything in particular. Just waiting, in the way that ancient things wait.',
  },
];

export default function Character() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Track scroll for MAVIS rotation
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });

    if (prefersReduced) return () => window.removeEventListener('scroll', onScroll);

    const ctx = gsap.context(() => {
      // Pin canvas during Act 1
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        pin: canvasWrapRef.current,
        pinSpacing: false,
      });

      // Trait cards stagger in when Act 2 enters
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
      {/* ACT 1 — Portrait */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full">

          {/* Left — 3D canvas */}
          <div ref={canvasWrapRef} className="relative w-1/2 h-full flex items-center justify-center">
            {/* Cream mist behind MAVIS */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 70% 70% at 50% 50%, var(--mavis-cream-200) 0%, transparent 70%)',
            }} />
            <div className="w-full h-full">
              <CharacterCanvas scrollY={scrollY} />
            </div>
          </div>

          {/* Right — text */}
          <div className="w-1/2 h-full flex flex-col justify-center px-12 lg:px-16 xl:px-20">
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
            {traits.map((trait) => (
              <div
                key={trait.label}
                className="trait-card group flex flex-col gap-6 p-10 bg-mavis-cream-50 opacity-0 transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ boxShadow: '0 2px 24px 0 rgba(26,22,18,0.04)' }}
              >
                <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500">
                  {trait.label}
                </span>
                <h3
                  className="font-display italic font-light text-mavis-ink-900 leading-[1.0]"
                  style={{ fontSize: 'clamp(32px, 3vw, 48px)' }}
                >
                  {trait.name}
                </h3>
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
