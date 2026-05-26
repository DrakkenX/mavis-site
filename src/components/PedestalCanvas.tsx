'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';

function Pedestal() {
  return (
    <group>
      {/* Main column */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 1.2, 64]} />
        <meshPhysicalMaterial
          color="#f4ece0"
          roughness={0.9}
          metalness={0}
          clearcoat={0.05}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.62, 0.58, 0.08, 64]} />
        <meshPhysicalMaterial
          color="#ead9c2"
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      {/* Base */}
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.72, 0.76, 0.08, 64]} />
        <meshPhysicalMaterial
          color="#ead9c2"
          roughness={0.85}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

export default function PedestalCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 3.5], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <directionalLight position={[0, 6, 2]} intensity={1.4} color="#fff8f0" />
      <directionalLight position={[-3, 2, 2]} intensity={0.3} color="#fce8e6" />
      <ambientLight intensity={0.5} color="#ffffff" />

      <Pedestal />

      <ContactShadows
        position={[0, -1.08, 0]}
        opacity={0.2}
        scale={4}
        blur={2}
        far={1.5}
      />

      <Environment preset="apartment" />
    </Canvas>
  );
}
