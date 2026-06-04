'use client';

import { Canvas } from '@react-three/fiber';
import MavisScene from './MavisScene';
import PostFX from './PostFX';

// ─── HeroCanvas ─────────────────────────────────────────────────────────────
// Dedicated WebGL context for the hero (the star). The rest of the site shares
// ONE context via drei <View> to stay under the browser context limit; the hero
// gets its own <Canvas> so it can run a real EffectComposer (punch-list #1) —
// post-processing can't run inside a scissored <View>. Two contexts is well
// under the cap.
//
// Full-bleed + OPAQUE cream backdrop (matches page cream-50, #fdfcfa). An opaque
// frame is required for clean post: a transparent canvas leaves a faint wash
// through the composer, and Vignette/grain need real pixels. The cream fill +
// vignette gives the whole hero a cinematic, gently-darkened frame.
export default function HeroCanvas() {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      camera={{ fov: 34, position: [0, 0.05, 5.4] }}
      onCreated={({ camera }) => camera.lookAt(0, -0.7, 0)}
    >
      {/* Opaque cream backdrop — matches the page so the section reads seamless */}
      <color attach="background" args={['#fdfcfa']} />
      <MavisScene />
      <PostFX />
    </Canvas>
  );
}
