'use client';

import React, { useRef, useEffect, useState, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ============================================================
   CLUB HERO 3D — LIQUID CHROME CENTERPIECE
   Reactive iridescent sphere with Fresnel shaders
   ============================================================ */

// Liquid Chrome Shader Material
const LiquidChromeMaterial = ({
  uTime,
  uMouse,
  uScrollProgress,
  uIntensity,
}: {
  uTime: number;
  uMouse: THREE.Vector2;
  uScrollProgress: number;
  uIntensity: number;
}) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uScrollProgress: { value: 0 },
        uIntensity: { value: 1 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uIntensity;
        uniform float uScrollProgress;

        // Simplex 3D Noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 1.0/7.0;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;

          // Liquid displacement
          float noise1 = snoise(position * 0.5 + uTime * 0.1);
          float noise2 = snoise(position * 1.2 - uTime * 0.07);
          float displacement = mix(noise1, noise2, 0.5) * 0.15 * uIntensity;

          // Scroll morphing
          float morph = uScrollProgress * 0.3;
          displacement += morph * sin(uTime * 0.5 + position.x * 2.0) * 0.1;

          vec3 newPosition = position + normal * displacement;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uIntensity;
        uniform vec2 uResolution;

        // Fresnel effect
        float fresnel(vec3 viewDir, vec3 normal, float power) {
          return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
        }

        // Iridescent thin-film interference
        vec3 iridescence(float thickness, vec3 viewDir, vec3 normal) {
          float cosTheta = dot(normalize(viewDir), normal);
          float phase = thickness * 6.28318 / 550.0;
          vec3 color = vec3(
            sin(phase + 0.0),
            sin(phase + 2.094),
            sin(phase + 4.188)
          );
          return color * (1.0 - cosTheta) * 0.5;
        }

        // Liquid chrome base color
        vec3 liquidChrome(vec3 normal, vec3 viewDir, float time) {
          float f = fresnel(viewDir, normal, 3.0);
          vec3 chrome = mix(
            vec3(0.0, 0.3, 0.5),   // Dark cyan
            vec3(0.5, 0.8, 1.0),   // Bright chrome
            f
          );
          // Add violet shift at grazing angles
          float violetShift = fresnel(viewDir, normal, 5.0);
          chrome = mix(chrome, vec3(0.4, 0.1, 0.6), violetShift * 0.3);
          return chrome;
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 normal = normalize(vNormal);

          // Base liquid chrome
          vec3 color = liquidChrome(normal, viewDir, uTime);

          // Iridescent thin-film
          float thickness = 300.0 + 200.0 * sin(uTime * 0.3 + vUv.x * 10.0);
          vec3 irid = iridescence(thickness, viewDir, normal) * uIntensity;
          color += irid;

          // Mouse interaction glow
          vec2 mouseUv = uMouse / uResolution;
          float mouseDist = length(vUv - mouseUv);
          float mouseGlow = smoothstep(0.5, 0.0, mouseDist) * 0.3 * uIntensity;
          color += vec3(0.0, 0.6, 1.0) * mouseGlow;

          // Scroll progress tint
          float scrollTint = uScrollProgress * 0.2;
          color = mix(color, vec3(0.5, 0.1, 0.7), scrollTint);

          // Gamma correction
          color = pow(color, vec3(1.0 / 2.2));

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      side: THREE.DoubleSide,
    });

    materialRef.current = material;
    return () => material.dispose();
  }, []);

  // Update uniforms each frame
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = uTime;
      materialRef.current.uniforms.uMouse.value.set(uMouse.x, uMouse.y);
      materialRef.current.uniforms.uScrollProgress.value = uScrollProgress;
      materialRef.current.uniforms.uIntensity.value = uIntensity;
    }
  });

  return materialRef.current ? <primitive object={materialRef.current} /> : null;
};

// Icosahedron Geometry Component
const Icosphere = ({
  uTime,
  uMouse,
  uScrollProgress,
  uIntensity,
  subdivisions = 3,
  rotation,
}: {
  uTime: number;
  uMouse: THREE.Vector2;
  uScrollProgress: number;
  uIntensity: number;
  subdivisions?: number;
  rotation?: any;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { uTime: _, uMouse: __, uScrollProgress: ___, uIntensity: ____, ...props } = {
    uTime, uMouse, uScrollProgress, uIntensity,
  };

  return (
    <mesh ref={meshRef} {...props}>
      <icosahedronGeometry args={[1.5, subdivisions]} />
      <LiquidChromeMaterial
        uTime={uTime}
        uMouse={uMouse}
        uScrollProgress={uScrollProgress}
        uIntensity={uIntensity}
      />
    </mesh>
  );
};

// Ambient Particles
const AmbientParticles = ({ uTime, uIntensity }: { uTime: number; uIntensity: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = Math.random() * 2 + 0.5;
      alphas[i] = Math.random() * 0.5 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: false,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x00ffff,
    });

    pointsRef.current = new THREE.Points(geometry, material);
  }, []);

  useFrame(() => {
    if (pointsRef.current && uIntensity > 0) {
      pointsRef.current.rotation.y += 0.0001 * uIntensity;
      pointsRef.current.rotation.x += 0.00005 * uIntensity;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(uTime + i * 0.1) * 0.001 * uIntensity;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return pointsRef.current ? <primitive object={pointsRef.current} /> : null;
};

// Main 3D Scene Component
interface ClubHero3DProps {
  intensity?: number;
  geometry?: 'icosphere' | 'torusknot' | 'dodecahedron';
  subdivisions?: number;
  onLoad?: () => void;
}

function checkWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

class SafeCanvasErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('Canvas 3D context failure, falling back to CSS visual:', err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function ClubHero3D({
  intensity = 1,
  geometry = 'icosphere',
  subdivisions = 3,
  onLoad,
}: ClubHero3DProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [canRender3D, setCanRender3D] = useState(false);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const scrollRef = useRef(0);
  const timeRef = useRef(0);
  const prefersReduced = false; // Will be overridden by parent context

  useEffect(() => {
    setCanRender3D(checkWebGLAvailable());
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      scrollRef.current = Math.min(scrollY / maxScroll, 1);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation loop
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame++;
      timeRef.current = frame * 0.016; // ~60fps
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const effectiveIntensity = prefersReduced ? 0 : intensity;

  if (!canRender3D) {
    return <ClubHero3DFallback />;
  }

  return (
    <SafeCanvasErrorBoundary fallback={<ClubHero3DFallback />}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          setIsLoaded(true);
          onLoad?.();
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={[0x06100e, 5, 15]} />

        {/* Main Icosphere */}
        <group>
          {geometry === 'icosphere' && (
            <Icosphere
              uTime={timeRef.current}
              uMouse={mouseRef.current}
              uScrollProgress={scrollRef.current}
              uIntensity={effectiveIntensity}
              subdivisions={subdivisions}
              rotation={{ x: -0.2, y: 0.3 }}
            />
          )}

          {/* Ambient Particles */}
          <AmbientParticles uTime={timeRef.current} uIntensity={effectiveIntensity} />

          {/* Subtle orbit controls for desktop */}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={!prefersReduced}
            autoRotate={!prefersReduced}
            autoRotateSpeed={0.2}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={0}
          />
        </group>

        {/* Lighting */}
        <ambientLight intensity={0.3} color="#00ffff" />
        <directionalLight position={[5, 10, 7]} intensity={0.5} color="#ffffff" />
        <pointLight position={[-3, 5, 3]} intensity={0.3} color="#00ffff" decay={2} />
        <pointLight position={[3, -5, -3]} intensity={0.2} color="#a855f7" decay={2} />
      </Canvas>
    </SafeCanvasErrorBoundary>
  );
}

/* ============================================================
   CSS-ONLY FALLBACK
   ============================================================ */

export function ClubHero3DFallback() {
  return (
    <div
      className="club-hero-fallback"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, oklch(0.06 0.01 240) 0%, oklch(0.03 0.02 240) 70%)',
      }}
      aria-hidden="true"
    >
      {/* Animated gradient orb */}
      <div
        className="club-fallback-orb"
        style={{
          width: 'min(60vw, 400px)',
          height: 'min(60vw, 400px)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, oklch(0.65 0.22 200 / 0.3) 0%, transparent 70%)',
          animation: 'club-pulse 8s ease-in-out infinite',
          position: 'relative',
        }}
      >
        <div
          className="club-fallback-ring"
          style={{
            position: 'absolute',
            inset: '10%',
            border: '1px solid oklch(0.65 0.22 200)',
            borderRadius: '50%',
            opacity: 0.3,
            animation: 'club-ring-expand 6s ease-out infinite',
          }}
        />
        <div
          className="club-fallback-ring"
          style={{
            position: 'absolute',
            inset: '10%',
            border: '1px solid oklch(0.55 0.28 100)',
            borderRadius: '50%',
            opacity: 0.2,
            animation: 'club-ring-expand 6s ease-out infinite',
            animationDelay: '-2s',
          }}
        />
        <div
          className="club-fallback-ring"
          style={{
            position: 'absolute',
            inset: '10%',
            border: '1px solid oklch(0.65 0.25 280)',
            borderRadius: '50%',
            opacity: 0.15,
            animation: 'club-ring-expand 6s ease-out infinite',
            animationDelay: '-4s',
          }}
        />
      </div>

      {/* Logo */}
      <svg
        className="club-fallback-logo"
        viewBox="0 0 200 80"
        style={{
          marginTop: '2rem',
          filter: 'drop-shadow(0 0 30px oklch(0.65 0.22 200 / 0.4))',
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="club-logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.65 0.22 200)" />
            <stop offset="50%" stopColor="oklch(0.55 0.28 100)" />
            <stop offset="100%" stopColor="oklch(0.65 0.25 280)" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="55"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontSize="56"
          fontWeight="600"
          letterSpacing="0.15em"
          fill="url(#club-logo-gradient)"
        >
          THE CLUB
        </text>
      </svg>

      <style jsx>{`
        @keyframes club-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.5; }
        }
        @keyframes club-ring-expand {
          0% { transform: scale(0.5); opacity: 0.4; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}