'use client';

import { useRef, useState, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { View } from '@react-three/drei';
import * as THREE from 'three';

import Hero from '@/components/sections/hero';
import Manifesto from '@/components/sections/manifesto';
import Character from '@/components/sections/character';
import Universe from '@/components/sections/universe';
import Newsletter from '@/components/sections/newsletter';
import Footer from '@/components/sections/footer';

import MavisScene from '@/components/scenes/MavisScene';
import CharacterScene from '@/components/scenes/CharacterScene';
import TraitScene from '@/components/scenes/TraitScene';
import PedestalScene from '@/components/scenes/PedestalScene';
// ─── ViewCamera ───────────────────────────────────────────────────────────────
// Creates a fresh THREE.PerspectiveCamera per View, registers it as that View's
// portal-default camera, and applies lookAt. Must render INSIDE a <View> so that
// useThree() returns the portal's own Zustand store (not the root store).
// The portal store has its own `set` — calling set({ camera }) updates only this
// View's camera, leaving root and sibling Views unaffected.
type Vec3 = [number, number, number];

function ViewCamera({ fov, position, lookAt }: { fov: number; position: Vec3; lookAt: Vec3 }) {
  const { set, camera: inherited, size } = useThree();

  useLayoutEffect(() => {
    const aspect = size.width > 0 && size.height > 0
      ? size.width / size.height
      : 1;
    const cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    cam.position.set(...position);
    cam.lookAt(...lookAt);
    cam.updateProjectionMatrix();
    set({ camera: cam });
    return () => set({ camera: inherited });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ─── ClientPage ───────────────────────────────────────────────────────────────
// Single shared WebGL context via drei <View>. One <Canvas> fixed over the
// viewport; each section renders a tracking <div> and its corresponding <View>
// scissors-renders onto the fixed canvas at that div's bounding rect.
export default function ClientPage() {
  // ── Tracking refs (DOM elements Views track via getBoundingClientRect) ──
  const heroRef    = useRef<HTMLDivElement>(null);
  const charRef    = useRef<HTMLDivElement>(null);
  const trait0Ref  = useRef<HTMLDivElement>(null);
  const trait1Ref  = useRef<HTMLDivElement>(null);
  const trait2Ref  = useRef<HTMLDivElement>(null);
  const uniRef     = useRef<HTMLDivElement>(null);
  const pedRef     = useRef<HTMLDivElement>(null);

  const traitRefs = [trait0Ref, trait1Ref, trait2Ref] as [
    React.RefObject<HTMLDivElement | null>,
    React.RefObject<HTMLDivElement | null>,
    React.RefObject<HTMLDivElement | null>,
  ];

  // ── Cross-cutting state ───────────────────────────────────────────────────
  const [scrollY, setScrollY]           = useState(0);
  const [revealed, setRevealed]         = useState(false);
  const [hoveredTrait, setHoveredTrait] = useState<number | null>(null);

  return (
    <div>
      <main>
        <Hero canvasRef={heroRef} />
        <Manifesto />
        <Character
          charRef={charRef}
          traitRefs={traitRefs}
          onScrollYChange={setScrollY}
          hoveredTrait={hoveredTrait}
          onHoveredTrait={setHoveredTrait}
        />
        <Universe
          mavisRef={uniRef}
          pedestalRef={pedRef}
          revealed={revealed}
          onRevealChange={setRevealed}
        />
        <Newsletter />
        <Footer />
      </main>

      {/*
        Fixed Canvas rendered AFTER <main> in DOM — painted on top of sections.
        alpha: true + transparent background means only scissored View areas have
        pixels; section backgrounds show through the transparent areas.
        pointer-events: none — all HTML interaction passes through.
      */}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        {/* ── Hero MAVIS ── */}
        <View track={heroRef as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={38} position={[0, 0, 4]} lookAt={[0, -0.4, 0]} />
          <MavisScene />
        </View>

        {/* ── Character (big MAVIS with full cloudscape) ── */}
        <View track={charRef as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={40} position={[0, 0.5, 4.5]} lookAt={[0, -0.5, 0]} />
          <CharacterScene scrollY={scrollY} />
        </View>

        {/* ── Three trait mood canvases ── */}
        <View track={trait0Ref as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={45} position={[0, 0.3, 3.5]} lookAt={[0, -0.4, 0]} />
          <TraitScene mood="quiet" hovered={hoveredTrait === 0} />
        </View>
        <View track={trait1Ref as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={45} position={[0, 0.3, 3.5]} lookAt={[0, -0.4, 0]} />
          <TraitScene mood="curious" hovered={hoveredTrait === 1} />
        </View>
        <View track={trait2Ref as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={45} position={[0, 0.3, 3.5]} lookAt={[0, -0.4, 0]} />
          <TraitScene mood="patient" hovered={hoveredTrait === 2} />
        </View>

        {/* ── Universe Moment 2 MAVIS ── */}
        <View track={uniRef as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={38} position={[0, 0, 4]} lookAt={[0, -0.4, 0]} />
          <MavisScene />
        </View>

        {/* ── Pedestal + silhouette ── */}
        <View track={pedRef as unknown as React.MutableRefObject<HTMLElement>}>
          <ViewCamera fov={36} position={[0, 0.5, 3.5]} lookAt={[0, -0.05, 0]} />
          <PedestalScene revealed={revealed} />
        </View>

        <View.Port />
      </Canvas>
    </div>
  );
}
