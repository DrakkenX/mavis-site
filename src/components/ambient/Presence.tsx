'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScreenQuad } from '@react-three/drei';
import * as THREE from 'three';

// ─── Presence ─────────────────────────────────────────────────────────────────
// THE single signature interactive background for the whole site. One warm world
// that feels alive and aware of the cursor. Not generic dust — one cohesive system:
//
//   • Living warm field  — a fullscreen GLSL fragment shader: a slow flowing
//     gradient (cream → peach → amber) that morphs like light through frosted
//     glass (domain-warped fbm noise), with faint film grain + soft vignette.
//   • Cursor = warmth     — a uPointer uniform blooms a soft golden glow at the
//     cursor and warms the field locally; it LERPS toward the pointer so it
//     follows tenderly, never snaps.
//   • Curious motes       — a sparse GPU points field that ambiently drifts but
//     gently steers toward the cursor within a radius (the creature's attention),
//     then disperses when the cursor leaves.
//   • Breath              — every ~9s a soft warmth pulse ripples out from centre,
//     a slow "alive / listening" beat.
//
// All four share ONE eased pointer, ONE clock, ONE breath — a single Canvas, a
// single WebGL context. Sections sit translucent (/70) over it so this one warm
// surface shows through the entire page with no seams.
//
// Guards: DPR capped; rAF (and thus this whole system) is paused automatically
// when the tab is hidden; cursor reaction only on fine/hover pointers (touch keeps
// the breathing field); prefers-reduced-motion paints one static frame and stops.

// Shared, mutable pointer state — eased once per frame by <Field> (mounts first),
// then read by <Motes>. uv-space (0..1, y-up) feeds the shader; world-px
// (centre-origin, y-up) feeds the motes.
type Pointer = {
  cx: number; // raw clientX  (-9999 = never moved)
  cy: number; // raw clientY
  activeTarget: number; // 1 while pointer present, 0 on leave
  active: number; // eased 0..1
  uvX: number; // eased uv x
  uvY: number; // eased uv y
  wx: number; // eased world-px x
  wy: number; // eased world-px y
  init: boolean; // snap eased values on first move (no slide-in from centre)
};

// ── Field: the warm flowing surface + cursor bloom + breath ──────────────────
const FIELD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0); // ScreenQuad: position is clip-space
  }
`;

const FIELD_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uPointer;  // uv 0..1
  uniform float uActive;   // 0..1
  uniform float uAspect;   // w/h
  uniform vec2  uRes;

  // warm palette — CREAM base matches the hero canvas (#fdfcfa) EXACTLY so the
  // opaque hero dissolves seamlessly into the field as you scroll out.
  const vec3 CREAM = vec3(0.992, 0.988, 0.980);
  const vec3 PEACH = vec3(0.973, 0.847, 0.733);
  const vec3 AMBER = vec3(0.953, 0.769, 0.541);
  const vec3 GOLD  = vec3(1.000, 0.831, 0.553);

  // ── Ashima simplex noise ──
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * snoise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main(){
    vec2 uv = vUv;
    vec2 p  = uv * vec2(uAspect, 1.0);
    float t = uTime * 0.035; // slow, ~minute-scale evolution

    vec2 pp  = uPointer * vec2(uAspect, 1.0);
    vec2 toC = pp - p;
    float dC = length(toC);

    // cursor BENDS the frosted glass — the domain flows toward the pointer
    float infl = exp(-dC * dC * 2.0) * uActive;
    vec2 warp = (toC / (dC + 1e-4)) * infl * 0.16;

    // two-scale flow heightfield (big slow clouds + finer warp), pulled by the cursor
    vec2 q = vec2(fbm(p * 1.3 + warp + vec2(0.0, t)),
                  fbm(p * 1.3 + warp + vec2(5.2, -t)));
    float big = fbm(p * 0.6 - vec2(t * 0.5, t * 0.2));
    float h   = fbm(p * 1.7 + q * 0.9 + t * 0.6);
    float nn  = (h * 0.5 + 0.5) * 0.82 + (big * 0.5 + 0.5) * 0.18;

    // surface NORMAL from the heightfield (2 cheap extra taps, q reused) → real 3D relief
    float e  = 0.05;
    float hX = fbm((p + vec2(e, 0.0)) * 1.7 + q * 0.9 + t * 0.6);
    float hY = fbm((p + vec2(0.0, e)) * 1.7 + q * 0.9 + t * 0.6);
    vec3 N = normalize(vec3((h - hX) * 14.0, (h - hY) * 14.0, 1.0));

    // base: predominantly cream (== hero) with warm pools — keeps text legible
    // ANCHORED light warm haze (no global tone swings): warmth sits at a constant
    // cream→peach mid, the fine noise only nudges it ± locally → soft dimensional
    // warmth that stays consistent + legible, with rare amber in the deep pools.
    float warmth = clamp(0.30 + (nn - 0.5) * 0.42, 0.08, 0.60);
    vec3 col = mix(CREAM, PEACH, warmth);
    col = mix(col, AMBER, smoothstep(0.74, 1.00, nn) * 0.14);
    col = mix(col, PEACH, smoothstep(0.42, -0.20, uv.y) * 0.10);

    // soft global emboss → the whole surface reads as a 3D frosted-glass relief
    col *= mix(0.95, 1.035, N.z);

    // cursor = a moving warm LIGHT raking across the 3D relief (the interactive 3D)
    vec3 Lc    = normalize(vec3(toC, 0.55));
    float atten = exp(-dC * dC * 1.3) * uActive;
    float diff  = max(dot(N, Lc), 0.0);
    col += GOLD * diff * atten * 0.9;
    // wet-glass specular glint that slides across the relief by the cursor
    vec3 Hh    = normalize(Lc + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(N, Hh), 0.0), 18.0) * atten;
    col += vec3(1.0, 0.96, 0.88) * spec * 1.1;

    // breath — soft warmth swell + a gentle expanding ring from centre every ~9s
    float phase = fract(uTime / 9.0);
    float swell = exp(-phase * 4.0);
    float dc    = distance(uv, vec2(0.5));
    float ring  = smoothstep(0.14, 0.0, abs(dc - phase * 1.1)) * (1.0 - phase);
    col += GOLD * (swell * 0.012 + ring * 0.038);

    // cursor warmth bloom — a wide soft halo + a brighter core
    float halo = smoothstep(0.55, 0.0, dC) * uActive;
    float core = smoothstep(0.22, 0.0, dC) * uActive;
    col = mix(col, PEACH, halo * 0.18);
    col = mix(col, GOLD, core * 0.20);
    col += GOLD * core * core * 0.22;

    // soft vignette for depth (volumetric haze feel)
    float vig = smoothstep(1.15, 0.32, dc);
    col *= mix(0.95, 1.0, vig);

    // faint film grain
    float g = hash21(uv * uRes + fract(uTime) * vec2(91.7, 113.3));
    col += (g - 0.5) * 0.016;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Field({ ptr, reduced }: { ptr: React.MutableRefObject<Pointer>; reduced: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size, invalidate } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uActive: { value: 0 },
      uAspect: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  // Reduced motion: set one calm frame and request a single render.
  useEffect(() => {
    if (!reduced || !mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value = 14.0;
    u.uActive.value = 0;
    u.uAspect.value = size.width / Math.max(1, size.height);
    u.uRes.value.set(size.width, size.height);
    invalidate();
  }, [reduced, size.width, size.height, invalidate]);

  useFrame(({ clock }) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    if (reduced) return; // static frame already painted

    const w = size.width;
    const h = size.height;
    const p = ptr.current;

    // ease "presence" of the cursor
    p.active += (p.activeTarget - p.active) * 0.05;

    if (p.cx > -9000) {
      const tuvx = p.cx / w;
      const tuvy = 1 - p.cy / h;
      const twx = p.cx - w / 2;
      const twy = h / 2 - p.cy;
      if (!p.init) {
        p.uvX = tuvx; p.uvY = tuvy; p.wx = twx; p.wy = twy; p.init = true;
      }
      // tender lerp toward the pointer (field follows softly)
      p.uvX += (tuvx - p.uvX) * 0.06;
      p.uvY += (tuvy - p.uvY) * 0.06;
      p.wx += (twx - p.wx) * 0.08;
      p.wy += (twy - p.wy) * 0.08;
    }

    u.uTime.value = clock.elapsedTime;
    u.uPointer.value.set(p.uvX, p.uvY);
    u.uActive.value = p.active;
    u.uAspect.value = w / h;
    u.uRes.value.set(w, h);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={FIELD_VERT}
        fragmentShader={FIELD_FRAG}
        depthTest={false}
        depthWrite={false}
      />
    </ScreenQuad>
  );
}

// ── Plexus: a drifting 3D constellation network (igloo-style) ────────────────
// Warm glowing nodes drift with depth/parallax, link to nearby neighbours with
// glowing threads, and reach out to the cursor — nodes near the pointer brighten,
// spiral in, and string lines to it. The signature interactive-3D background.
const NODE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aBright;
  uniform float uTime;
  uniform float uDpr;
  varying float vAlpha;
  varying vec3  vCol;
  const vec3 N_PEACH = vec3(0.80, 0.56, 0.34);
  const vec3 N_GOLD  = vec3(0.72, 0.49, 0.22);
  void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float tw = 0.6 + 0.4 * sin(uTime * 1.3 + aSeed * 6.2831);
    vAlpha = tw * (0.42 + aBright);
    vCol = mix(N_PEACH, N_GOLD, aSeed);
    gl_PointSize = aSize * uDpr * (1.0 + aBright * 0.8);
  }
`;
const NODE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying vec3  vCol;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.7);
    gl_FragColor = vec4(vCol, a * vAlpha);
  }
`;

// Lines carry a per-vertex alpha (fades with link distance); warm thread colour.
const LINE_VERT = /* glsl */ `
  attribute float aAlpha;
  varying float vA;
  void main(){
    vA = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const LINE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vA;
  const vec3 L_COL = vec3(0.66, 0.47, 0.25);
  void main(){ gl_FragColor = vec4(L_COL, vA); }
`;

const NODE_COUNT = 90;
const MAX_SEG = 800; // hard cap on rendered link segments / frame

function Plexus({ ptr, reduced }: { ptr: React.MutableRefObject<Pointer>; reduced: boolean }) {
  const points = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodeMat = useRef<THREE.ShaderMaterial>(null);
  const { size, gl, invalidate } = useThree();

  // Per-node CPU state — a true 3D point cloud (x,y,z), rotated + projected each
  // frame. rX/rY/rZ = rotated world coords; sx/sy = projected screen px.
  const st = useMemo(() => {
    const x = new Float32Array(NODE_COUNT);
    const y = new Float32Array(NODE_COUNT);
    const z = new Float32Array(NODE_COUNT);
    const vx = new Float32Array(NODE_COUNT);
    const vy = new Float32Array(NODE_COUNT);
    const vz = new Float32Array(NODE_COUNT);
    const rX = new Float32Array(NODE_COUNT);
    const rY = new Float32Array(NODE_COUNT);
    const rZ = new Float32Array(NODE_COUNT);
    const sx = new Float32Array(NODE_COUNT);
    const sy = new Float32Array(NODE_COUNT);
    const bright = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      vx[i] = (Math.random() - 0.5) * 0.18;
      vy[i] = (Math.random() - 0.5) * 0.18;
      vz[i] = (Math.random() - 0.5) * 0.18;
    }
    return { x, y, z, vx, vy, vz, rX, rY, rZ, sx, sy, bright, inited: false };
  }, []);

  // Node GPU buffers. aSize is rewritten each frame (perspective scales it).
  const node = useMemo(() => {
    const positions = new Float32Array(NODE_COUNT * 3);
    const sizes = new Float32Array(NODE_COUNT);
    const baseSizes = new Float32Array(NODE_COUNT);
    const seeds = new Float32Array(NODE_COUNT);
    const bright = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      // a few brighter "stars" among soft small nodes
      baseSizes[i] = (Math.random() < 0.18 ? 5.5 : 2.6) + Math.random() * 3.0;
      sizes[i] = baseSizes[i];
      seeds[i] = Math.random();
    }
    return { positions, sizes, baseSizes, seeds, bright };
  }, []);

  // Line GPU buffers (fixed cap, drawRange updated each frame).
  const line = useMemo(
    () => ({
      positions: new Float32Array(MAX_SEG * 2 * 3),
      alpha: new Float32Array(MAX_SEG * 2),
    }),
    []
  );

  const spread = (w: number, h: number) => {
    const W = w * 0.62, H = h * 0.62, Z = Math.min(w, h) * 0.5;
    for (let i = 0; i < NODE_COUNT; i++) {
      st.x[i] = (Math.random() - 0.5) * 2 * W;
      st.y[i] = (Math.random() - 0.5) * 2 * H;
      st.z[i] = (Math.random() - 0.5) * 2 * Z;
      st.sx[i] = st.x[i];
      st.sy[i] = st.y[i];
      node.positions[i * 3] = st.x[i];
      node.positions[i * 3 + 1] = st.y[i];
      node.positions[i * 3 + 2] = 0;
    }
    st.inited = true;
  };

  useEffect(() => {
    if (!reduced) return;
    if (size.width > 0 && !st.inited) spread(size.width, size.height);
    if (nodeMat.current) {
      nodeMat.current.uniforms.uTime.value = 14.0;
      nodeMat.current.uniforms.uDpr.value = gl.getPixelRatio();
    }
    if (points.current) points.current.geometry.attributes.position.needsUpdate = true;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, size.width, size.height]);

  useFrame(({ clock }) => {
    const pts = points.current;
    const lns = linesRef.current;
    const m = nodeMat.current;
    if (!pts || !lns || !m) return;

    const w = size.width;
    const h = size.height;
    if (w === 0) return;
    if (!st.inited) spread(w, h);

    m.uniforms.uTime.value = reduced ? 14.0 : clock.elapsedTime;
    m.uniforms.uDpr.value = gl.getPixelRatio();
    if (reduced) return;

    const t = clock.elapsedTime;
    const p = ptr.current;
    const W = w * 0.62, H = h * 0.62, Z = Math.min(w, h) * 0.5;
    const focal = Math.max(w, h) * 0.95;

    // the whole cloud slowly turns AND leans toward the cursor → real 3D parallax
    const yaw = t * 0.05 + (p.uvX - 0.5) * 0.7;
    const pitch = (p.uvY - 0.5) * -0.5;
    const cyA = Math.cos(yaw), syA = Math.sin(yaw);
    const cxA = Math.cos(pitch), sxA = Math.sin(pitch);
    const breath = 1 + 0.02 * Math.sin(t * 0.7); // gentle alive pulse

    const LINK = Math.min(w, h) * 0.22;
    const LINK2 = LINK * LINK;
    const CURSOR_LINK = LINK * 1.6;
    const CURSOR_LINK2 = CURSOR_LINK * CURSOR_LINK;

    const nodePos = pts.geometry.attributes.position.array as Float32Array;
    const nodeBr = pts.geometry.attributes.aBright.array as Float32Array;
    const nodeSz = pts.geometry.attributes.aSize.array as Float32Array;

    // 1) drift, rotate (yaw→pitch), perspective-project to screen px
    for (let i = 0; i < NODE_COUNT; i++) {
      st.x[i] += st.vx[i]; st.y[i] += st.vy[i]; st.z[i] += st.vz[i];
      if (st.x[i] < -W) st.x[i] = W; else if (st.x[i] > W) st.x[i] = -W;
      if (st.y[i] < -H) st.y[i] = H; else if (st.y[i] > H) st.y[i] = -H;
      if (st.z[i] < -Z) st.z[i] = Z; else if (st.z[i] > Z) st.z[i] = -Z;

      const rx = st.x[i] * cyA - st.z[i] * syA;        // yaw about Y
      const rzz = st.x[i] * syA + st.z[i] * cyA;
      const ry = st.y[i] * cxA - rzz * sxA;            // pitch about X
      const rz = st.y[i] * sxA + rzz * cxA;
      st.rX[i] = rx; st.rY[i] = ry; st.rZ[i] = rz;

      const persp = focal / (focal - rz);              // nearer (rz>0) ⇒ larger
      const sX = rx * persp * breath;
      const sY = ry * persp * breath;
      st.sx[i] = sX; st.sy[i] = sY;

      // brighten nodes near the cursor (screen space)
      let tb = 0;
      if (p.active > 0.01) {
        const dx = p.wx - sX, dy = p.wy - sY;
        const d2 = dx * dx + dy * dy;
        if (d2 < CURSOR_LINK2) tb = (1 - Math.sqrt(d2) / CURSOR_LINK) * p.active;
      }
      st.bright[i] += (tb - st.bright[i]) * 0.1;

      nodePos[i * 3] = sX; nodePos[i * 3 + 1] = sY; nodePos[i * 3 + 2] = 0;
      nodeBr[i] = st.bright[i];
      nodeSz[i] = node.baseSizes[i] * persp; // perspective foreshortening
    }

    // 2) links by 3D distance, drawn at projected positions
    const lp = line.positions;
    const la = line.alpha;
    let seg = 0;
    for (let i = 0; i < NODE_COUNT && seg < MAX_SEG; i++) {
      for (let j = i + 1; j < NODE_COUNT && seg < MAX_SEG; j++) {
        const ax = st.rX[i] - st.rX[j];
        const ay = st.rY[i] - st.rY[j];
        const az = st.rZ[i] - st.rZ[j];
        const d2 = ax * ax + ay * ay + az * az;
        if (d2 < LINK2) {
          const a = (1 - Math.sqrt(d2) / LINK) * 0.24;
          const o = seg * 6;
          lp[o] = st.sx[i]; lp[o + 1] = st.sy[i]; lp[o + 2] = 0;
          lp[o + 3] = st.sx[j]; lp[o + 4] = st.sy[j]; lp[o + 5] = 0;
          la[seg * 2] = a; la[seg * 2 + 1] = a;
          seg++;
        }
      }
    }
    // cursor reaches out to nearby nodes (brighter threads)
    if (p.active > 0.01) {
      for (let i = 0; i < NODE_COUNT && seg < MAX_SEG; i++) {
        const dx = p.wx - st.sx[i];
        const dy = p.wy - st.sy[i];
        const d2 = dx * dx + dy * dy;
        if (d2 < CURSOR_LINK2) {
          const a = (1 - Math.sqrt(d2) / CURSOR_LINK) * 0.5 * p.active;
          const o = seg * 6;
          lp[o] = p.wx; lp[o + 1] = p.wy; lp[o + 2] = 0;
          lp[o + 3] = st.sx[i]; lp[o + 4] = st.sy[i]; lp[o + 5] = 0;
          la[seg * 2] = a; la[seg * 2 + 1] = a;
          seg++;
        }
      }
    }

    pts.geometry.attributes.position.needsUpdate = true;
    pts.geometry.attributes.aBright.needsUpdate = true;
    pts.geometry.attributes.aSize.needsUpdate = true;
    lns.geometry.attributes.position.needsUpdate = true;
    lns.geometry.attributes.aAlpha.needsUpdate = true;
    lns.geometry.setDrawRange(0, seg * 2);
  });

  const nodeUniforms = useMemo(() => ({ uTime: { value: 0 }, uDpr: { value: 1 } }), []);

  return (
    <>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[line.positions, 3]} />
          <bufferAttribute attach="attributes-aAlpha" args={[line.alpha, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={LINE_VERT}
          fragmentShader={LINE_FRAG}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </lineSegments>

      <points ref={points} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[node.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[node.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[node.seeds, 1]} />
          <bufferAttribute attach="attributes-aBright" args={[node.bright, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={nodeMat}
          uniforms={nodeUniforms}
          vertexShader={NODE_VERT}
          fragmentShader={NODE_FRAG}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </>
  );
}

// ── Scene: owns the shared pointer + window listeners ────────────────────────
function Scene({ reduced, finePointer }: { reduced: boolean; finePointer: boolean }) {
  const ptr = useRef<Pointer>({
    cx: -9999, cy: -9999,
    activeTarget: 0, active: 0,
    uvX: 0.5, uvY: 0.5, wx: 0, wy: 0,
    init: false,
  });

  useEffect(() => {
    if (reduced || !finePointer) return;
    const onMove = (e: MouseEvent) => {
      ptr.current.cx = e.clientX;
      ptr.current.cy = e.clientY;
      ptr.current.activeTarget = 1;
    };
    const onLeave = () => { ptr.current.activeTarget = 0; };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseout', onLeave, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [reduced, finePointer]);

  return (
    <>
      <Field ptr={ptr} reduced={reduced} />
      <Plexus ptr={ptr} reduced={reduced} />
    </>
  );
}

export default function Presence() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        frameloop={reduced ? 'demand' : 'always'}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene reduced={reduced} finePointer={finePointer} />
      </Canvas>
    </div>
  );
}
