'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/mavis.glb');

function MavisModel({ onReady }: { onReady: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/mavis.glb');

  // Fire once on mount — Suspense only renders this when the GLB is ready.
  // Stored in a ref so the effect dependency is stable across renders.
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current(); }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Gentle floating
    meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    // Slow rotation
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={meshRef} scale={[1, 1, 1]}>
      <primitive object={scene} />
    </group>
  );
}

export default function MavisCanvas() {
  const [ready, setReady] = useState(false);

  return (
    // Opacity wrapper: 0 → 1 when the GLB resolves via Suspense.
    // Handles slow-connection case where the model loads after the Hero
    // motion.div entrance animation has already completed.
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
      >
        {/* Key light */}
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#fff5e6" />
        {/* Fill light */}
        <directionalLight position={[-5, 3, 2]} intensity={0.4} color="#e6f0ff" />
        {/* Rim light */}
        <directionalLight position={[0, 2, -5]} intensity={0.3} color="#c8a25a" />
        {/* Ambient */}
        <ambientLight intensity={0.5} color="#ffffff" />

        <Suspense fallback={null}>
          <MavisModel onReady={() => setReady(true)} />
        </Suspense>

        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.25}
          scale={5}
          blur={2}
          far={2}
        />

        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}
