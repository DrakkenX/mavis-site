'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/mavis.glb');

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
      >
        {/* ─── Cinematic heavenly light rig (hero scale) ─── */}

        {/* Key: warm-white from above-front */}
        <directionalLight position={[2, 8, 5]} intensity={2.2} color="#fff8ec" />

        {/* Fill: sky tint from below-left — luminous shadows */}
        <directionalLight position={[-5, -1, 3]} intensity={0.5} color="#b8d4e3" />

        {/* Gold rim from behind — divine edge glow */}
        <directionalLight position={[0, 2, -6]} intensity={1.2} color="#c8a25a" />

        {/* Ambient: luminous warm base */}
        <ambientLight intensity={0.7} color="#fff8f0" />

        <Suspense fallback={null}>
          <MavisModel onReady={() => setReady(true)} />
        </Suspense>

        {/* Soft warm floor shadow */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.12}
          scale={5}
          blur={3.5}
          far={2}
          color="#c2b5a5"
        />

        {/* ─── Heavenly Environment — Lightformers for premium reflections ─── */}
        <Environment resolution={256}>
          {/* Top key ring: heaven-light from above */}
          <Lightformer
            form="ring"
            intensity={3.5}
            color="#fff8ec"
            position={[0, 8, 0]}
            scale={8}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {/* Front cream fill: luminous face */}
          <Lightformer
            form="rect"
            intensity={1.8}
            color="#fffaf5"
            position={[0, 2, 8]}
            scale={[8, 5, 1]}
          />
          {/* Gold rim: divine silhouette edge */}
          <Lightformer
            form="rect"
            intensity={2.2}
            color="#c8a25a"
            position={[6, 4, -4]}
            scale={[2, 5, 1]}
            rotation={[0, -Math.PI / 3, 0]}
          />
          {/* Gold rim left */}
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#d4aa66"
            position={[-6, 4, -4]}
            scale={[2, 5, 1]}
            rotation={[0, Math.PI / 3, 0]}
          />
          {/* Sky underlight: cool fill from below */}
          <Lightformer
            form="rect"
            intensity={0.8}
            color="#b8d4e3"
            position={[0, -5, 3]}
            scale={[10, 3, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
