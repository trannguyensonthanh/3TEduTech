/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/BookOfKnowledge.tsx
// Cuốn sách tri thức 3D - lơ lửng, xoay nhẹ, click để mở ra và phát sáng
import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useSpring,
  a as animated,
  config as springConfig,
  SpringValue,
} from '@react-spring/three';

interface BookOfKnowledgeProps {
  onClick: () => void;
  isOpening: boolean;
  isOpened: boolean;
  visible: boolean;
}

const AnimatedGroup = animated.group;
const AnimatedMesh = animated.mesh;
const AnimatedMeshStdMat = animated.meshStandardMaterial;
const AnimatedMeshPhysMat = animated.meshPhysicalMaterial;
const AnimatedPointLight = animated.pointLight;

// --- Book geometry helpers ---
function createBookCoverGeometry(
  width: number,
  height: number,
  depth: number,
  spineRadius: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + spineRadius, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2 + spineRadius, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - spineRadius);
  shape.lineTo(-width / 2, -height / 2 + spineRadius);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + spineRadius, -height / 2);

  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3,
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}

function createPagesGeometry(
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width * 0.92, height * 0.94, depth);
  return geo;
}

// --- Rune symbols (procedural decoration) ---
const RuneSymbols: React.FC<{ visible: boolean; glowIntensity: SpringValue<number> }> = React.memo(
  ({ visible, glowIntensity }) => {
    const runePositions = useMemo(() => {
      const positions: { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [];
      // Mặt trước
      for (let i = 0; i < 5; i++) {
        positions.push({
          pos: [
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.6,
            0.09,
          ],
          rot: [0, 0, Math.random() * Math.PI * 2],
          scale: 0.04 + Math.random() * 0.06,
        });
      }
      return positions;
    }, []);

    if (!visible) return null;

    return (
      <group>
        {runePositions.map((rune, i) => (
          <AnimatedMesh
            key={`rune-${i}`}
            position={rune.pos as [number, number, number]}
            rotation={rune.rot as [number, number, number]}
            scale={rune.scale}
          >
            <torusGeometry args={[0.5, 0.15, 6, 4]} />
            <AnimatedMeshStdMat
              color="#FFD700"
              emissive="#FFA500"
              emissiveIntensity={glowIntensity}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.85}
            />
          </AnimatedMesh>
        ))}
      </group>
    );
  }
);
RuneSymbols.displayName = 'RuneSymbols';

export const BookOfKnowledge: React.FC<BookOfKnowledgeProps> = React.memo(
  ({ onClick, isOpening, isOpened, visible }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const topCoverRef = useRef<THREE.Group>(null!);
    const { invalidate } = useThree();

    // Geometries
    const coverGeo = useMemo(
      () => createBookCoverGeometry(1.6, 2.2, 0.06, 0.08),
      []
    );
    const pagesGeo = useMemo(
      () => createPagesGeometry(1.6, 2.2, 0.25),
      []
    );
    const spineGeo = useMemo(
      () => new THREE.CylinderGeometry(0.06, 0.06, 2.15, 16, 1, true),
      []
    );

    // Animation springs
    const bookSpring = useSpring({
      // Floating bob
      floatY: visible && !isOpened ? 0 : (isOpened ? -1.5 : 0),
      // Scale: idle -> opening pulse -> opened shrink
      scale: isOpening ? 1.15 : (isOpened ? 0.001 : 1),
      // Cover rotation (open the book)
      coverAngle: isOpening ? -Math.PI * 0.85 : 0,
      // Glow from inside
      innerGlow: isOpening ? 12 : (isOpened ? 0 : 0),
      // Rune glow on cover
      runeGlow: isOpening ? 3.5 : 0.6,
      // Overall opacity
      opacity: isOpened ? 0 : 1,

      config: (key) => {
        if (key === 'coverAngle') return { ...springConfig.slow, tension: 45, friction: 38, duration: 2200 };
        if (key === 'innerGlow') return { ...springConfig.wobbly, tension: 120, friction: 14, duration: 1800 };
        if (key === 'scale' && isOpened) return { ...springConfig.gentle, duration: 800, delay: 600 };
        return { ...springConfig.gentle, duration: 1200 };
      },
      onChange: () => invalidate(),
    });

    // Idle floating animation
    useFrame((state) => {
      if (!groupRef.current || isOpened) return;
      const t = state.clock.elapsedTime;
      // Gentle float
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.15 + 0.3;
      // Slow rotation
      if (!isOpening) {
        groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.15;
        groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.04 - 0.1;
      }
      invalidate();
    });

    const handleClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!isOpening && !isOpened) onClick();
      },
      [onClick, isOpening, isOpened]
    );

    if (!visible && !isOpening && !isOpened) return null;

    const typedSpring = bookSpring as any;

    return (
      <AnimatedGroup
        ref={groupRef}
        scale={typedSpring.scale}
        visible={typedSpring.opacity.to((o: number) => o > 0.01)}
        onClick={handleClick}
        onPointerOver={(e: any) => {
          if (!isOpening && !isOpened) {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {/* === Bottom Cover (stays flat) === */}
        <mesh
          geometry={coverGeo}
          position={[0, -0.14, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color="#2C1810"
            roughness={0.65}
            metalness={0.15}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
          />
        </mesh>

        {/* === Pages Block === */}
        <mesh
          geometry={pagesGeo}
          position={[0.04, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#F5F0E8"
            roughness={0.95}
            metalness={0}
          />
        </mesh>

        {/* === Inner Light (shining from between pages when opening) === */}
        <AnimatedPointLight
          position={[0, 0, 0]}
          color="#FFF8E7"
          intensity={typedSpring.innerGlow}
          distance={15}
          decay={1.5}
        />
        <AnimatedPointLight
          position={[0, 0.05, 0.3]}
          color="#87CEEB"
          intensity={typedSpring.innerGlow.to((v: number) => v * 0.4)}
          distance={10}
          decay={2}
        />

        {/* === Top Cover (opens up) === */}
        <animated.group
          ref={topCoverRef}
          position={[-0.8, 0.14, 0]}
          rotation-z={typedSpring.coverAngle}
        >
          <group position={[0.8, 0, 0]}>
            <mesh
              geometry={coverGeo}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
              receiveShadow
            >
              <AnimatedMeshPhysMat
                color="#1A0F0A"
                roughness={0.55}
                metalness={0.2}
                clearcoat={0.4}
                clearcoatRoughness={0.3}
                emissive="#3D2B1F"
                emissiveIntensity={typedSpring.runeGlow.to((v: number) => v * 0.15)}
              />
            </mesh>

            {/* Gold trim/border on cover */}
            <mesh
              position={[0, 0, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[0.85, 0.02, 4, 4]} />
              <AnimatedMeshStdMat
                color="#DAA520"
                emissive="#FFD700"
                emissiveIntensity={typedSpring.runeGlow}
                metalness={0.95}
                roughness={0.05}
              />
            </mesh>

            {/* Rune decorations */}
            <RuneSymbols
              visible={visible || isOpening}
              glowIntensity={typedSpring.runeGlow}
            />

            {/* Center emblem */}
            <mesh position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 4]}>
              <octahedronGeometry args={[0.18, 0]} />
              <AnimatedMeshPhysMat
                color="#FFD700"
                emissive="#FFA500"
                emissiveIntensity={typedSpring.runeGlow.to((v: number) => v * 1.5)}
                metalness={0.95}
                roughness={0.02}
                clearcoat={1}
                clearcoatRoughness={0.02}
                ior={2.33}
                transmission={0.3}
                thickness={0.1}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        </animated.group>

        {/* === Spine === */}
        <mesh
          geometry={spineGeo}
          position={[-0.82, 0, 0]}
          rotation={[0, 0, 0]}
          castShadow
        >
          <meshPhysicalMaterial
            color="#2C1810"
            roughness={0.7}
            metalness={0.1}
            clearcoat={0.2}
          />
        </mesh>

        {/* === Gold spine bands === */}
        {[-0.6, -0.2, 0.2, 0.6].map((y, i) => (
          <mesh key={`band-${i}`} position={[-0.82, y, 0]}>
            <torusGeometry args={[0.065, 0.008, 8, 16]} />
            <AnimatedMeshStdMat
              color="#DAA520"
              emissive="#FFD700"
              emissiveIntensity={typedSpring.runeGlow.to((v: number) => v * 0.8)}
              metalness={0.95}
              roughness={0.05}
            />
          </mesh>
        ))}
      </AnimatedGroup>
    );
  }
);

BookOfKnowledge.displayName = 'BookOfKnowledge';
