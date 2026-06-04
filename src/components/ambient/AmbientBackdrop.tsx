'use client';

import { useEffect, useRef } from 'react';

// ─── AmbientBackdrop ──────────────────────────────────────────────────────────
// Item 8 — site-wide living background + cursor-reactive layer. Translates
// igloo.inc's "living, interactive backdrop" into MAVIS's warm/cute vibe:
//   • a slow drifting + breathing warm aurora (CSS, behind all content)
//   • a fixed mote/cursor canvas ON TOP (pointer-events:none, screen blend) with
//     warm dust motes that drift ambiently and softly ease toward the cursor,
//     plus a warm glow pool that follows the pointer and a faint sparkle trail.
//
// Guards: DPR capped, paused when tab hidden, cursor reaction only on fine/hover
// pointers (touch keeps ambient drift), and prefers-reduced-motion → static.
//
// Mounted once in the root layout. The aurora sits at z-0; page content is z-10
// (translucent section veils let the aurora breathe through); this canvas is z-30.

// Warm palette sampled from MAVIS tokens. NOTE: the canvas uses mix-blend-mode
// MULTIPLY (screen/lighter is invisible on a near-white cream page), so these are
// saturated warm tints — they "stain" the cream into soft golden/peach bokeh.
const MOTE_COLORS: Array<[number, number, number]> = [
  [255, 196, 128], // amber
  [250, 206, 174], // peach
  [232, 168, 156], // soft rose-peach
  [200, 162, 90], // gold
  [245, 222, 190], // warm sand
];
const GLOW_COLOR: [number, number, number] = [255, 200, 140]; // warm pointer pool

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // sprite radius in px
  alpha: number; // base brightness
  twPhase: number; // twinkle phase
  twSpeed: number;
  color: number; // index into MOTE_COLORS
};

type Sparkle = { x: number; y: number; life: number; size: number };

// Pre-render a soft radial sprite for a given rgb — drawImage of a cached sprite
// is far cheaper than createRadialGradient per mote per frame.
function makeSprite(rgb: [number, number, number], soft = 0.0): HTMLCanvasElement {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const [r, gr, b] = rgb;
  grad.addColorStop(0, `rgba(${r},${gr},${b},1)`);
  grad.addColorStop(soft || 0.25, `rgba(${r},${gr},${b},0.55)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return c;
}

export default function AmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    const moteSprites = MOTE_COLORS.map((c) => makeSprite(c));
    const glowSprite = makeSprite(GLOW_COLOR, 0.18);

    let motes: Mote[] = [];
    const sparkles: Sparkle[] = [];

    // Pointer state (eased) — start off-screen so nothing reacts until first move.
    let pointerX = -9999;
    let pointerY = -9999;
    let glowX = -9999;
    let glowY = -9999;
    let lastSparkleX = -9999;
    let lastSparkleY = -9999;

    const buildMotes = () => {
      const count = Math.round(Math.min(Math.max((w * h) / 16000, 36), 105));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.04, // gentle upward bias — pollen rising
        size: 5 + Math.random() * 18,
        alpha: 0.05 + Math.random() * 0.16,
        twPhase: Math.random() * Math.PI * 2,
        twSpeed: 0.3 + Math.random() * 0.9,
        color: Math.floor(Math.random() * MOTE_COLORS.length),
      }));
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildMotes();
    };
    resize();

    // ── Reduced motion: paint one static, calm field and stop. ──
    if (reduced) {
      ctx.globalCompositeOperation = 'source-over';
      for (const m of motes) {
        const s = m.size * 2;
        ctx.globalAlpha = m.alpha * 0.8;
        ctx.drawImage(moteSprites[m.color], m.x - s / 2, m.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const INFLUENCE = 200; // px radius of cursor influence

    let raf = 0;
    let t = 0;
    const frame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      // Ease the warm glow pool toward the pointer.
      if (pointerX > -9000) {
        glowX += (pointerX - glowX) * 0.08;
        glowY += (pointerY - glowY) * 0.08;
        const gs = 400;
        ctx.globalAlpha = 0.3;
        ctx.drawImage(glowSprite, glowX - gs / 2, glowY - gs / 2, gs, gs);
      }

      // Motes: drift, twinkle, and softly react to the cursor.
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;

        // wrap softly around edges
        if (m.x < -30) m.x = w + 30;
        else if (m.x > w + 30) m.x = -30;
        if (m.y < -30) m.y = h + 30;
        else if (m.y > h + 30) m.y = -30;

        let alpha = m.alpha * (0.7 + 0.3 * Math.sin(m.twPhase + t * m.twSpeed));
        let drawSize = m.size;

        if (pointerX > -9000) {
          const dx = glowX - m.x;
          const dy = glowY - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist < INFLUENCE) {
            const f = 1 - dist / INFLUENCE; // 0..1
            // ease toward the pointer + brighten + swell within the radius
            m.x += dx * 0.012 * f;
            m.y += dy * 0.012 * f;
            alpha = Math.min(0.85, alpha * (1 + f * 2.2));
            drawSize = m.size * (1 + f * 0.5);
          }
        }

        const s = drawSize * 2;
        ctx.globalAlpha = alpha;
        ctx.drawImage(moteSprites[m.color], m.x - s / 2, m.y - s / 2, s, s);
      }

      // Faint sparkle trail along quick pointer movement.
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i];
        sp.life -= 0.02;
        if (sp.life <= 0) {
          sparkles.splice(i, 1);
          continue;
        }
        const s = sp.size * sp.life * 2;
        ctx.globalAlpha = sp.life * 0.6;
        ctx.drawImage(moteSprites[4], sp.x - s / 2, sp.y - s / 2, s, s);
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // ── Listeners ──
    const onMove = (e: MouseEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (glowX < -9000) {
        glowX = pointerX;
        glowY = pointerY;
      }
      // spawn sparkles when moving fast enough
      const d = Math.hypot(pointerX - lastSparkleX, pointerY - lastSparkleY);
      if (d > 36 && sparkles.length < 24) {
        sparkles.push({
          x: pointerX + (Math.random() - 0.5) * 16,
          y: pointerY + (Math.random() - 0.5) * 16,
          life: 1,
          size: 3 + Math.random() * 4,
        });
        lastSparkleX = pointerX;
        lastSparkleY = pointerY;
      }
    };
    const onLeave = () => {
      pointerX = -9999;
      pointerY = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onResize = () => resize();

    if (finePointer) {
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('mouseout', onLeave, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    start();

    return () => {
      stop();
      if (finePointer) {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseout', onLeave);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* ── Living aurora (behind content) ── */}
      <div aria-hidden className="mavis-aurora" />
      {/* ── Cursor-reactive mote layer (on top, non-interactive) ── */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30"
        style={{ mixBlendMode: 'multiply' }}
      />
    </>
  );
}
