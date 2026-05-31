'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
  Cloud,
  Clouds,
  Sparkles,
} from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/mavis.glb');

// ─── Stage 1 (preserved): God-ray shaft ─────────────────────────────────────
// Additive-blended cone — warms whatever geometry it overlaps, fake volumetric.
// Now reads as light breaking THROUGH the cloud layers onto the altar.
function LightShaft() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.032 + Math.sin(clock.elapsedTime * 0.55) * 0.010;
  });
  return (
    <mesh ref={ref} position={[0, 2.2, -0.4]}>
      <coneGeometry args={[1.7, 5.8, 20, 1, true]} />
      <meshBasicMaterial
        color="#fff8ec"
        transparent
        opacity={0.036}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── Stage 2: Cloudscape depth layers ───────────────────────────────────────
// MeshBasicMaterial = self-luminous, unlit — clouds glow rather than being
// shaded by scene lights. drei scene.fog at near=5 naturally fades the BG
// clouds (z=-5.5 to -7, ~8+ units from camera) into cream haze. FG wisp
// at z=1.2 is within near=5 so it shows crisply — sells the depth illusion.
// Approach: drei <Clouds> — it handled the look; see report below.
function CloudLayers() {
  return (
    <Clouds material={THREE.MeshBasicMaterial} limit={60}>
      {/* BG left — large mass fading into luminous atmosphere */}
      <Cloud
        position={[-2.5, 1.2, -6.5] as [number, number, number]}
        segments={22}
        bounds={[6, 1.4, 1.2] as [number, number, number]}
        volume={4.5}
        color="#fdfcfa"
        fade={45}
        seed={42}
        opacity={0.16}
        speed={0.08}
      />
      {/* BG right — offset layer, warmer tint for depth separation */}
      <Cloud
        position={[3, -0.3, -7] as [number, number, number]}
        segments={18}
        bounds={[5, 1.2, 1] as [number, number, number]}
        volume={3.5}
        color="#f5ede0"
        fade={55}
        seed={7}
        opacity={0.11}
        speed={0.06}
      />
      {/* BG top — high wisp above/around the god-ray column */}
      <Cloud
        position={[0.5, 2.8, -5.5] as [number, number, number]}
        segments={14}
        bounds={[4, 0.8, 0.8] as [number, number, number]}
        volume={2.5}
        color="#fdfcfa"
        fade={40}
        seed={13}
        opacity={0.09}
        speed={0.05}
      />
      {/* FG wisp — in FRONT of MAVIS; out-of-focus depth layer.
          This is the Igloo secret: foreground sells depth faster than BG detail. */}
      <Cloud
        position={[-1.8, 0.3, 1.2] as [number, number, number]}
        segments={7}
        bounds={[1.8, 0.4, 0.25] as [number, number, number]}
        volume={1.2}
        color="#fffaf5"
        fade={70}
        seed={99}
        opacity={0.06}
        speed={0.04}
      />
    </Clouds>
  );
}

// ─── Stage 2: Light altar ────────────────────────────────────────────────────
// Sacred platform: MAVIS rests on light, not solid material.
// Three concentric layers — outer halo, inner pool, gold ring (brand sigil).
// All additive-blended: they add luminosity, never block the shadow beneath.
// Positioned y=-1.39 (1mm above ContactShadows at -1.4) to avoid z-fight.
function LightAltar() {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Outer halo: slow breathe
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.10 + Math.sin(t * 0.58) * 0.033;
    }
    // Gold ring: slightly offset phase — feels organic, not mechanical
    if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.20 + Math.sin(t * 0.42 + 1.2) * 0.065;
    }
  });

  return (
    <group position={[0, -1.39, 0]}>
      {/* Outer glow disc — wide, barely perceptible, additive light pool */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial
          color="#fff8ec"
          transparent
          opacity={0.10}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner disc — tighter, slightly more luminous center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65, 64]} />
        <meshBasicMaterial
          color="#fffaf5"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gold halo ring — brand sigil, sacred circle, divine consecration */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.013, 8, 128]} />
        <meshBasicMaterial
          color="#c8a25a"
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── Stage 2: Heavenly motes ─────────────────────────────────────────────────
// Gold + cream dust drifting slowly — dust in a sunbeam, scale and life.
// Two passes: warm gold for sparkle, soft cream for atmospheric fill.
// Intentionally sparse and slow — atmosphere, not confetti.
function HeavenlyMotes() {
  return (
    <>
      <Sparkles
        count={28}
        scale={[5, 5, 4] as [number, number, number]}
        size={1.0}
        speed={0.15}
        opacity={0.26}
        color="#c8a25a"
        noise={0.4}
      />
      <Sparkles
        count={20}
        scale={[6, 4, 5] as [number, number, number]}
        size={0.7}
        speed={0.10}
        opacity={0.16}
        color="#fffaf5"
        noise={0.6}
      />
    </>
  );
}

// ─── Character model (Stage 1, unchanged) ────────────────────────────────────
function CharacterModel({ scrollY, onReady }: { scrollY: number; onReady: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/mavis.glb');

  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current(); }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
    meshRef.current.rotation.y = scrollY * 0.002 + state.clock.elapsedTime * 0.001;
  });

  return (
    <group ref={meshRef} scale={[1.2, 1.2, 1.2]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── CharacterCanvas ─────────────────────────────────────────────────────────
export default function CharacterCanvas({ scrollY = 0 }: { scrollY?: number }) {
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
        camera={{ position: [0, 0.5, 2.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => camera.lookAt(0, -0.3, 0)}
      >
        {/* Stage 1: Atmospheric cream haze — near=5 naturally fades BG clouds */}
        <fog attach="fog" args={['#fdfcfa', 5, 16]} />

        {/* ─── Stage 1: Cinematic 5-point heavenly light rig ─── */}
        {/* Key: warm-white from above-front */}
        <directionalLight position={[1, 9, 4]} intensity={2.4} color="#fff8ec" />
        {/* Fill: mavis-sky from below-side, shadows stay luminous */}
        <directionalLight position={[-5, -2, 3]} intensity={0.65} color="#b8d4e3" />
        {/* Gold rim right-back: divine silhouette edge */}
        <directionalLight position={[3, 3, -5]} intensity={1.4} color="#c8a25a" />
        {/* Gold rim left-back: symmetric halo */}
        <directionalLight position={[-3, 2, -4]} intensity={0.9} color="#d4aa5a" />
        {/* Ambient: luminous warm base */}
        <ambientLight intensity={0.75} color="#fff8f0" />

        {/* Stage 2: Cloudscape — world depth around MAVIS */}
        <CloudLayers />

        {/* Stage 2: Motes — gold/cream dust drifting in heaven-light */}
        <HeavenlyMotes />

        {/* Stage 1 + 2: Model, god-ray (light through clouds), altar (sacred ground) */}
        <Suspense fallback={null}>
          <CharacterModel scrollY={scrollY} onReady={() => setReady(true)} />
          <LightShaft />
        </Suspense>

        {/* Stage 2: Light altar — stays fixed, MAVIS floats above it */}
        <LightAltar />

        {/* Stage 1: Soft warm floor shadow */}
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.10}
          scale={5}
          blur={4.5}
          far={2}
          color="#c2b5a5"
        />

        {/* Stage 1: Heavenly Environment — Lightformers for model reflections */}
        <Environment resolution={256}>
          <Lightformer form="ring" intensity={4} color="#fff8ec" position={[0, 8, 0]} scale={8} rotation={[Math.PI / 2, 0, 0]} />
          <Lightformer form="rect" intensity={2} color="#fffaf5" position={[0, 2, 8]} scale={[8, 5, 1]} />
          <Lightformer form="rect" intensity={2.5} color="#c8a25a" position={[8, 4, -4]} scale={[2, 6, 1]} rotation={[0, -Math.PI / 3, 0]} />
          <Lightformer form="rect" intensity={1.8} color="#d4aa66" position={[-8, 4, -4]} scale={[2, 6, 1]} rotation={[0, Math.PI / 3, 0]} />
          <Lightformer form="rect" intensity={1} color="#b8d4e3" position={[0, -5, 3]} scale={[10, 3, 1]} />
          <Lightformer form="ring" intensity={0.8} color="#fffcf8" position={[0, 0, -12]} scale={14} />
        </Environment>
      </Canvas>
    </div>
  );
}
