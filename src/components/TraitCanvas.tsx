'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

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

  // Clone so each canvas owns an independent transform hierarchy.
  // Geometry + materials are shared (same GPU buffers) — intentional.
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const cfg = MOOD_CONFIG[mood];

  // Set initial rotation once, then spin if needed — avoids JSX prop / useFrame conflict
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
      {/* Key light */}
      <directionalLight
        position={[2, 3, 2]}
        intensity={cfg.keyIntensity * mult}
        color={cfg.keyColor}
      />
      {/* Fill light */}
      <directionalLight
        position={[-2, 1, 1]}
        intensity={cfg.fillIntensity * mult}
        color={cfg.fillColor}
      />
      {/* Gold rim — curious + patient only */}
      {cfg.rimColor !== null && (
        <directionalLight
          position={[3, 0, -3]}
          intensity={cfg.rimIntensity * mult}
          color={cfg.rimColor}
        />
      )}
      {/* Ambient */}
      <ambientLight intensity={cfg.ambientIntensity * mult} />

      <Float speed={1.0} rotationIntensity={0} floatIntensity={0.2}>
        <group ref={groupRef} position={[0, -0.4, 0]}>
          <primitive object={clonedScene} />
        </group>
      </Float>
    </>
  );
}

export interface TraitCanvasProps {
  mood: Mood;
  hovered?: boolean;
}

export default function TraitCanvas({ mood, hovered = false }: TraitCanvasProps) {
  return (
    <div style={{ width: 96, height: 96, flexShrink: 0 }}>
      <Canvas
        camera={{ position: [0, 0.3, 2.8], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <MavisMoodModel mood={mood} hovered={hovered} />
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.3}
            scale={3}
            blur={2}
            far={1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
