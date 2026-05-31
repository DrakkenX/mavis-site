'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
  Sparkles,
} from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/mavis.glb');

// ─── Stage 2: Light altar (hero scale) ──────────────────────────────────────
// Same sacred ground concept as CharacterCanvas but tuned for Hero:
// smaller footprint, more mystery, same gold halo sigil.
function LightAltar() {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.09 + Math.sin(t * 0.58) * 0.028;
    }
    if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.18 + Math.sin(t * 0.42 + 1.2) * 0.055;
    }
  });

  return (
    <group position={[0, -1.49, 0]}>
      {/* Outer halo pool */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 64]} />
        <meshBasicMaterial
          color="#fff8ec"
          transparent
          opacity={0.09}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner luminous center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 64]} />
        <meshBasicMaterial
          color="#fffaf5"
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gold halo ring — brand sigil */}
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

// ─── Stage 2: Hero motes — fewer, slower, more mysterious ───────────────────
// Hero is the intro, so less is more — hint at the world rather than showing it.
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

// ─── Mavis model (Stage 1, unchanged) ────────────────────────────────────────
function MavisModel({ onReady }: { onReady: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/mavis.glb');

  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current(); }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={meshRef} scale={[1, 1, 1]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── MavisCanvas (Hero) ───────────────────────────────────────────────────────
// Hero is the intro: preserve mystery. No full cloudscape — just altar + motes.
// The Character section is where the world opens up.
export default function MavisCanvas() {
  const [ready, setReady] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        opacity: ready ? 1 : 0,
        transition: 'opacity 900ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => camera.lookAt(0, -0.4, 0)}
      >
        {/* ─── Stage 1: Cinematic heavenly light rig (hero scale) ─── */}
        <directionalLight position={[2, 8, 5]} intensity={2.2} color="#fff8ec" />
        <directionalLight position={[-5, -1, 3]} intensity={0.5} color="#b8d4e3" />
        <directionalLight position={[0, 2, -6]} intensity={1.2} color="#c8a25a" />
        <ambientLight intensity={0.7} color="#fff8f0" />

        {/* Stage 2: Sparse hero motes — hint at the world, don't reveal it */}
        <HeroMotes />

        <Suspense fallback={null}>
          <MavisModel onReady={() => setReady(true)} />
        </Suspense>

        {/* Stage 2: Light altar — the sacred ground MAVIS rests above */}
        <LightAltar />

        {/* Stage 1: Soft warm floor shadow */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.12}
          scale={5}
          blur={3.5}
          far={2}
          color="#c2b5a5"
        />

        {/* Stage 1: Heavenly Environment — Lightformers for model reflections */}
        <Environment resolution={256}>
          <Lightformer form="ring" intensity={3.5} color="#fff8ec" position={[0, 8, 0]} scale={8} rotation={[Math.PI / 2, 0, 0]} />
          <Lightformer form="rect" intensity={1.8} color="#fffaf5" position={[0, 2, 8]} scale={[8, 5, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#c8a25a" position={[6, 4, -4]} scale={[2, 5, 1]} rotation={[0, -Math.PI / 3, 0]} />
          <Lightformer form="rect" intensity={1.5} color="#d4aa66" position={[-6, 4, -4]} scale={[2, 5, 1]} rotation={[0, Math.PI / 3, 0]} />
          <Lightformer form="rect" intensity={0.8} color="#b8d4e3" position={[0, -5, 3]} scale={[10, 3, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}
