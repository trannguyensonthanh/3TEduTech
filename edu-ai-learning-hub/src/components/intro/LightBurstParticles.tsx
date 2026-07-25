/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/LightBurstParticles.tsx
// Hiệu ứng hạt ánh sáng bùng nổ khi sách mở ra
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';

interface LightBurstParticlesProps {
  isActive: boolean;
  count?: number;
  burstOrigin?: [number, number, number];
  burstRadius?: number;
  particleSize?: number;
  duration?: number;
  onComplete?: () => void;
}

export const LightBurstParticles: React.FC<LightBurstParticlesProps> = React.memo(
  ({
    isActive,
    count = 600,
    burstOrigin = [0, 0.3, 0],
    burstRadius = 12,
    particleSize = 0.06,
    duration = 3500,
    onComplete,
  }) => {
    const pointsRef = useRef<THREE.Points>(null!);
    const materialRef = useRef<THREE.PointsMaterial>(null!);
    const { invalidate, clock } = useThree();
    const onCompleteCalledRef = useRef(false);
    const startTimeRef = useRef(-1);

    // Particle data
    const positionsArray = useMemo(() => new Float32Array(count * 3), [count]);
    const colorsArray = useMemo(() => new Float32Array(count * 3), [count]);
    const velocitiesRef = useRef<THREE.Vector3[]>([]);
    const lifetimesRef = useRef<number[]>([]);

    // Initialize particle data
    useEffect(() => {
      const vels: THREE.Vector3[] = [];
      const lifetimes: number[] = [];

      const goldColor = new THREE.Color('#FFD700');
      const whiteColor = new THREE.Color('#FFFEF0');
      const cyanColor = new THREE.Color('#87CEEB');
      const magentaColor = new THREE.Color('#FF88DD');

      const colorOptions = [goldColor, whiteColor, cyanColor, magentaColor];

      for (let i = 0; i < count; i++) {
        // Random direction on sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 4;

        const vx = Math.sin(phi) * Math.cos(theta) * speed;
        const vy = Math.sin(phi) * Math.sin(theta) * speed * 0.6 + 1.5; // Upward bias
        const vz = Math.cos(phi) * speed;

        vels.push(new THREE.Vector3(vx, vy, vz));
        lifetimes.push(0.5 + Math.random() * (duration / 1000));

        // Random color from palette
        const pColor = colorOptions[Math.floor(Math.random() * colorOptions.length)].clone();
        pColor.offsetHSL(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.3) * 0.2
        );
        colorsArray[i * 3] = pColor.r;
        colorsArray[i * 3 + 1] = pColor.g;
        colorsArray[i * 3 + 2] = pColor.b;

        // Start off-screen
        positionsArray[i * 3] = 10000;
        positionsArray[i * 3 + 1] = 10000;
        positionsArray[i * 3 + 2] = 10000;
      }

      velocitiesRef.current = vels;
      lifetimesRef.current = lifetimes;
    }, [count, colorsArray, positionsArray, duration]);

    // Activate
    useEffect(() => {
      if (isActive) {
        onCompleteCalledRef.current = false;
        startTimeRef.current = clock.getElapsedTime();

        // Reset positions to burst origin
        for (let i = 0; i < count; i++) {
          positionsArray[i * 3] = burstOrigin[0] + (Math.random() - 0.5) * 0.3;
          positionsArray[i * 3 + 1] = burstOrigin[1] + (Math.random() - 0.5) * 0.3;
          positionsArray[i * 3 + 2] = burstOrigin[2] + (Math.random() - 0.5) * 0.3;
        }

        if (materialRef.current) materialRef.current.opacity = 1;
        invalidate();
      }
    }, [isActive, clock, count, burstOrigin, positionsArray, invalidate]);

    useFrame((state, delta) => {
      if (!pointsRef.current || !materialRef.current || startTimeRef.current < 0) return;

      const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
      const effectiveDelta = Math.min(delta, 0.04);
      let anyActive = false;

      for (let i = 0; i < count; i++) {
        const lifetime = lifetimesRef.current[i];
        const vel = velocitiesRef.current[i];

        if (elapsed > lifetime) {
          positionsArray[i * 3 + 1] = -10000;
          continue;
        }

        anyActive = true;

        // Apply velocity with drag
        const drag = 0.97;
        positionsArray[i * 3] += vel.x * effectiveDelta * drag;
        positionsArray[i * 3 + 1] += vel.y * effectiveDelta * drag;
        positionsArray[i * 3 + 2] += vel.z * effectiveDelta * drag;

        // Gravity
        vel.y -= 0.8 * effectiveDelta;

        // Slow down over time
        vel.multiplyScalar(1 - 0.3 * effectiveDelta);
      }

      if (pointsRef.current.geometry.attributes.position) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Fade out overall
      const progress = elapsed / (duration / 1000);
      if (progress > 0.6) {
        materialRef.current.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      // Completion check
      if (
        !anyActive &&
        isActive &&
        !onCompleteCalledRef.current &&
        onComplete
      ) {
        onComplete();
        onCompleteCalledRef.current = true;
      }

      if (anyActive || materialRef.current.opacity > 0) {
        invalidate();
      }
    });

    if (!isActive && startTimeRef.current < 0) return null;

    return (
      <Points ref={pointsRef} positions={positionsArray} frustumCulled={false}>
        <bufferAttribute
          attach="geometry-attributes-color"
          array={colorsArray}
          itemSize={3}
          count={count}
        />
        <PointMaterial
          ref={materialRef}
          transparent
          size={particleSize}
          sizeAttenuation
          depthWrite={false}
          opacity={0}
          vertexColors
          blending={THREE.AdditiveBlending}
        />
      </Points>
    );
  }
);

LightBurstParticles.displayName = 'LightBurstParticles';
