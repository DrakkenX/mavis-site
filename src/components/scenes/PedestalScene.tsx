'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import MavisStage from './MavisStage';

// ─── Pedestal geometry ────────────────────────────────────────────────────────
function Pedestal() {
  return (
    <group>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 1.2, 64]} />
        <meshPhysicalMaterial color="#f4ece0" roughness={0.9} metalness={0} clearcoat={0.05} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.62, 0.58, 0.08, 64]} />
        <meshPhysicalMaterial color="#ead9c2" roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.72, 0.76, 0.08, 64]} />
        <meshPhysicalMaterial color="#ead9c2" roughness={0.85} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Ghosted silhouette ───────────────────────────────────────────────────────
function Silhouette({ revealed }: { revealed: boolean }) {
  const { scene } = useGLTF('/models/mavis.glb');
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const ghostMaterials = useMemo(() => {
    const mats: THREE.MeshBasicMaterial[] = [];
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#c8a25a'),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        mesh.material = mat;
        mats.push(mat);
      }
    });
    return mats;
  }, [clonedScene]);

  const groupRef = useRef<THREE.Group>(null);
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
      progressRef.current = target;
    } else {
      const speed = revealed ? 1.4 : 0.9;
      const factor = Math.min((delta / speed) * 5, 1);
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, factor);
    }

    const p = progressRef.current;
    const opacity = p * 0.22;
    ghostMaterials.forEach((mat) => { mat.opacity = opacity; });
    groupRef.current.position.y = p * 0.36 - 0.08;
  });

  return (
    <group ref={groupRef} position={[0, -0.08, 0]} rotation={[0, 0.6, 0]} scale={[0.88, 0.88, 0.88]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── PedestalScene ────────────────────────────────────────────────────────────
// Pure R3F scene graph — no <Canvas>. Mount inside a <View> in ClientPage.
// Camera is configured externally (ViewCamera in ClientPage).
export default function PedestalScene({ revealed = false }: { revealed?: boolean }) {
  return (
    <>
      {/* Unified warm lighting + grounding. (Was Environment preset="apartment" —
          a cool indoor HDRI that broke the site's warm identity.) The pedestal sits
          lower, so the shadow drops to the base plinth. */}
      <MavisStage
        shadowY={-1.08}
        shadowScale={4}
        shadowBlur={2.6}
        shadowOpacity={0.26}
        shadowFar={1.6}
      />

      <Pedestal />

      <Suspense fallback={null}>
        <Silhouette revealed={revealed} />
      </Suspense>
    </>
  );
}
