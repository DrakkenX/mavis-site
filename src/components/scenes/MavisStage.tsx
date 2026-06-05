'use client';

import { ContactShadows, Environment, Lightformer } from '@react-three/drei';

// ─── MavisStage ───────────────────────────────────────────────────────────────
// The ONE canonical lighting + grounding rig for every MAVIS instance on the site
// (Item #2). igloo-style image-based lighting built from hand-placed Lightformers
// (a controlled studio, not a stock HDRI preset) so the ceramic creature reads with
// soft wraparound light + believable highlights — PLUS a crisp warm key and a gold
// rim that separates MAVIS from the cream field, and a soft warm ContactShadow that
// grounds it on a surface instead of floating in a void.
//
// Routing every scene through this guarantees ONE warm light identity everywhere —
// consistency is the whole point. Per-scene atmosphere (clouds, god-rays, altars,
// mood tints) layers on top; scenes that art-direct their own lights pass
// `lights={false}` and keep just the shared Environment + grounding.
//
// Costs: the Environment renders its cube ONCE (Lightformers are static — drei
// Environment defaults to frames=1), so N instances = N cheap one-time bakes.
// ContactShadows stay live (models bob/rotate) but each is a small depth pass.

type Vec3 = [number, number, number];

export interface MavisStageProps {
  /** Include the default warm key/fill/rim light rig. Off when a scene supplies its own (e.g. per-mood traits). */
  lights?: boolean;
  /** Multiplies the image-based lighting contribution (scene.environmentIntensity). */
  envIntensity?: number;
  /** Gold rim light for separation from the cream backdrop. */
  rim?: boolean;
  /** Y of the shadow catcher — set to just under each model's base. */
  shadowY?: number;
  shadowScale?: number;
  shadowOpacity?: number;
  shadowBlur?: number;
  shadowFar?: number;
  /** Warm umber shadow reads grounded; a gray shadow reads CGI. */
  shadowColor?: string;
  shadowResolution?: number;
}

export default function MavisStage({
  lights = true,
  envIntensity = 1,
  rim = true,
  shadowY = -1.5,
  shadowScale = 5,
  shadowOpacity = 0.22,
  shadowBlur = 3.2,
  shadowFar = 2.2,
  shadowColor = '#4a3a28',
  shadowResolution = 512,
}: MavisStageProps) {
  return (
    <>
      {lights && (
        <>
          {/* Warm key — primary shaping + the crisp highlight on the glaze */}
          <directionalLight position={[2.5, 6, 4]} intensity={2.0} color="#fff4e2" />
          {/* Cool sky fill — keeps the shadow side from going muddy */}
          <directionalLight position={[-5, 0.5, 2]} intensity={0.45} color="#cfe2ef" />
          {/* Gold rim from behind — the igloo "edge light" that lifts MAVIS off the cream */}
          {rim && (
            <directionalLight position={[-2.5, 3, -6]} intensity={1.7} color="#e6b063" />
          )}
          <ambientLight intensity={0.32} color="#fff6ec" />
        </>
      )}

      {/* Grounded warm contact shadow — soft but PRESENT (real grounding, not a hint) */}
      <ContactShadows
        position={[0, shadowY, 0]}
        opacity={shadowOpacity}
        scale={shadowScale}
        blur={shadowBlur}
        far={shadowFar}
        color={shadowColor}
        resolution={shadowResolution}
      />

      {/* Hand-built warm studio — soft wraparound base + warm/cool panels for form */}
      <Environment resolution={256} environmentIntensity={envIntensity}>
        {/* Big soft overhead key ring — the dominant soft light */}
        <Lightformer
          form="ring"
          intensity={3.6}
          color="#fff6e8"
          position={[0, 8, 1]}
          scale={9}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {/* Front fill panel — gentle frontal lift */}
        <Lightformer
          form="rect"
          intensity={1.9}
          color="#fffaf4"
          position={[0, 2, 8]}
          scale={[9, 6, 1] as Vec3}
        />
        {/* Warm gold side panel (right) — warm wrap + speculars */}
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#e8b878"
          position={[7, 4, -3]}
          scale={[2.5, 6, 1] as Vec3}
          rotation={[0, -Math.PI / 3, 0]}
        />
        {/* Amber side panel (left) — asymmetric warmth */}
        <Lightformer
          form="rect"
          intensity={1.7}
          color="#d4aa66"
          position={[-7, 4, -3]}
          scale={[2.5, 6, 1] as Vec3}
          rotation={[0, Math.PI / 3, 0]}
        />
        {/* Cool underglow — a touch of sky bounce from below */}
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#bcd6e6"
          position={[0, -5, 3]}
          scale={[10, 3, 1] as Vec3}
        />
        {/* Distant back ambient ring — fills the rear hemisphere softly */}
        <Lightformer
          form="ring"
          intensity={0.7}
          color="#fffcf8"
          position={[0, 0, -12]}
          scale={14}
        />
      </Environment>
    </>
  );
}
