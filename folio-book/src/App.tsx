// @ts-nocheck
import { useState, useCallback, useEffect, useRef, Component } from 'react';
import type { ReactNode } from 'react';
import { Book, PAGE_CONTENTS, audioEngine } from './components/Book';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';
import './App.css';

// Error Boundary to catch render errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fff', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <h2>Something went wrong:</h2>
          <pre>{err?.message}</pre>
          <pre>{err?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Extend Three.js classes for JSX
extend({
  PerspectiveCamera: THREE.PerspectiveCamera,
});

// ============================================
// DYNAMIC LIGHTS - MOUSE BOUND
// ============================================

function DynamicLights({ mouse, isOpen }: { mouse: { x: number; y: number }; isOpen: boolean }) {
  const keyLightRef = useRef<THREE.SpotLight>(null);
  const fillLightRef = useRef<THREE.SpotLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);

  useFrame(() => {
    if (!isOpen) return;

    // Key light follows mouse
    if (keyLightRef.current) {
      const targetX = mouse.x * 3;
      const targetY = -mouse.y * 2 + 1.5;
      keyLightRef.current.position.lerp(new THREE.Vector3(targetX, targetY, 3), 0.08);
      if (keyLightRef.current.target) {
        keyLightRef.current.target.position.lerp(new THREE.Vector3(targetX * 0.3, targetY * 0.3, 0), 0.08);
      }
    }

    // Fill light opposite
    if (fillLightRef.current) {
      fillLightRef.current.position.lerp(new THREE.Vector3(-mouse.x * 2, 1.5, 1), 0.05);
    }

    // Rim light from behind/below
    if (rimLightRef.current) {
      rimLightRef.current.position.lerp(new THREE.Vector3(0, 2.5, -2), 0.03);
    }
  });

  return (
    <>
      <spotLight
        ref={keyLightRef}
        position={[0, 1, 3]}
        angle={0.4}
        penumbra={0.4}
        decay={2}
        intensity={isOpen ? 1.8 : 0.5}
        color="#FFF8E8"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={10}
        shadow-bias={-0.0002}
      />
      <spotLight
        ref={fillLightRef}
        position={[-2.5, 1.5, 1]}
        angle={0.8}
        penumbra={1}
        decay={2}
        intensity={isOpen ? 0.4 : 0.2}
        color="#FFF8E0"
      />
      <spotLight
        ref={rimLightRef}
        position={[0, 2.5, -2]}
        angle={0.25}
        penumbra={0.5}
        decay={2}
        intensity={isOpen ? 0.6 : 0.3}
        color="#E8C56D"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <ambientLight intensity={isOpen ? 0.15 : 0.12} color="#FFF8E0" />
      <hemisphereLight groundColor="#1A1A1A" color="#FFF8E0" intensity={0.3} />
    </>
  );
}

// ============================================
// CLOSED BOOK OVERLAY (3D)
// ============================================

function ClosedBookOverlay({ onOpen, isOpen, reducedMotion }: { onOpen: () => void; isOpen: boolean; reducedMotion: boolean }) {
  const [visible, setVisible] = useState(!isOpen);

  useEffect(() => {
    if (isOpen) {
      gsap.to({ scale: 1 }, {
        scale: 0,
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => setVisible(false)
      });
    } else {
      setVisible(true);
      gsap.fromTo({ scale: 0 }, { scale: 1 }, { duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <group position={[0, 0, 2]} onClick={onOpen}>
      {/* Background panel */}
      <mesh>
        <planeGeometry args={[3, 4]} />
        <meshBasicMaterial
          transparent
          opacity={0.95}
          color="#F5F0E8"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Gold accent lines */}
      <mesh position={[0, 1.3, 0.01]}>
        <planeGeometry args={[1.5, 0.002]} />
        <meshBasicMaterial color="#C9A84C" transparent opacity={0.6} />
      </mesh>

      {/* Title */}
      <group position={[0, 0.9, 0.02]}>
        <TitleText text="FOLIO" size={0.28} color="#0D0D0D" weight="bold" />
      </group>

      {/* Subtitle */}
      <group position={[0, 0.4, 0.02]}>
        <TitleText text="A 3D Portfolio That Breathes" size={0.06} color="#555" />
      </group>

      {/* Click hint */}
      <group position={[0, -0.5, 0.02]}>
        <mesh>
          <planeGeometry args={[1.4, 0.45]} />
          <meshBasicMaterial
            transparent
            opacity={0.1}
            color="#C9A84C"
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <TitleText text="Click or Scroll to Open" size={0.07} color="#0D0D0D" />
      </group>

      {/* Animated cursor */}
      <AnimatedCursor position={[0, -1.2, 0.02]} reducedMotion={reducedMotion} onClick={onOpen} />

      {/* Keyboard hints */}
      <group position={[0, -1.9, 0.02]}>
        <TitleText text="← → Navigate Pages  |  Esc Close  |  Home/End Jump" size={0.035} color="#999" />
      </group>

      {reducedMotion && (
        <group position={[0, -2.3, 0.02]}>
          <TitleText text="Reduced motion detected — experience optimized for comfort" size={0.03} color="#999" />
        </group>
      )}
    </group>
  );
}

function AnimatedCursor({ position, reducedMotion, onClick }: { position: [number, number, number]; reducedMotion: boolean; onClick: () => void }) {
  const { clock } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<(THREE.Mesh | null)[]>([null, null, null]);

  useFrame(() => {
    if (groupRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      groupRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      ringsRef.current.forEach((mesh, i) => {
        if (mesh && mesh.material instanceof THREE.Material) {
          mesh.material.opacity = 0.25 + Math.sin(t * 3 + i) * 0.15;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={el => ringsRef.current[i] = el}>
          <circleGeometry args={[0.06 + i * 0.04, 16]} />
          <meshBasicMaterial
            color="#C9A84C"
            transparent
            opacity={0.3 - i * 0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// TEXT MESH COMPONENT (renders text to canvas texture)
// ============================================

function TitleText({ text, size = 0.1, color = '#0D0D0D', weight = 'normal' }: { text: string; size?: number; color?: string; weight?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = 2;
    const padding = 40;

    // Measure text
    ctx.font = `${weight} ${size * 100}px "Cormorant Garamond", Georgia, serif`;
    const metrics = ctx.measureText(text);
    const width = Math.ceil(metrics.width) + padding * 2;
    const height = Math.ceil(size * 100 * 1.5) + padding * 2;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw text
    ctx.font = `${weight} ${size * 100}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    // Create texture
    if (textureRef.current) textureRef.current.dispose();
    textureRef.current = new THREE.CanvasTexture(canvas);
    textureRef.current.colorSpace = THREE.SRGBColorSpace;
    textureRef.current.needsUpdate = true;

    // Update mesh
    if (meshRef.current) {
      const geom = meshRef.current.geometry as THREE.PlaneGeometry;
      geom.dispose();
      meshRef.current.geometry = new THREE.PlaneGeometry(size * metrics.width * 1.1, size * 100 * 1.2);
      if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
        meshRef.current.material.map = textureRef.current;
        meshRef.current.material.needsUpdate = true;
      }
    }
  }, [text, size, color, weight]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[size * text.length * 0.6, size * 1.2]} />
      <meshBasicMaterial
        transparent
        opacity={0.95}
        color={color}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </mesh>
  );
}

// ============================================
// PAGE INDICATOR (3D BILLBOARD)
// ============================================

function PageIndicator({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef} position={[-3.2, 1.8, 0]}>
      <mesh>
        <planeGeometry args={[0.9, 0.35]} />
        <meshBasicMaterial
          transparent
          opacity={0.08}
          color="#0D0D0D"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <group position={[0, 0, 0.02]}>
        <TitleText
          text={`${currentPage} / ${totalPages}`}
          size={0.09}
          color="#0D0D0D"
          weight="bold"
        />
      </group>
    </group>
  );
}

// ============================================
// NAVIGATION CONTROLS (3D)
// ============================================

function NavControls3D({ onPrev, onNext, prevDisabled, nextDisabled }: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
}) {
  return (
    <group>
      {/* Prev button */}
      <group position={[-3.0, 0, 0]} onClick={onPrev}>
        <mesh scale={prevDisabled ? 0.7 : 1}>
          <circleGeometry args={[0.38, 32]} />
          <meshStandardMaterial
            color={prevDisabled ? '#999' : '#C9A84C'}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={prevDisabled ? 0.4 : 1}
          />
        </mesh>
        <mesh position={[0, 0, 0.02]} scale={0.6}>
          <planeGeometry args={[0.25, 0.04]} />
          <meshBasicMaterial color="#0D0D0D" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Next button */}
      <group position={[3.0, 0, 0]} onClick={onNext}>
        <mesh scale={nextDisabled ? 0.7 : 1}>
          <circleGeometry args={[0.38, 32]} />
          <meshStandardMaterial
            color={nextDisabled ? '#999' : '#C9A84C'}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={nextDisabled ? 0.4 : 1}
          />
        </mesh>
        <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI]} scale={0.6}>
          <planeGeometry args={[0.25, 0.04]} />
          <meshBasicMaterial color="#0D0D0D" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================
// CLOSE BUTTON (3D BILLBOARD)
// ============================================

function CloseButton3D({ onClose }: { onClose: () => void }) {
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={ref} position={[0, 2.3, -2.5]} onClick={onClose}>
      <mesh>
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial
          color="#0D0D0D"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI/4]}>
        <planeGeometry args={[0.35, 0.03]} />
        <meshBasicMaterial color="#0D0D0D" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.02]} rotation={[0, 0, -Math.PI/4]}>
        <planeGeometry args={[0.35, 0.03]} />
        <meshBasicMaterial color="#0D0D0D" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================
// DUST SYSTEM
// ============================================

function DustSystem({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = Math.random() * 2.5 + 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) + 0.1;
      positions[i*3+2] = r * Math.cos(phi) - 0.5;

      sizes[i] = Math.random() * 2.5 + 0.8;
      colors[i*3] = 0.85 + Math.random() * 0.1;
      colors[i*3+1] = 0.72 + Math.random() * 0.1;
      colors[i*3+2] = 0.35 + Math.random() * 0.15;
      opacities[i] = Math.random() * 0.4 + 0.08;
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.2 + Math.random() * 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('customOpacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('customAngle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('customSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('customPhase', new THREE.BufferAttribute(phases, 1));

    const dustVertexShader = /* glsl */`
      attribute float size;
      attribute vec3 customColor;
      attribute float customOpacity;
      attribute float customAngle;
      attribute float customSpeed;
      attribute float customPhase;
      varying vec3 vColor;
      varying float vOpacity;
      varying float vAngle;
      varying float vSpeed;
      varying float vPhase;
      uniform float uTime;
      uniform float uActive;
      uniform float uDrift;
      uniform float uSize;
      void main() {
        vColor = customColor;
        vOpacity = customOpacity;
        vAngle = customAngle;
        vSpeed = customSpeed;
        vPhase = customPhase;
        vec3 pos = position;
        pos.x += sin(uTime * vSpeed + position.y * 10.0 + vPhase) * 0.02 * uActive;
        pos.y += cos(uTime * vSpeed * 0.7 + position.x * 10.0 + vPhase) * 0.015 * uActive;
        pos.z += uDrift * uTime * 0.1 * uActive;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const dustFragmentShader = /* glsl */`
      varying vec3 vColor;
      varying float vOpacity;
      varying float vAngle;
      varying float vSpeed;
      varying float vPhase;
      uniform float uTime;
      uniform float uActive;
      void main() {
        float dist = length(gl_PointCoord - 0.5);
        if (dist > 0.5) discard;
        float alpha = (1.0 - dist * 2.0) * vOpacity * uActive;
        vec3 color = vColor;
        float shimmer = sin(uTime * 4.0 + vAngle * 15.0 + vPhase) * 0.15 + 0.85;
        gl_FragColor = vec4(color * shimmer, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActive: { value: active ? 1 : 0 },
        uDrift: { value: 0.05 },
        uSize: { value: 1 },
      },
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    materialRef.current = material;

    pointsRef.current = new THREE.Points(geometry, material);
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [active]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uActive.value = active ? 1 : 0;
    }
  });

  return pointsRef.current ? <primitive object={pointsRef.current} /> : null;
}

// ============================================
// PAGE CONTENT TEXTURE (renders to canvas for 3D pages)
// ============================================

function PageContentTexture({ content, pageNumber }: { content: any; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const width = 1024;
    const height = 1536;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Paper base with subtle texture
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 6;
      data[i] = data[i+1] = data[i+2] = 245 + noise;
      data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    // Watermark
    ctx.font = 'bold 120px Georgia';
    ctx.fillStyle = 'rgba(0,0,0,0.008)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FOLIO', width/2, height/2);

    // Render content
    const centerX = width / 2;
    let y = 180;
    const leftMargin = 120;
    const rightMargin = width - 120;
    const lineHeight = 1.7;

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lh: number) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, x, currentY);
          line = word + ' ';
          currentY += lh * 28;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY + lh * 28;
    };

    // Page title
    ctx.font = 'bold 48px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#0D0D0D';
    ctx.textAlign = 'center';
    ctx.fillText(content.title, centerX, y);
    y += 70;

    // Underline
    const titleWidth = ctx.measureText(content.title).width;
    const gradient = ctx.createLinearGradient(centerX - titleWidth/2, y, centerX + titleWidth/2, y);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, '#C9A84C');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - titleWidth/2, y, titleWidth, 2);
    y += 40;

    ctx.textAlign = 'left';

    switch (pageNumber) {
      case 1: // Hero
        ctx.font = 'italic 36px "Cormorant Garamond", Georgia, serif';
        ctx.fillStyle = '#0D0D0D';
        ctx.textAlign = 'center';
        ctx.fillText(content.subtitle, centerX, y);
        y += 60;
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#C9A84C';
        content.stats.forEach((stat: any, i: number) => {
          const x = 200 + i * 200;
          ctx.fillText(stat.icon + ' ' + stat.label, x, y);
        });
        break;

      case 2: // About
        ctx.font = '24px "Fraunces", Georgia, serif';
        ctx.fillStyle = '#1A1A1A';
        y = wrapText(content.body, leftMargin, y, rightMargin - leftMargin, lineHeight);
        y += 30;
        ctx.font = '18px "Space Grotesk", sans-serif';
        content.tags.forEach((tag: string, i: number) => {
          const x = leftMargin + i * 200;
          ctx.fillStyle = 'rgba(201, 168, 76, 0.2)';
          const metrics = ctx.measureText(tag);
          ctx.fillRect(x - 10, y - 5, metrics.width + 20, 30);
          ctx.fillStyle = '#C9A84C';
          ctx.fillText(tag, x, y + 20);
        });
        break;

      case 3: // Skills
        ctx.font = '22px "Fraunces", Georgia, serif';
        content.skills.forEach((skill: any) => {
          ctx.fillStyle = '#0D0D0D';
          ctx.fillText(`${skill.name} ${skill.level}%`, leftMargin, y);
          ctx.fillStyle = 'rgba(201, 168, 76, 0.15)';
          ctx.fillRect(leftMargin, y + 8, 400, 8);
          ctx.fillStyle = '#C9A84C';
          ctx.fillRect(leftMargin, y + 8, 400 * skill.level / 100, 8);
          y += 55;
        });
        ctx.textAlign = 'center';
        ctx.font = 'italic 18px "Fraunces", Georgia, serif';
        ctx.fillStyle = '#999';
        ctx.fillText('Drag the 3D book to explore the skills constellation', centerX, y + 40);
        break;

      case 4: // Projects
        content.projects.forEach((project: any) => {
          ctx.font = 'bold 26px "Cormorant Garamond", Georgia, serif';
          ctx.fillStyle = '#0D0D0D';
          ctx.fillText(project.name, leftMargin, y);
          y += 38;
          ctx.font = '18px "Fraunces", Georgia, serif';
          ctx.fillStyle = '#333';
          y = wrapText(project.desc, leftMargin, y, rightMargin - leftMargin, lineHeight);
          ctx.fillStyle = '#C9A84C';
          ctx.fillText(project.link + ' →', leftMargin, y + 15);
          y += 55;
        });
        ctx.textAlign = 'center';
        ctx.fillStyle = '#C9A84C';
        ctx.fillText('View All 12 Projects →', centerX, y + 30);
        break;

      case 5: // Experience
        content.timeline.forEach((item: any) => {
          ctx.font = 'bold 18px "Space Grotesk", sans-serif';
          ctx.fillStyle = '#C9A84C';
          ctx.fillText(item.year, leftMargin, y);
          y += 28;
          ctx.font = 'bold 24px "Cormorant Garamond", Georgia, serif';
          ctx.fillStyle = '#0D0D0D';
          ctx.fillText(item.role, leftMargin, y);
          y += 34;
          ctx.font = '20px "Fraunces", Georgia, serif';
          ctx.fillStyle = '#555';
          ctx.fillText(item.company, leftMargin, y);
          y += 30;
          ctx.font = '17px "Fraunces", Georgia, serif';
          ctx.fillStyle = '#333';
          y = wrapText(item.details, leftMargin, y, rightMargin - leftMargin, lineHeight);
          y += 40;
        });
        break;

      case 6: // Contact
        content.contacts.forEach((contact: any) => {
          ctx.font = 'bold 16px "Space Grotesk", sans-serif';
          ctx.fillStyle = '#C9A84C';
          ctx.fillText(contact.type.toUpperCase(), leftMargin, y);
          y += 28;
          ctx.font = '22px "Fraunces", Georgia, serif';
          ctx.fillStyle = '#0D0D0D';
          ctx.fillText(contact.value, leftMargin, y);
          y += 36;
          ctx.font = 'italic 16px "Fraunces", Georgia, serif';
          ctx.fillStyle = '#999';
          ctx.fillText(contact.action, leftMargin, y);
          y += 50;
        });
        y += 20;
        ctx.textAlign = 'center';
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#C9A84C';
        content.social.forEach((s: string, i: number) => {
          const x = centerX - 150 + i * 75;
          ctx.fillText(s.toUpperCase(), x, y);
        });
        y += 60;
        ctx.font = 'italic 16px "Cormorant Garamond", Georgia, serif';
        ctx.fillStyle = '#999';
        ctx.fillText(content.note, centerX, y);
        y += 40;
        ctx.font = '12px "Space Grotesk", sans-serif';
        ctx.fillText('© 2025 Alexander Chen. Crafted with Three.js, GSAP, R3F, Fraunces', centerX, y);
        break;
    }

    // Page number
    ctx.textAlign = 'center';
    ctx.font = '14px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#C9A84C';
    ctx.fillText(`${pageNumber} / ${PAGE_CONTENTS.length}`, centerX, height - 60);

    if (textureRef.current) textureRef.current.dispose();
    textureRef.current = new THREE.CanvasTexture(canvas);
    textureRef.current.colorSpace = THREE.SRGBColorSpace;
    textureRef.current.needsUpdate = true;

    return () => {
      if (textureRef.current) textureRef.current.dispose();
    };
  }, [content, pageNumber]);

  return null;
}

// ============================================
// STATIC FALLBACK CONTENT
// ============================================

function StaticPortfolioContent() {
  return (
    <div className="static-portfolio">
      <header className="static-header">
        <h1>ALEXANDER CHEN</h1>
        <p>Creative Technologist & Builder</p>
        <div className="static-stats">
          <span>12+ Years</span>
          <span>48 Shipped</span>
          <span>3 Patents</span>
          <span>2 Exits</span>
        </div>
      </header>
      <nav className="static-nav">
        {PAGE_CONTENTS.map((page, i) => (
          <a key={i} href={`#page-${i+1}`}>{page.title}</a>
        ))}
      </nav>
      <main>
        {PAGE_CONTENTS.map((page, i) => (
          <section key={i} id={`page-${i+1}`} className="static-page">
            <h2>{page.title}</h2>
            {i === 0 && (
              <div className="static-about">
                <p>I write code that feels like craft. After a decade building systems at Stripe, Figma, and Vercel, I now help founders turn vision into velocity.</p>
              </div>
            )}
            {i === 1 && (
              <div className="static-skills">
                {page.skills?.map((s: any) => (
                  <div key={s.name} className="static-skill">
                    <span>{s.name}</span>
                    <span>{s.level}%</span>
                  </div>
                ))}
              </div>
            )}
            {i === 2 && (
              <div className="static-projects">
                {page.projects?.map((p: any) => (
                  <div key={p.name} className="static-project">
                    <h3>{p.name}</h3>
                    <p>{p.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {i === 3 && (
              <div className="static-timeline">
                {page.timeline?.map((t: any) => (
                  <div key={t.year} className="static-timeline-item">
                    <strong>{t.year} — {t.role} @ {t.company}</strong>
                    <p>{t.details}</p>
                  </div>
                ))}
              </div>
            )}
            {i === 4 && (
              <div className="static-contact">
                <p>alex@aetherlabs.io</p>
                <p>cal.com/alexchen</p>
                <div className="static-social">
                  <a href="#">GitHub</a>
                  <a href="#">Twitter</a>
                  <a href="#">LinkedIn</a>
                </div>
              </div>
            )}
          </section>
        ))}
        <footer className="static-footer">
          <p>© 2025 Alexander Chen. Crafted with Three.js, GSAP, R3F, Fraunces</p>
        </footer>
      </main>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cameraPos] = useState(new THREE.Vector3(0, 0, 3.5));
  const cameraStart = useRef(new THREE.Vector3(0, 0, 3.5));
  const openAnimRef = useRef<gsap.core.Tween | null>(null);

  // Light position/direction (computed from mouse)
  const lightPosition = useRef(new THREE.Vector3(0, 1, 3));
  const lightDirection = useRef(new THREE.Vector3(0, -0.33, -1).normalize());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleOpen = useCallback(() => {
    if (isOpen) return;
    audioEngine.resume();
    setIsOpen(true);
    setCurrentPage(1);

    if (openAnimRef.current) openAnimRef.current.kill();
    openAnimRef.current = gsap.to(cameraStart.current, {
      x: 0,
      y: 0.3,
      z: 4,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => cameraPos.copy(cameraStart.current),
    });
  }, [isOpen, cameraPos]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (openAnimRef.current) openAnimRef.current.kill();
    gsap.to(cameraStart.current, {
      x: 0,
      y: 0,
      z: 3.5,
      duration: 1,
      ease: 'power3.inOut',
      onUpdate: () => cameraPos.copy(cameraStart.current),
    });
  }, [cameraPos]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isOpen && e.deltaY > 10) {
      handleOpen();
    }
  }, [isOpen, handleOpen]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleNextPage = useCallback(() => {
    if (currentPage < PAGE_CONTENTS.length) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowRight': handleNextPage(); break;
        case 'ArrowLeft': handlePrevPage(); break;
        case 'Escape': handleClose(); break;
        case 'Home': setCurrentPage(1); break;
        case 'End': setCurrentPage(PAGE_CONTENTS.length); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleOpen, handleClose, handleNextPage, handlePrevPage]);

  // Mouse position for camera idle pan & dynamic lighting
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Update light position based on mouse (key light follows mouse)
      const targetX = mouseRef.current.x * 3;
      const targetY = -mouseRef.current.y * 2 + 1.5;
      lightPosition.current.set(targetX, targetY, 3);
      // Light direction points from light to scene center (0, 0, 0)
      lightDirection.current.subVectors(new THREE.Vector3(0, 0, 0), lightPosition.current).normalize();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const pageContent = PAGE_CONTENTS[currentPage - 1];

  return (
    <ErrorBoundary>
      <div className="app" onWheel={handleWheel}>
        {/* Full viewport 3D canvas */}
        <div className="canvas-container" role="application" aria-label="Interactive 3D portfolio book">
          <Canvas
            camera={{ position: cameraPos.toArray(), fov: 42, near: 0.01, far: 100 }}
            gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
            shadows={{ type: THREE.PCFSoftShadowMap }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.0;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <color attach="background" args={['#F5F0E8']} />
            <fog attach="fog" args={['#F5F0E8', 5, 15]} />

            {/* TEST: Minimal scene */}
            {/* <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#C9A84C" />
            </mesh> */}

            {/* Dynamic lighting - follows mouse */}
            <DynamicLights mouse={mouseRef.current} isOpen={isOpen} />

            {/* The Book */}
            <Book
              isOpen={isOpen}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              cameraPosition={cameraPos}
              lightPosition={lightPosition}
              lightDirection={lightDirection}
              onOpenStart={handleOpen}
            />

            {/* Closed state overlay */}
            {/* <ClosedBookOverlay onOpen={handleOpen} isOpen={isOpen} reducedMotion={reducedMotion} /> */}

            {/* Open state UI */}
            {/* {isOpen && (
              <>
                <PageContentTexture content={pageContent} pageNumber={currentPage} />
                <PageIndicator currentPage={currentPage} totalPages={PAGE_CONTENTS.length} />
                <NavControls3D
                  onPrev={handlePrevPage}
                  onNext={handleNextPage}
                  prevDisabled={currentPage === 1}
                  nextDisabled={currentPage === PAGE_CONTENTS.length}
                />
                <CloseButton3D onClose={handleClose} />
              </>
            )} */}

            {/* Dust particles */}
            {/* <DustSystem active={isOpen} /> */}

            {/* Controls */}
            {/* <OrbitControls
              enableZoom={true}
              enablePan={false}
              maxPolarAngle={Math.PI/2 - 0.05}
              minDistance={1.8}
              maxDistance={7}
              dampingFactor={0.06}
              enableDamping={true}
              rotateSpeed={0.4}
              zoomSpeed={0.8}
              autoRotate={!isOpen}
              autoRotateSpeed={0.15}
            /> */}
          </Canvas>
        </div>

        {/* Accessibility fallback */}
        <div className="a11y-content" aria-hidden={isOpen}>
          <StaticPortfolioContent />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;