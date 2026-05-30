'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/mavis.glb');

function CharacterModel({ scrollY, onReady }: { scrollY: number; onReady: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/mavis.glb');

  // Fire once on mount — Suspense only renders this when the GLB is ready.
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
    // Opacity wrapper: fades in when the GLB resolves.
    // GLB is preloaded at module level, so on fast connections this is near-instant.
    // On slow connections it prevents a hard pop into an already-visible section.
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
        {/* Key light — golden hour */}
        <directionalLight position={[4, 6, 3]} intensity={1.6} color="#ffe4b0" />
        {/* Fill */}
        <directionalLight position={[-4, 2, 2]} intensity={0.3} color="#fff0e0" />
        {/* Peach rim from camera-right */}
        <directionalLight position={[3, 0, -3]} intensity={0.5} color="#fdc09a" />
        {/* Ambient */}
        <ambientLight intensity={0.4} color="#fff8f0" />

        <Suspense fallback={null}>
          <CharacterModel scrollY={scrollY} onReady={() => setReady(true)} />
        </Suspense>

        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.2}
          scale={5}
          blur={2.5}
          far={2}
        />

        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}
