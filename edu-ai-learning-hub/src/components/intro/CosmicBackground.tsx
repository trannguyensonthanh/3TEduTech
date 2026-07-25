/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/CosmicBackground.tsx
// Nền vũ trụ với nebula gradient, sao, và particle haze
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';
import {
  useSpring,
  a as animated,
  config as springConfig,
} from '@react-spring/three';

// --- Nebula backdrop: huge gradient sphere inside-out ---
const NebulaBackdrop: React.FC<{ phase: 'book' | 'world' | 'finale' }> = React.memo(({ phase }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { invalidate } = useThree();

  const { colorTop, colorBottom, intensity } = useSpring({
    colorTop: phase === 'book'
      ? '#0a0520'
      : phase === 'world'
        ? '#050825'
        : '#0a0320',
    colorBottom: phase === 'book'
      ? '#15082a'
      : phase === 'world'
        ? '#0c1540'
        : '#1a0535',
    intensity: phase === 'world' ? 0.15 : 0.05,
    config: { ...springConfig.slow, duration: 3000 },
    onChange: () => invalidate(),
  });

  // Shader material for gradient sphere
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        colorTop: { value: new THREE.Color('#0a0520') },
        colorBottom: { value: new THREE.Color('#15082a') },
        glowIntensity: { value: 0.05 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        uniform float glowIntensity;
        varying vec3 vWorldPosition;
        void main() {
          float t = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 col = mix(colorBottom, colorTop, t);
          col += glowIntensity * vec3(0.3, 0.2, 0.5) * (1.0 - t);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);

  // Update shader uniforms from spring
  useFrame(() => {
    if (!shaderMaterial) return;
    const cTop = colorTop as any;
    const cBottom = colorBottom as any;
    const intVal = intensity as any;

    if (typeof cTop.get === 'function') {
      shaderMaterial.uniforms.colorTop.value.set(cTop.get());
    }
    if (typeof cBottom.get === 'function') {
      shaderMaterial.uniforms.colorBottom.value.set(cBottom.get());
    }
    if (typeof intVal.get === 'function') {
      shaderMaterial.uniforms.glowIntensity.value = intVal.get();
    }
  });

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <sphereGeometry args={[300, 32, 32]} />
    </mesh>
  );
});
NebulaBackdrop.displayName = 'NebulaBackdrop';

// --- Cosmic dust particles ---
const CosmicDust: React.FC<{
  count: number;
  isActive: boolean;
  spreadRadius?: number;
}> = React.memo(({ count, isActive, spreadRadius = 50 }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const { invalidate } = useThree();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spreadRadius;
      arr[i * 3 + 1] = Math.random() * spreadRadius * 0.6 - spreadRadius * 0.15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spreadRadius;
    }
    return arr;
  }, [count, spreadRadius]);

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#b8c0ff'),
      new THREE.Color('#ffd6ff'),
      new THREE.Color('#caffbf'),
      new THREE.Color('#ffc9de'),
      new THREE.Color('#a0c4ff'),
    ];
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)].clone();
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current?.geometry?.attributes?.position) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const effectiveDelta = Math.min(delta, 0.033);

    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += effectiveDelta * (0.03 + Math.random() * 0.05);
      if (pos[i + 1] > spreadRadius * 0.4) {
        pos[i + 1] = -spreadRadius * 0.2 - Math.random() * 3;
        pos[i] = (Math.random() - 0.5) * spreadRadius;
        pos[i + 2] = (Math.random() - 0.5) * spreadRadius;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    if (pointsRef.current.material instanceof THREE.PointsMaterial) {
      const target = isActive ? 0.65 : 0.2;
      pointsRef.current.material.opacity = THREE.MathUtils.lerp(
        pointsRef.current.material.opacity,
        target,
        0.03 * effectiveDelta * 60
      );
    }
    invalidate();
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <bufferAttribute
        attach="geometry-attributes-color"
        array={colors}
        itemSize={3}
        count={count}
      />
      <PointMaterial
        transparent
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        opacity={0.2}
        vertexColors
      />
    </Points>
  );
});
CosmicDust.displayName = 'CosmicDust';

// --- Orbital rings (subtle, around the world) ---
const OrbitalRings: React.FC<{ isActive: boolean }> = React.memo(({ isActive }) => {
  const group1Ref = useRef<THREE.Group>(null!);
  const group2Ref = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  const { opacity } = useSpring({
    opacity: isActive ? 0.25 : 0,
    config: { ...springConfig.gentle, duration: 2000 },
    onChange: () => invalidate(),
  });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group1Ref.current) group1Ref.current.rotation.y = t * 0.03;
    if (group2Ref.current) group2Ref.current.rotation.y = -t * 0.02;
  });

  const typedOpacity = opacity as any;

  return (
    <group>
      <animated.group ref={group1Ref} rotation={[Math.PI / 6, 0, Math.PI / 12]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[12, 0.015, 8, 128]} />
          <animated.meshStandardMaterial
            color="#8888FF"
            emissive="#6666CC"
            emissiveIntensity={0.5}
            transparent
            opacity={typedOpacity}
            depthWrite={false}
          />
        </mesh>
      </animated.group>
      <animated.group ref={group2Ref} rotation={[-Math.PI / 5, Math.PI / 3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[15, 0.012, 8, 128]} />
          <animated.meshStandardMaterial
            color="#FF88AA"
            emissive="#CC6688"
            emissiveIntensity={0.4}
            transparent
            opacity={typedOpacity}
            depthWrite={false}
          />
        </mesh>
      </animated.group>
    </group>
  );
});
OrbitalRings.displayName = 'OrbitalRings';

// --- Main export ---
interface CosmicBackgroundProps {
  phase: 'book' | 'world' | 'finale';
  dustActive: boolean;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = React.memo(
  ({ phase, dustActive }) => {
    return (
      <group>
        <NebulaBackdrop phase={phase} />
        <CosmicDust count={350} isActive={dustActive} />
        <OrbitalRings isActive={phase === 'world' || phase === 'finale'} />
      </group>
    );
  }
);
CosmicBackground.displayName = 'CosmicBackground';
