'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import MavisStage from './MavisStage';

export type Mood = 'quiet' | 'curious' | 'patient';

interface MoodConfig {
  rotationY: number;
  rotationZ: number;
  keyColor: string;
  keyIntensity: number;
  fillColor: string;
  fillIntensity: number;
  rimColor: string | null;
  rimIntensity: number;
  ambientIntensity: number;
  spin: boolean;
}

const MOOD_CONFIG: Record<Mood, MoodConfig> = {
  quiet: {
    rotationY: -0.25,
    rotationZ: 0,
    keyColor: '#e6f0ff',
    keyIntensity: 0.7,
    fillColor: '#fff5e6',
    fillIntensity: 0.3,
    rimColor: null,
    rimIntensity: 0,
    ambientIntensity: 0.4,
    spin: false,
  },
  curious: {
    rotationY: 0,
    rotationZ: 0.08,
    keyColor: '#fff5e6',
    keyIntensity: 0.7,
    fillColor: '#e6f0ff',
    fillIntensity: 0.4,
    rimColor: '#c8a25a',
    rimIntensity: 0.3,
    ambientIntensity: 0.5,
    spin: true,
  },
  patient: {
    rotationY: 0.4,
    rotationZ: 0,
    keyColor: '#ffd9a8',
    keyIntensity: 0.8,
    fillColor: '#e6e6ff',
    fillIntensity: 0.2,
    rimColor: '#c8a25a',
    rimIntensity: 0.5,
    ambientIntensity: 0.6,
    spin: false,
  },
};

interface MavisMoodModelProps {
  mood: Mood;
  hovered: boolean;
}

function MavisMoodModel({ mood, hovered }: MavisMoodModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/mavis.glb');

  // Clone so each View owns an independent transform hierarchy.
  // Geometry + materials are GPU-shared (same buffers) — intentional.
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const cfg = MOOD_CONFIG[mood];

  const initializedRef = useRef(false);
  const prefersReduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useFrame(() => {
    if (!groupRef.current) return;

    if (!initializedRef.current) {
      groupRef.current.rotation.set(0, cfg.rotationY, cfg.rotationZ);
      initializedRef.current = true;
    }

    if (cfg.spin && !prefersReduced.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  const mult = hovered ? 1.15 : 1.0;

  return (
    <>
      <directionalLight position={[2, 3, 2]} intensity={cfg.keyIntensity * mult} color={cfg.keyColor} />
      <directionalLight position={[-2, 1, 1]} intensity={cfg.fillIntensity * mult} color={cfg.fillColor} />
      {cfg.rimColor !== null && (
        <directionalLight position={[3, 0, -3]} intensity={cfg.rimIntensity * mult} color={cfg.rimColor} />
      )}
      <ambientLight intensity={cfg.ambientIntensity * mult} />

      <Float speed={1.0} rotationIntensity={0} floatIntensity={0.2}>
        <group ref={groupRef} position={[0, -0.4, 0]}>
          <primitive object={clonedScene} />
        </group>
      </Float>
    </>
  );
}

// ─── TraitScene ───────────────────────────────────────────────────────────────
// Pure R3F scene graph — no <Canvas>. Mount inside a <View> in ClientPage.
// Camera is configured externally (ViewCamera in ClientPage).
export default function TraitScene({ mood, hovered = false }: { mood: Mood; hovered?: boolean }) {
  return (
    <Suspense fallback={null}>
      {/* Per-mood key/fill/rim lights live in MavisMoodModel; the stage adds the
          shared warm IBL (so materials match the rest of the site) + grounding.
          lights={false} keeps the mood tints in charge; envIntensity is dialed
          back so IBL shapes form without flattening each mood. */}
      <MavisStage
        lights={false}
        envIntensity={0.7}
        shadowY={-1.2}
        shadowScale={3}
        shadowBlur={2.4}
        shadowOpacity={0.28}
        shadowFar={1.5}
      />
      <MavisMoodModel mood={mood} hovered={hovered} />
    </Suspense>
  );
}
