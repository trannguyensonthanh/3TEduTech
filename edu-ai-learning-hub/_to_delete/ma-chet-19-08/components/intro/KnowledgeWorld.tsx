/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/KnowledgeWorld.tsx
// Thế giới tri thức 3D - các biểu tượng lĩnh vực lơ lửng trong không gian
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useSpring,
  a as animated,
  config as springConfig,
} from '@react-spring/three';

// --- Knowledge Domain Definitions ---
interface KnowledgeDomain {
  id: string;
  label: string;
  color: string;
  emissive: string;
  icon: 'dna' | 'chip' | 'gear' | 'chart' | 'atom' | 'code' | 'art' | 'globe';
  position: [number, number, number];
  rotationSpeed: number;
  floatSpeed: number;
  floatAmplitude: number;
  scale: number;
}

const DOMAINS: KnowledgeDomain[] = [
  {
    id: 'biology',
    label: 'Sinh học',
    color: '#00FF88',
    emissive: '#00CC66',
    icon: 'dna',
    position: [-6, 3, -4],
    rotationSpeed: 0.3,
    floatSpeed: 0.7,
    floatAmplitude: 0.5,
    scale: 1.1,
  },
  {
    id: 'technology',
    label: 'Công nghệ',
    color: '#00BFFF',
    emissive: '#0088CC',
    icon: 'chip',
    position: [5, 4, -3],
    rotationSpeed: 0.25,
    floatSpeed: 0.55,
    floatAmplitude: 0.4,
    scale: 1.2,
  },
  {
    id: 'engineering',
    label: 'Kỹ thuật',
    color: '#FF6B35',
    emissive: '#CC5500',
    icon: 'gear',
    position: [7, -1, -5],
    rotationSpeed: 0.4,
    floatSpeed: 0.6,
    floatAmplitude: 0.35,
    scale: 1.0,
  },
  {
    id: 'economics',
    label: 'Kinh tế',
    color: '#FFD700',
    emissive: '#CC9900',
    icon: 'chart',
    position: [-5, -2, -3],
    rotationSpeed: 0.2,
    floatSpeed: 0.5,
    floatAmplitude: 0.45,
    scale: 0.9,
  },
  {
    id: 'science',
    label: 'Khoa học',
    color: '#E040FB',
    emissive: '#AA00CC',
    icon: 'atom',
    position: [0, 6, -6],
    rotationSpeed: 0.35,
    floatSpeed: 0.65,
    floatAmplitude: 0.55,
    scale: 1.3,
  },
  {
    id: 'programming',
    label: 'Lập trình',
    color: '#76FF03',
    emissive: '#55CC00',
    icon: 'code',
    position: [-8, 1, -7],
    rotationSpeed: 0.28,
    floatSpeed: 0.45,
    floatAmplitude: 0.38,
    scale: 1.0,
  },
  {
    id: 'art',
    label: 'Nghệ thuật',
    color: '#FF4081',
    emissive: '#CC0044',
    icon: 'art',
    position: [8, 2, -8],
    rotationSpeed: 0.22,
    floatSpeed: 0.75,
    floatAmplitude: 0.6,
    scale: 0.85,
  },
  {
    id: 'global',
    label: 'Toàn cầu',
    color: '#40C4FF',
    emissive: '#0088FF',
    icon: 'globe',
    position: [0, -3, -4],
    rotationSpeed: 0.18,
    floatSpeed: 0.4,
    floatAmplitude: 0.3,
    scale: 1.15,
  },
];

// --- Individual Domain Icon 3D Components ---
const DNAHelix: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const segments = 20;
  const helixPoints = useMemo(() => {
    const pts: { pos: [number, number, number]; pos2: [number, number, number] }[] = [];
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 3;
      const y = (i / segments - 0.5) * 2.5;
      pts.push({
        pos: [Math.cos(t) * 0.4, y, Math.sin(t) * 0.4],
        pos2: [Math.cos(t + Math.PI) * 0.4, y, Math.sin(t + Math.PI) * 0.4],
      });
    }
    return pts;
  }, []);

  return (
    <group ref={groupRef}>
      {helixPoints.map((pt, i) => (
        <React.Fragment key={i}>
          <mesh position={pt.pos as [number, number, number]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshPhysicalMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={0.8}
              roughness={0.15}
              metalness={0.3}
              clearcoat={0.8}
              transmission={0.4}
              thickness={0.1}
              ior={1.8}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={pt.pos2 as [number, number, number]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshPhysicalMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={0.8}
              roughness={0.15}
              metalness={0.3}
              clearcoat={0.8}
              transmission={0.4}
              thickness={0.1}
              ior={1.8}
              transparent
              opacity={0.9}
            />
          </mesh>
          {i % 3 === 0 && (
            <mesh
              position={[
                (pt.pos[0] + pt.pos2[0]) / 2,
                pt.pos[1],
                (pt.pos[2] + pt.pos2[2]) / 2,
              ]}
              rotation={[0, Math.atan2(pt.pos[2] - pt.pos2[2], pt.pos[0] - pt.pos2[0]), 0]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={0.4}
                transparent
                opacity={0.7}
              />
            </mesh>
          )}
        </React.Fragment>
      ))}
    </group>
  );
});
DNAHelix.displayName = 'DNAHelix';

const ChipIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => (
  <group>
    {/* Main chip body */}
    <mesh>
      <boxGeometry args={[0.8, 0.8, 0.15]} />
      <meshPhysicalMaterial
        color="#1A1A2E"
        emissive={emissive}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.8}
        clearcoat={0.9}
      />
    </mesh>
    {/* Center die */}
    <mesh position={[0, 0, 0.08]}>
      <boxGeometry args={[0.35, 0.35, 0.05]} />
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={1.2}
        roughness={0.05}
        metalness={0.9}
        clearcoat={1}
        transmission={0.3}
        ior={2.0}
      />
    </mesh>
    {/* Pins */}
    {Array.from({ length: 8 }).map((_, i) => {
      const side = i < 4 ? 'top' : 'bottom';
      const idx = i % 4;
      const x = (idx - 1.5) * 0.18;
      const y = side === 'top' ? 0.48 : -0.48;
      return (
        <mesh key={`pin-h-${i}`} position={[x, y, 0]}>
          <boxGeometry args={[0.04, 0.12, 0.03]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.05} />
        </mesh>
      );
    })}
    {Array.from({ length: 8 }).map((_, i) => {
      const side = i < 4 ? 'left' : 'right';
      const idx = i % 4;
      const y = (idx - 1.5) * 0.18;
      const x = side === 'left' ? -0.48 : 0.48;
      return (
        <mesh key={`pin-v-${i}`} position={[x, y, 0]}>
          <boxGeometry args={[0.12, 0.04, 0.03]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.05} />
        </mesh>
      );
    })}
  </group>
));
ChipIcon.displayName = 'ChipIcon';

const GearIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => {
  const gearRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (gearRef.current) {
      gearRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={gearRef}>
        <torusGeometry args={[0.5, 0.1, 8, 12]} />
        <meshPhysicalMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.7}
          roughness={0.3}
          metalness={0.85}
          clearcoat={0.5}
        />
      </mesh>
      {/* Teeth */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`tooth-${i}`}
            position={[Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.12, 0.15, 0.1]} />
            <meshPhysicalMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={0.5}
              roughness={0.35}
              metalness={0.85}
            />
          </mesh>
        );
      })}
      {/* Center axle */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.18, 12]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
});
GearIcon.displayName = 'GearIcon';

const ChartIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => {
  const bars = useMemo(
    () => [0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => ({
      height: h,
      x: (i - 2.5) * 0.22,
      color: new THREE.Color(color).offsetHSL(i * 0.04, 0, (i - 3) * 0.04),
    })),
    [color]
  );

  return (
    <group>
      {bars.map((bar, i) => (
        <mesh key={`bar-${i}`} position={[bar.x, bar.height / 2 - 0.45, 0]}>
          <boxGeometry args={[0.14, bar.height, 0.14]} />
          <meshPhysicalMaterial
            color={bar.color}
            emissive={emissive}
            emissiveIntensity={0.6}
            roughness={0.15}
            metalness={0.4}
            clearcoat={0.7}
            transmission={0.35}
            thickness={0.08}
            ior={1.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* Base line */}
      <mesh position={[0, -0.46, 0]}>
        <boxGeometry args={[1.5, 0.02, 0.02]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
});
ChartIcon.displayName = 'ChartIcon';

const AtomIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => {
  const orbitRef1 = useRef<THREE.Group>(null!);
  const orbitRef2 = useRef<THREE.Group>(null!);
  const orbitRef3 = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (orbitRef1.current) orbitRef1.current.rotation.z = t * 1.2;
    if (orbitRef2.current) orbitRef2.current.rotation.z = t * 0.9;
    if (orbitRef3.current) orbitRef3.current.rotation.z = t * 1.5;
  });

  return (
    <group>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={1.5}
          roughness={0.05}
          metalness={0.3}
          clearcoat={1}
          transmission={0.5}
          ior={2.1}
        />
      </mesh>
      {/* Orbit 1 */}
      <group ref={orbitRef1} rotation={[0, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.01, 8, 64]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshPhysicalMaterial color={color} emissive={emissive} emissiveIntensity={2} />
        </mesh>
      </group>
      {/* Orbit 2 */}
      <group ref={orbitRef2} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.01, 8, 64]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshPhysicalMaterial color={color} emissive={emissive} emissiveIntensity={2} />
        </mesh>
      </group>
      {/* Orbit 3 */}
      <group ref={orbitRef3} rotation={[-Math.PI / 3, Math.PI / 5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.01, 8, 64]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshPhysicalMaterial color={color} emissive={emissive} emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
});
AtomIcon.displayName = 'AtomIcon';

const CodeIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => (
  <group>
    {/* Terminal screen */}
    <mesh>
      <boxGeometry args={[1.0, 0.7, 0.05]} />
      <meshPhysicalMaterial
        color="#0D1117"
        emissive={emissive}
        emissiveIntensity={0.3}
        roughness={0.1}
        metalness={0.5}
        clearcoat={0.9}
      />
    </mesh>
    {/* Code lines */}
    {[0.22, 0.1, -0.02, -0.14, -0.22].map((y, i) => (
      <mesh key={`line-${i}`} position={[-0.1 + i * 0.03, y, 0.03]}>
        <boxGeometry args={[0.15 + Math.random() * 0.5, 0.04, 0.01]} />
        <meshStandardMaterial
          color={i % 2 === 0 ? color : '#88DDFF'}
          emissive={i % 2 === 0 ? emissive : '#4488AA'}
          emissiveIntensity={1.2}
          transparent
          opacity={0.9}
        />
      </mesh>
    ))}
    {/* Brackets < /> */}
    <mesh position={[-0.35, 0, 0.04]}>
      <boxGeometry args={[0.08, 0.4, 0.01]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.5} />
    </mesh>
    <mesh position={[0.35, 0, 0.04]}>
      <boxGeometry args={[0.08, 0.4, 0.01]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.5} />
    </mesh>
  </group>
));
CodeIcon.displayName = 'CodeIcon';

const ArtIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => (
  <group>
    {/* Palette */}
    <mesh>
      <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial
        color="#F5DEB3"
        roughness={0.6}
        metalness={0.1}
        clearcoat={0.3}
      />
    </mesh>
    {/* Paint dots */}
    {[
      { pos: [-0.2, 0.08, 0.1] as [number, number, number], col: '#FF4444' },
      { pos: [0.15, 0.08, -0.15] as [number, number, number], col: '#4444FF' },
      { pos: [0.0, 0.08, 0.25] as [number, number, number], col: '#FFFF00' },
      { pos: [-0.25, 0.08, -0.1] as [number, number, number], col: color },
      { pos: [0.3, 0.08, 0.1] as [number, number, number], col: '#00FF88' },
    ].map((dot, i) => (
      <mesh key={`dot-${i}`} position={dot.pos}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshPhysicalMaterial
          color={dot.col}
          emissive={dot.col}
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.9}
        />
      </mesh>
    ))}
    {/* Brush */}
    <mesh position={[0.4, 0.15, 0]} rotation={[0, 0, -Math.PI / 6]}>
      <cylinderGeometry args={[0.02, 0.03, 0.5, 8]} />
      <meshStandardMaterial color="#8B4513" roughness={0.8} />
    </mesh>
    <mesh position={[0.5, 0.32, 0]} rotation={[0, 0, -Math.PI / 6]}>
      <coneGeometry args={[0.05, 0.12, 8]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.6} />
    </mesh>
  </group>
));
ArtIcon.displayName = 'ArtIcon';

const GlobeIcon: React.FC<{ color: string; emissive: string }> = React.memo(({ color, emissive }) => {
  const globeRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (globeRef.current) globeRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <group>
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.3}
          clearcoat={0.8}
          transmission={0.25}
          thickness={0.2}
          ior={1.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Latitude lines */}
      {[-0.3, 0, 0.3].map((y, i) => (
        <mesh key={`lat-${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.sqrt(0.25 - y * y), 0.008, 8, 32]} />
          <meshStandardMaterial color="#FFFFFF" emissive={emissive} emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Longitude line */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.5, 0.008, 8, 32]} />
        <meshStandardMaterial color="#FFFFFF" emissive={emissive} emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
    </group>
  );
});
GlobeIcon.displayName = 'GlobeIcon';

const ICON_MAP: Record<string, React.FC<{ color: string; emissive: string }>> = {
  dna: DNAHelix,
  chip: ChipIcon,
  gear: GearIcon,
  chart: ChartIcon,
  atom: AtomIcon,
  code: CodeIcon,
  art: ArtIcon,
  globe: GlobeIcon,
};

// --- Floating domain item ---
const DomainItem: React.FC<{
  domain: KnowledgeDomain;
  isActive: boolean;
  delay: number;
}> = React.memo(({ domain, isActive, delay }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  const { scale, opacity } = useSpring({
    scale: isActive ? domain.scale : 0.001,
    opacity: isActive ? 1 : 0,
    config: { ...springConfig.wobbly, tension: 100, friction: 18, duration: 1500 },
    delay: isActive ? delay : 0,
    onChange: () => invalidate(),
  });

  useFrame((state) => {
    if (!groupRef.current || !isActive) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y =
      domain.position[1] + Math.sin(t * domain.floatSpeed + domain.position[0]) * domain.floatAmplitude;
    groupRef.current.rotation.y += 0.002 * domain.rotationSpeed;
    groupRef.current.rotation.x = Math.sin(t * 0.3 + domain.position[2]) * 0.05;
    invalidate();
  });

  const IconComponent = ICON_MAP[domain.icon];
  if (!IconComponent) return null;

  const typedScale = scale as any;
  const typedOpacity = opacity as any;

  return (
    <animated.group
      ref={groupRef}
      position={domain.position}
      scale={typedScale}
      visible={typedOpacity.to((o: number) => o > 0.01)}
    >
      <IconComponent color={domain.color} emissive={domain.emissive} />
      {/* Point light halo around each domain */}
      <pointLight
        color={domain.color}
        intensity={1.5}
        distance={5}
        decay={2}
      />
    </animated.group>
  );
});
DomainItem.displayName = 'DomainItem';

// --- Main Knowledge World Component ---
interface KnowledgeWorldProps {
  isActive: boolean;
}

export const KnowledgeWorld: React.FC<KnowledgeWorldProps> = React.memo(({ isActive }) => {
  return (
    <group>
      {DOMAINS.map((domain, index) => (
        <DomainItem
          key={domain.id}
          domain={domain}
          isActive={isActive}
          delay={200 + index * 280}
        />
      ))}
    </group>
  );
});
KnowledgeWorld.displayName = 'KnowledgeWorld';
