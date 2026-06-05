'use client';

import { useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles } from '@react-three/drei';
import { useRef, Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import MavisStage from './MavisStage';

useGLTF.preload('/models/mavis.glb');

// ─── Stage 2: Light altar (hero scale) ───────────────────────────────────────
// Just a thin gold ring now. The original large additive glow discs were dropped:
// big semi-transparent additive geometry doesn't survive the hero's EffectComposer
// RGBA round-trip on a transparent canvas — it composited into a pale "pillow" wash
// (and it wasn't opacity-linear, so dimming didn't help). Grounding instead comes
// from <ContactShadows> + a tasteful Bloom halo, both of which post cleanly. The
// thin ring is narrow enough to survive without washing.
function LightAltar() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.16 + Math.sin(t * 0.42 + 1.2) * 0.05;
    }
  });

  return (
    <group position={[0, -1.49, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.012, 8, 128]} />
        <meshBasicMaterial
          color="#c8a25a"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── Stage 2: Hero motes ─────────────────────────────────────────────────────
function HeroMotes() {
  return (
    <Sparkles
      count={18}
      scale={[4, 4, 3] as [number, number, number]}
      size={0.8}
      speed={0.10}
      opacity={0.20}
      color="#c8a25a"
      noise={0.5}
    />
  );
}

// ─── MAVIS model ──────────────────────────────────────────────────────────────
// Clones GLB scene — required when this component renders in multiple simultaneous
// Views sharing one WebGL context (Hero + Universe Moment 2). Clone shares GPU
// geometry/material buffers but has an independent Object3D hierarchy.
function MavisModel({ onReady }: { onReady?: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/mavis.glb');
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current?.(); }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={meshRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── MavisScene ───────────────────────────────────────────────────────────────
// Pure R3F scene graph — no <Canvas>. Mount inside a <View> in ClientPage.
// Camera is configured externally (ViewCamera in ClientPage).
export default function MavisScene({ onReady }: { onReady?: () => void }) {
  return (
    <>
      {/* Unified warm lighting + grounding (igloo-style IBL + gold rim + soft shadow) */}
      <MavisStage shadowY={-1.5} shadowScale={5} shadowBlur={3.4} shadowOpacity={0.2} />

      {/* Stage 2: Sparse hero motes — hint at the world, don't reveal it */}
      <HeroMotes />

      <Suspense fallback={null}>
        <MavisModel onReady={onReady} />
      </Suspense>

      {/* Stage 2: Light altar — sacred ground MAVIS rests above */}
      <LightAltar />
    </>
  );
}
