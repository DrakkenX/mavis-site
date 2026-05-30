'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/mavis.glb');

// Fake volumetric god-ray: semi-transparent additive cone above MAVIS.
// AdditiveBlending adds warmth to whatever geometry it overlaps — heavenly glow without postprocessing.
function LightShaft() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.032 + Math.sin(clock.elapsedTime * 0.55) * 0.010;
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
      >
        {/* Atmospheric cream haze — depth without darkness; matches cream-50 (#fdfcfa) */}
        <fog attach="fog" args={['#fdfcfa', 5, 16]} />

        {/* ─── Cinematic heavenly 5-point light rig ─── */}

        {/* Key: soft warm-white from above-front — "light descending from above" */}
        <directionalLight position={[1, 9, 4]} intensity={2.4} color="#fff8ec" />

        {/* Fill: mavis-sky tint from below-side — shadows stay luminous, never black */}
        <directionalLight position={[-5, -2, 3]} intensity={0.65} color="#b8d4e3" />

        {/* Gold rim right-back — divine silhouette edge glow */}
        <directionalLight position={[3, 3, -5]} intensity={1.4} color="#c8a25a" />

        {/* Gold rim left-back — symmetric halo */}
        <directionalLight position={[-3, 2, -4]} intensity={0.9} color="#d4aa5a" />

        {/* Ambient: luminous warm base — no harsh darks anywhere */}
        <ambientLight intensity={0.75} color="#fff8f0" />

        <Suspense fallback={null}>
          <CharacterModel scrollY={scrollY} onReady={() => setReady(true)} />
          <LightShaft />
        </Suspense>

        {/* Soft warm floor shadow — luminous, never black */}
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.10}
          scale={5}
          blur={4.5}
          far={2}
          color="#c2b5a5"
        />

        {/* ─── Heavenly Environment — Lightformers drive premium reflections ─── */}
        <Environment resolution={256}>
          {/* Top key ring: warm heaven glow pouring down */}
          <Lightformer
            form="ring"
            intensity={4}
            color="#fff8ec"
            position={[0, 8, 0]}
            scale={8}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {/* Front fill: cream softbox — luminous face/front */}
          <Lightformer
            form="rect"
            intensity={2}
            color="#fffaf5"
            position={[0, 2, 8]}
            scale={[8, 5, 1]}
          />
          {/* Gold rim right: divine edge on right silhouette */}
          <Lightformer
            form="rect"
            intensity={2.5}
            color="#c8a25a"
            position={[8, 4, -4]}
            scale={[2, 6, 1]}
            rotation={[0, -Math.PI / 3, 0]}
          />
          {/* Gold rim left: symmetric halo glow */}
          <Lightformer
            form="rect"
            intensity={1.8}
            color="#d4aa66"
            position={[-8, 4, -4]}
            scale={[2, 6, 1]}
            rotation={[0, Math.PI / 3, 0]}
          />
          {/* Sky underlight: cool fill from below — keeps shadow side from going muddy */}
          <Lightformer
            form="rect"
            intensity={1}
            color="#b8d4e3"
            position={[0, -5, 3]}
            scale={[10, 3, 1]}
          />
          {/* Surround: the "floating in light" atmosphere ring behind */}
          <Lightformer
            form="ring"
            intensity={0.8}
            color="#fffcf8"
            position={[0, 0, -12]}
            scale={14}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
