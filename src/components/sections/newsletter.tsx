'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="relative bg-mavis-cream-50 overflow-hidden py-28 md:py-36 px-8">
      {/* Warm bloom — echoes the cream world, grounds the close */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 90% at 50% 110%, var(--mavis-cream-200) 0%, transparent 70%)',
          opacity: 0.7,
        }}
      />

      {/* Chapter-close hairline — same gold device as Moment 4 */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 80,
          height: 1,
          backgroundColor: 'var(--mavis-gold)',
          opacity: 0.35,
        }}
      />

      <div className="relative z-10 max-w-[460px] mx-auto text-center">

        {/* Label */}
        <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-mavis-ink-500 mb-8">
          Folio · Dispatch
        </div>

        {/* Heading */}
        <h2
          className="font-display font-light text-mavis-ink-900 leading-[1.08] tracking-[-0.02em] mb-10"
          style={{ fontSize: 'clamp(26px, 3.2vw, 44px)' }}
        >
          Not everything worth having<br className="hidden md:block" />{' '}
          announces itself.
        </h2>

        {!submitted ? (
          <form onSubmit={handleSubmit} noValidate>
            {/* Underline-style email field */}
            <div className="flex items-center gap-0 border-b pb-3" style={{ borderColor: 'var(--mavis-ink-300)', opacity: 0.7 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                aria-label="Email address"
                className="flex-1 bg-transparent font-display text-mavis-ink-900 placeholder:text-mavis-ink-300 focus:outline-none"
                style={{ fontSize: 'clamp(15px, 1.2vw, 17px)' }}
              />
              <button
                type="submit"
                aria-label="Subscribe to dispatch"
                className="font-mono text-[11px] tracking-[0.2em] pl-5 shrink-0 cursor-pointer transition-opacity duration-300 hover:opacity-60"
                style={{ color: 'var(--mavis-gold)' }}
              >
                →
              </button>
            </div>

            {/* Fine print */}
            <p
              className="font-mono italic text-[9px] tracking-[0.15em] mt-5"
              style={{ color: 'var(--mavis-ink-300)' }}
            >
              One letter. When we&apos;re ready.
            </p>
          </form>
        ) : (
          /* Confirmation — in MAVIS's voice */
          <p
            className="font-display italic font-light text-mavis-ink-700"
            style={{ fontSize: 'clamp(16px, 1.4vw, 20px)' }}
          >
            Good. We&apos;ll find you when the time comes.
          </p>
        )}

      </div>
    </section>
  );
}
