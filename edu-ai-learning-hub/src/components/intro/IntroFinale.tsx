/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/IntroFinale.tsx
// Màn kết: Hiển thị tên hệ thống + slogan trong 3D với hiệu ứng đỉnh cao
import React, { Suspense, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useSpring,
  a as animated,
  config as springConfig,
} from '@react-spring/three';

const FONT_URL = '/fonts/Inter_Bold.json';

const Text3DLazy = React.lazy(() =>
  import('@react-three/drei').then((module) => ({ default: module.Text3D }))
);
const AnimatedText3D = animated(Text3DLazy);
const AnimatedGroup = animated.group;

interface IntroFinaleProps {
  isVisible: boolean;
  title?: string;
  slogan?: string;
  subtitle?: string;
}

// --- Animated line decorations ---
const DecoLine: React.FC<{
  position: [number, number, number];
  width: number;
  color: string;
  delay: number;
  isVisible: boolean;
}> = React.memo(({ position, width, color, delay, isVisible }) => {
  const { invalidate } = useThree();
  const { scaleX, opacity } = useSpring({
    scaleX: isVisible ? 1 : 0,
    opacity: isVisible ? 0.7 : 0,
    config: { ...springConfig.wobbly, tension: 120, friction: 20, duration: 1200 },
    delay: isVisible ? delay : 0,
    onChange: () => invalidate(),
  });

  return (
    <animated.mesh
      position={position}
      scale-x={scaleX as any}
    >
      <boxGeometry args={[width, 0.02, 0.01]} />
      <animated.meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        transparent
        opacity={opacity as any}
        depthWrite={false}
      />
    </animated.mesh>
  );
});
DecoLine.displayName = 'DecoLine';

// --- Floating accent particles around the text ---
const TextAccentParticles: React.FC<{ isVisible: boolean }> = React.memo(({ isVisible }) => {
  const { invalidate } = useThree();
  const particles = useMemo(() => {
    const pts: { pos: [number, number, number]; size: number; color: string; delay: number }[] = [];
    for (let i = 0; i < 30; i++) {
      pts.push({
        pos: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 5 - 1,
          -1 - Math.random() * 3,
        ],
        size: 0.03 + Math.random() * 0.05,
        color: ['#FFD700', '#87CEEB', '#FF88DD', '#00FF88', '#E040FB'][
          Math.floor(Math.random() * 5)
        ],
        delay: Math.random() * 1500,
      });
    }
    return pts;
  }, []);

  return (
    <group>
      {particles.map((p, i) => {
        const ParticleItem: React.FC = () => {
          const { scale, opacity } = useSpring({
            scale: isVisible ? 1 : 0,
            opacity: isVisible ? 0.8 : 0,
            config: { ...springConfig.wobbly, tension: 80, friction: 12 },
            delay: isVisible ? p.delay + 600 : 0,
            onChange: () => invalidate(),
          });

          return (
            <animated.mesh
              position={p.pos}
              scale={scale as any}
            >
              <sphereGeometry args={[p.size, 6, 6]} />
              <animated.meshStandardMaterial
                color={p.color}
                emissive={p.color}
                emissiveIntensity={2}
                transparent
                opacity={opacity as any}
                depthWrite={false}
              />
            </animated.mesh>
          );
        };

        return <ParticleItem key={`accent-${i}`} />;
      })}
    </group>
  );
});
TextAccentParticles.displayName = 'TextAccentParticles';

export const IntroFinale: React.FC<IntroFinaleProps> = React.memo(
  ({
    isVisible,
    title = '3TEduTech',
    slogan = 'Khơi Nguồn Tri Thức, Kiến Tạo Tương Lai',
    subtitle = 'Nền tảng học tập thông minh với AI',
  }) => {
    const { invalidate } = useThree();

    const { opacity, positionY, scaleVal } = useSpring({
      opacity: isVisible ? 1 : 0,
      positionY: isVisible ? 0 : -1.5,
      scaleVal: isVisible ? 1 : 0.5,
      config: {
        mass: 1.3,
        tension: 70,
        friction: 28,
        duration: isVisible ? 2200 : 500,
      },
      delay: isVisible ? 300 : 0,
      onChange: () => invalidate(),
    });

    // Subtitle spring with extra delay
    const subtitleSpring = useSpring({
      opacity: isVisible ? 0.85 : 0,
      posY: isVisible ? -2.4 : -3.0,
      config: {
        ...springConfig.gentle,
        duration: 1800,
      },
      delay: isVisible ? 1200 : 0,
      onChange: () => invalidate(),
    });

    if (!isVisible && (opacity as any).get() < 0.01) return null;

    const typedSpring = { opacity, positionY, scaleVal } as any;

    return (
      <Suspense fallback={null}>
        <AnimatedGroup
          position-y={typedSpring.positionY}
          scale={typedSpring.scaleVal}
          rotation={[-Math.PI / 30, 0, 0]}
        >
          {/* === Main Title: 3TEduTech === */}
          <group position={[0, 0, 2]}>
            <AnimatedText3D
              font={FONT_URL}
              size={1.0}
              height={0.1}
              curveSegments={16}
              bevelEnabled
              bevelThickness={0.025}
              bevelSize={0.02}
              position={[-3.2, 0, 0]}
            >
              {title}
              <animated.meshPhysicalMaterial
                attach="material"
                color="#E8EAFF"
                emissive="#C0C8FF"
                emissiveIntensity={typedSpring.opacity.to((o: number) => o * 1.2)}
                roughness={0.05}
                metalness={0.92}
                clearcoat={1}
                clearcoatRoughness={0.02}
                transparent
                opacity={typedSpring.opacity}
                depthWrite={false}
              />
            </AnimatedText3D>
          </group>

          {/* === Decorative line === */}
          <DecoLine
            position={[0, -0.5, 2]}
            width={8}
            color="#FFD700"
            delay={800}
            isVisible={isVisible}
          />

          {/* === Slogan === */}
          <group position={[0, -1.2, 2]}>
            <AnimatedText3D
              font={FONT_URL}
              size={0.38}
              height={0.04}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.008}
              bevelSize={0.007}
              position={[-5.5, 0, 0]}
            >
              {slogan}
              <animated.meshStandardMaterial
                attach="material"
                color="#D0D8F8"
                emissive="#B0B8E8"
                emissiveIntensity={typedSpring.opacity.to((o: number) => o * 0.85)}
                roughness={0.1}
                metalness={0.8}
                transparent
                opacity={typedSpring.opacity}
                depthWrite={false}
              />
            </AnimatedText3D>
          </group>

          {/* === Subtitle (smaller, fades in later) === */}
          <animated.group position-y={subtitleSpring.posY as any}>
            <group position={[0, 0, 2]}>
              <AnimatedText3D
                font={FONT_URL}
                size={0.22}
                height={0.02}
                curveSegments={8}
                bevelEnabled={false}
                position={[-3.5, 0, 0]}
              >
                {subtitle}
                <animated.meshStandardMaterial
                  attach="material"
                  color="#A0B0D0"
                  emissive="#8090C0"
                  emissiveIntensity={0.5}
                  roughness={0.15}
                  metalness={0.6}
                  transparent
                  opacity={subtitleSpring.opacity as any}
                  depthWrite={false}
                />
              </AnimatedText3D>
            </group>
          </animated.group>

          {/* === Accent particles === */}
          <TextAccentParticles isVisible={isVisible} />

          {/* === Glow light behind text === */}
          <pointLight
            position={[0, -0.5, 4]}
            color="#8888FF"
            intensity={isVisible ? 3 : 0}
            distance={20}
            decay={2}
          />
          <pointLight
            position={[0, 1, 3]}
            color="#FFD700"
            intensity={isVisible ? 1.5 : 0}
            distance={15}
            decay={2}
          />
        </AnimatedGroup>
      </Suspense>
    );
  }
);

IntroFinale.displayName = 'IntroFinale';
