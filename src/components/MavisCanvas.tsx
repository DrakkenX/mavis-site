'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function MavisPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Gentle floating
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    // Slow rotation
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color="#fdfcfa"
        roughness={0.85}
        metalness={0}
        clearcoat={0.1}
        sheen={0.5}
        sheenColor="#fde4d0"
        sheenRoughness={1}
      />
    </mesh>
  );
}

export default function MavisCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color="#fff5e6"
      />

      {/* Fill light */}
      <directionalLight
        position={[-5, 3, 2]}
        intensity={0.4}
        color="#e6f0ff"
      />

      {/* Rim light */}
      <directionalLight
        position={[0, 2, -5]}
        intensity={0.3}
        color="#c8a25a"
      />

      {/* Ambient */}
      <ambientLight intensity={0.5} color="#ffffff" />

      <MavisPlaceholder />

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.25}
        scale={5}
        blur={2}
        far={2}
      />

      <Environment preset="apartment" />
    </Canvas>
  );
}
