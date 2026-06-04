'use client';

import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

// ─── PostFX ───────────────────────────────────────────────────────────────────
// Cinematic post-processing stack (punch-list #1). Designed for a DEDICATED,
// OPAQUE <Canvas> — NOT for use inside a drei <View>:
//   • A standard EffectComposer does a fullscreen pass over the whole drawing
//     buffer and ignores the per-View scissor, so it can only own its canvas.
//   • It must be opaque. Over a transparent canvas the composer's RGBA round-trip
//     leaves a faint canvas-bounded wash; an opaque cream backdrop avoids it and
//     gives the full-frame effects (Vignette/grain) real pixels to work on.
//
// Tuned subtle on purpose — over-bloom / heavy DoF reads cheap (see UPGRADE.md
// performance guardrails). ChromaticAberration is intentionally omitted (the
// brief lists it as optional); add later if the mood pass calls for it.
export default function PostFX() {
  return (
    <EffectComposer multisampling={4} frameBufferType={THREE.HalfFloatType}>
      {/* Subject (MAVIS) sits ~4 units out; wide focus range keeps the star razor
          sharp and only softens an extreme fore/background. DoF earns its keep
          later in the depth-rich cloudscape scenes, not on a single object. */}
      <DepthOfField worldFocusDistance={4} worldFocusRange={12} bokehScale={1} />
      {/* Gentle glow on the model's lit highlights + the gold ring halo. */}
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.5}
      />
      {/* ACES tonemap — the composer bypasses the renderer's own tonemapping. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* Lens framing — darkens corners of the cream field for cinematic depth. */}
      <Vignette offset={0.3} darkness={0.55} eskil={false} blendFunction={BlendFunction.NORMAL} />
      {/* Film grain — premultiplied, very low opacity so the cream stays clean. */}
      <Noise premultiply opacity={0.04} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
