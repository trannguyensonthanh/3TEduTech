/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/TreeFlourishParticles.tsx
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  startTime: number;
  life: number;
  baseSize: number;
  color: THREE.Color;
  currentOpacity: number;
}
interface TreeFlourishParticlesProps {
  count?: number;
  isActive: boolean;
  treeHeight?: number;
  treeRadius?: number;
  particleBaseColor?: string;
  particleSize?: number;
  gravity?: number;
  initialUpwardVelocity?: number;
  spreadFactor?: number;
  lifespanRange?: [number, number];
  onComplete?: () => void;
}

export const TreeFlourishParticles: React.FC<TreeFlourishParticlesProps> =
  React.memo(
    ({
      count = 450,
      isActive,
      treeHeight = 7.0,
      treeRadius = 4.1,
      particleBaseColor = '#FFC0CB',
      particleSize = 0.075,
      gravity = 0.0085,
      initialUpwardVelocity = 0.65,
      spreadFactor = 1.8,
      lifespanRange = [3.8, 5.5],
      onComplete,
    }) => {
      const pointsRef = useRef<THREE.Points>(null!);
      const materialRef = useRef<THREE.PointsMaterial>(null!);
      const { invalidate, clock } = useThree();
      const onCompleteCalledRef = useRef(false);
      const particleColorsArray = useMemo(
        () => new Float32Array(count * 3),
        [count]
      );
      const particleOpacitiesArray = useMemo(
        () => new Float32Array(count),
        [count]
      ); // Not directly used by PointMaterial opacity unless custom shader

      const particlesData = useMemo<ParticleData[]>(() => {
        const data: ParticleData[] = [];
        const baseColorTHREE = new THREE.Color(particleBaseColor);
        for (let i = 0; i < count; i++) {
          const pColor = baseColorTHREE.clone();
          pColor.offsetHSL(
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.3) * 0.25
          );
          data.push({
            position: new THREE.Vector3(10000, 10000, 10000),
            velocity: new THREE.Vector3(),
            startTime: -1,
            life: THREE.MathUtils.randFloat(lifespanRange[0], lifespanRange[1]),
            baseSize: particleSize * THREE.MathUtils.randFloat(0.6, 1.6),
            color: pColor,
            currentOpacity: 0,
          });
        }
        return data;
      }, [count, lifespanRange, particleSize, particleBaseColor]);
      const positionsArray = useMemo(
        () => new Float32Array(count * 3),
        [count]
      );

      useEffect(() => {
        if (isActive) {
          onCompleteCalledRef.current = false;
          const currentTime = clock.getElapsedTime();
          particlesData.forEach((p, i) => {
            const theta = Math.random() * Math.PI * 2;
            const R = Math.pow(Math.random(), 0.6) * treeRadius * 1.2;
            const startY = treeHeight * (0.25 + Math.random() * 0.7);
            p.position.set(R * Math.cos(theta), startY, R * Math.sin(theta));
            const velocityXZAngle = Math.random() * Math.PI * 2;
            const horizontalSpeed = (0.15 + Math.random()) * spreadFactor * 0.3;
            p.velocity.set(
              Math.cos(velocityXZAngle) * horizontalSpeed,
              (0.45 + Math.random() * 0.55) * initialUpwardVelocity +
                initialUpwardVelocity * 0.5,
              Math.sin(velocityXZAngle) * horizontalSpeed
            );
            p.startTime = currentTime + Math.random() * 0.9;
            p.life = THREE.MathUtils.randFloat(
              lifespanRange[0],
              lifespanRange[1]
            );
            p.currentOpacity = 0;
            p.color.toArray(particleColorsArray, i * 3);
            particleOpacitiesArray[i] = 0;
          });
          if (pointsRef.current?.geometry.attributes.color)
            pointsRef.current.geometry.attributes.color.needsUpdate = true;
          if (materialRef.current) materialRef.current.opacity = 0.95;
          invalidate();
        }
      }, [
        isActive,
        clock,
        particlesData,
        treeHeight,
        treeRadius,
        lifespanRange,
        spreadFactor,
        initialUpwardVelocity,
        invalidate,
        particleColorsArray,
        particleOpacitiesArray,
      ]);

      useFrame((state, delta) => {
        if (!pointsRef.current || !materialRef.current) return;
        const currentTime = state.clock.getElapsedTime();
        let activeParticlesThisFrame = 0;
        let allParticlesInCurrentWaveExpired = true;
        let needsGeomUpdate = false;
        const needsColorAttribUpdate = false;
        const effectiveDelta = Math.min(delta, 0.04);

        for (let i = 0; i < count; i++) {
          const p = particlesData[i];
          if (p.startTime < 0 || currentTime < p.startTime) {
            positionsArray[i * 3 + 1] = -10000;
            if (p.currentOpacity !== 0) p.currentOpacity = 0;
            continue;
          }
          const elapsedTime = currentTime - p.startTime;
          if (elapsedTime > p.life) {
            positionsArray[i * 3 + 1] = -10000;
            if (p.currentOpacity !== 0) p.currentOpacity = 0;
            continue;
          }
          if (isActive && p.startTime > 0)
            allParticlesInCurrentWaveExpired = false;
          activeParticlesThisFrame++;
          needsGeomUpdate = true;
          p.velocity.y -= gravity * effectiveDelta * 60;
          const speed = p.velocity.length();
          const dragFactor = 0.03 + speed * 0.08;
          p.velocity.multiplyScalar(
            Math.max(0, 1 - dragFactor * effectiveDelta * 60)
          );
          p.position.addScaledVector(p.velocity, effectiveDelta);
          positionsArray[i * 3 + 0] = p.position.x;
          positionsArray[i * 3 + 1] = p.position.y;
          positionsArray[i * 3 + 2] = p.position.z;
          const lifeProgress = elapsedTime / p.life;
          if (lifeProgress < 0.15)
            p.currentOpacity = THREE.MathUtils.smoothstep(
              lifeProgress / 0.15,
              0,
              1
            );
          else if (lifeProgress > 0.7)
            p.currentOpacity =
              1.0 -
              THREE.MathUtils.smoothstep((lifeProgress - 0.7) / 0.3, 0, 1);
          else p.currentOpacity = 1.0;
        }
        
        if (needsGeomUpdate && pointsRef.current.geometry.attributes.position)
          pointsRef.current.geometry.attributes.position.needsUpdate = true;
        if (
          needsColorAttribUpdate &&
          pointsRef.current.geometry.attributes.color
        )
          pointsRef.current.geometry.attributes.color.needsUpdate = true;
        if (!isActive && materialRef.current.opacity > 0) {
          materialRef.current.opacity = Math.max(
            0,
            materialRef.current.opacity - 0.06 * effectiveDelta * 60
          );
          needsGeomUpdate = true;
        } else if (isActive && materialRef.current.opacity < 0.95) {
          materialRef.current.opacity = Math.min(
            0.95,
            materialRef.current.opacity + 0.12 * effectiveDelta * 60
          );
          needsGeomUpdate = true;
        }
        if (
          isActive &&
          allParticlesInCurrentWaveExpired &&
          activeParticlesThisFrame === 0 &&
          !onCompleteCalledRef.current &&
          onComplete
        ) {
          onComplete();
          onCompleteCalledRef.current = true;
        }
        if (
          needsGeomUpdate ||
          needsColorAttribUpdate ||
          (!isActive && materialRef.current.opacity > 0) ||
          (isActive && materialRef.current.opacity < 0.95)
        )
          invalidate();
      });
      if (
        !isActive &&
        (!materialRef.current || materialRef.current.opacity <= 0.001)
      )
        return null;
      return (
        <Points
          ref={pointsRef}
          positions={positionsArray}
          frustumCulled={false}
        >
          <bufferAttribute
            attach="geometry-attributes-color"
            array={particleColorsArray}
            itemSize={3}
            count={count}
          />
          <PointMaterial
            ref={materialRef}
            transparent
            size={particleSize}
            sizeAttenuation={true}
            depthWrite={false}
            opacity={0}
            vertexColors
            blending={THREE.AdditiveBlending}
          />
        </Points>
      );
    }
  );
TreeFlourishParticles.displayName = 'TreeFlourishParticles';
