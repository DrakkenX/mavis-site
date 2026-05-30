'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload shares the cache with MavisCanvas — no extra network cost.
useGLTF.preload('/models/mavis.glb');

// ─── Pedestal geometry ────────────────────────────────────────────────────────

function Pedestal() {
  return (
    <group>
      {/* Main column */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 1.2, 64]} />
        <meshPhysicalMaterial color="#f4ece0" roughness={0.9} metalness={0} clearcoat={0.05} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.62, 0.58, 0.08, 64]} />
        <meshPhysicalMaterial color="#ead9c2" roughness={0.85} metalness={0} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.72, 0.76, 0.08, 64]} />
        <meshPhysicalMaterial color="#ead9c2" roughness={0.85} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Ghosted silhouette ────────────────────────────────────────────────────────

function Silhouette({ revealed }: { revealed: boolean }) {
  const { scene } = useGLTF('/models/mavis.glb');

  // Independent transform hierarchy — materials overridden below.
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Replace every mesh material with flat gold MeshBasic.
  // Stored in a flat array so useFrame doesn't traverse each frame.
  const ghostMaterials = useMemo(() => {
    const mats: THREE.MeshBasicMaterial[] = [];
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#c8a25a'), // gold
          transparent: true,
          opacity: 0,
          depthWrite: false,         // doesn't occlude pedestal below
          side: THREE.DoubleSide,    // correct regardless of normal direction
        });
        mesh.material = mat;
        mats.push(mat);
      }
    });
    return mats;
  }, [clonedScene]);

  const groupRef = useRef<THREE.Group>(null);
  // 0 = fully hidden, 1 = fully revealed. Lerped each frame.
  const progressRef = useRef(0);

  const prefersReduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const target = revealed ? 1 : 0;

    if (prefersReduced.current) {
      // Reduced-motion: jump to target, no animation
      progressRef.current = target;
    } else {
      // Exponential lerp — forward 1400ms, reverse 900ms.
      // delta/speed * 5 gives a natural ease-out that reaches ~99% at the target time.
      const speed = revealed ? 1.4 : 0.9;
      const factor = Math.min((delta / speed) * 5, 1);
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, factor);
    }

    const p = progressRef.current;

    // Opacity: 0 → 0.22 (spec max — tease, not reveal)
    const opacity = p * 0.22;
    ghostMaterials.forEach((mat) => { mat.opacity = opacity; });

    // Rise: Y from just below pedestal surface (-0.08) to floating above (+0.28)
    // 0.36 world-unit arc over 1400ms — reads as something materialising.
    groupRef.current.position.y = p * 0.36 - 0.08;
  });

  return (
    // Different Y rotation from hero MAVIS so it reads as "unidentified creature"
    <group ref={groupRef} position={[0, -0.08, 0]} rotation={[0, 0.6, 0]} scale={[0.88, 0.88, 0.88]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── Canvas ────────────────────────────────────────────────────────────────────

interface PedestalCanvasProps {
  revealed?: boolean;
}

export default function PedestalCanvas({ revealed = false }: PedestalCanvasProps) {
  return (
    // frameloop="always": silhouette animation needs continuous useFrame.
    // Perf tradeoff: one 300×340px canvas at 60fps. Acceptable — flagged.
    // Prior frameloop="demand" removed because toggling it cleanly with animation
    // state would require invalidate() choreography for no meaningful gain.
    <Canvas
      camera={{ position: [0, 0.5, 3.5], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      frameloop="always"
      style={{ background: 'transparent' }}
    >
      <directionalLight position={[0, 6, 2]} intensity={1.4} color="#fff8f0" />
      <directionalLight position={[-3, 2, 2]} intensity={0.3} color="#fce8e6" />
      {/* Cool directional from above — Moment 3's coldest beat */}
      <directionalLight position={[0, 5, 0]} intensity={0.6} color="#e6f0ff" />
      <ambientLight intensity={0.5} color="#ffffff" />

      <Pedestal />

      {/* Silhouette suspends until GLB is in cache — fallback null means
          invisible until ready (resolves instantly since MavisCanvas preloads). */}
      <Suspense fallback={null}>
        <Silhouette revealed={revealed} />
      </Suspense>

      <ContactShadows position={[0, -1.08, 0]} opacity={0.2} scale={4} blur={2} far={1.5} />

      <Environment preset="apartment" />
    </Canvas>
  );
}
