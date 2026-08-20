/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/KnowledgeSeed.tsx
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useSpring,
  a,
  config as springConfig,
  SpringValue,
} from '@react-spring/three';

interface KnowledgeSeedProps {
  onSeedClick: () => void;
  isActivating: boolean;
  onActivationComplete?: () => void;
  visible?: boolean;
  initialRadius?: number;
  pulseScaleFactor?: number;
  finalScaleFactorAfterPulse?: number;
  pulseDuration?: number;
  shrinkFadeDuration?: number;
  baseY?: number;
  pulseY?: number;
  finalYAfterPulse?: number; // This should match TRUNK_BASE_Y_POSITION from IntroPage
}

const AnimatedMesh = a.mesh;
const AnimatedPhysicalMaterial = a.meshPhysicalMaterial;
const AnimatedPointLight = a.pointLight;
const AnimatedGroup = a.group;

const SEED_COLORS = {
  idleBase: '#F0E68C',
  idleEmissive: '#BDB76B',
  pulseBase: '#FFFFE0',
  pulseEmissive: '#FFFACD',
  shrinkBase: '#6B4226',
};

export const KnowledgeSeed: React.FC<KnowledgeSeedProps> = React.memo(
  ({
    visible = true,
    onSeedClick,
    isActivating,
    onActivationComplete,
    initialRadius = 0.55,
    pulseScaleFactor = 1.4,
    finalScaleFactorAfterPulse = 0.0001,
    pulseDuration = 700, // Matches IntroPage constant
    shrinkFadeDuration = 600, // Matches IntroPage constant
    baseY = 0.9,
    pulseY = 1.3,
    finalYAfterPulse = -0.15, // Default to TRUNK_BASE_Y_POSITION
  }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const meshRef = useRef<THREE.Mesh>(null!);
    const { invalidate } = useThree();

    const geometry = useMemo(
      () => new THREE.IcosahedronGeometry(initialRadius, 3),
      [initialRadius]
    );
    const [pulseAnimationHasCompleted, setPulseAnimationHasCompleted] =
      useState(false);

    useEffect(() => {
      if (isActivating) setPulseAnimationHasCompleted(false);
    }, [isActivating]);

    const springProps = useSpring({
      scale: isActivating
        ? pulseAnimationHasCompleted
          ? finalScaleFactorAfterPulse
          : pulseScaleFactor
        : 1,
      groupY: isActivating
        ? pulseAnimationHasCompleted
          ? finalYAfterPulse
          : pulseY
        : baseY,
      opacity: isActivating ? (pulseAnimationHasCompleted ? 0 : 1) : 0.98,
      materialRoughness: isActivating
        ? pulseAnimationHasCompleted
          ? 0.6
          : 0.02
        : 0.05,
      materialMetalness: isActivating
        ? pulseAnimationHasCompleted
          ? 0.2
          : 0.6
        : 0.4,
      materialClearcoat: isActivating
        ? pulseAnimationHasCompleted
          ? 0
          : 0.9
        : 0.7,
      materialClearcoatRoughness: isActivating
        ? pulseAnimationHasCompleted
          ? 0.4
          : 0.01
        : 0.05,
      materialIor: isActivating
        ? pulseAnimationHasCompleted
          ? 1.3
          : 2.33
        : 1.9,
      materialTransmission: isActivating
        ? pulseAnimationHasCompleted
          ? 0
          : 0.85
        : 0.6,
      materialThickness: isActivating
        ? pulseAnimationHasCompleted
          ? 0
          : 0.3
        : 0.2,
      emissiveIntensity: isActivating
        ? pulseAnimationHasCompleted
          ? 0
          : 3.2
        : 0.7,
      lightIntensity: isActivating
        ? pulseAnimationHasCompleted
          ? 0
          : 2.2
        : 0.8,
      baseColor: isActivating
        ? pulseAnimationHasCompleted
          ? SEED_COLORS.shrinkBase
          : SEED_COLORS.pulseBase
        : SEED_COLORS.idleBase,
      emissiveColor: isActivating
        ? pulseAnimationHasCompleted
          ? SEED_COLORS.shrinkBase
          : SEED_COLORS.pulseEmissive
        : SEED_COLORS.idleEmissive,
      reset: isActivating,
      config: (_key: string) => {
        if (isActivating) {
          return pulseAnimationHasCompleted
            ? {
                ...springConfig.gentle,
                tension: 150,
                friction: 30,
                duration: shrinkFadeDuration,
              }
            : {
                ...springConfig.wobbly,
                tension: 170,
                friction: 10,
                duration: pulseDuration,
              };
        }
        return {
          ...springConfig.molasses,
          duration: 2000,
          tension: 80,
          friction: 50,
        };
      },
      onRest: (result) => {
        const currentScale = (result?.value as any)?.scale;
        if (
          isActivating &&
          !pulseAnimationHasCompleted &&
          result.finished &&
          currentScale >= pulseScaleFactor * 0.99
        ) {
          setPulseAnimationHasCompleted(true);
        }
        if (
          isActivating &&
          pulseAnimationHasCompleted &&
          result.finished &&
          (result.value as any).opacity < 0.01 &&
          onActivationComplete
        ) {
          onActivationComplete();
        }
      },
      onChange: () => invalidate(),
    });

    useFrame((state, delta) => {
      if (
        groupRef.current &&
        (springProps.opacity as SpringValue<number>).get() > 0.001
      ) {
        const isActivePulsePhase = isActivating && !pulseAnimationHasCompleted;
        const rotationSpeed = isActivePulsePhase ? 0.12 : 0.04;
        groupRef.current.rotation.y +=
          delta * rotationSpeed * (isActivePulsePhase ? 2.5 : 1);
        groupRef.current.rotation.x += delta * rotationSpeed * 0.3;
        groupRef.current.rotation.z += delta * rotationSpeed * 0.2;
        if (!isActivating && meshRef.current) {
          meshRef.current.position.y =
            Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
        } else if (meshRef.current) {
          meshRef.current.position.y = THREE.MathUtils.lerp(
            meshRef.current.position.y,
            0,
            0.1
          );
        }
        invalidate();
      }
    });

    const handleClick = (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (!isActivating) onSeedClick();
    };
    const isEffectivelyVanished =
      isActivating &&
      pulseAnimationHasCompleted &&
      (springProps.opacity as SpringValue<number>).get() < 0.001;
    if (!visible && !isActivating && !isEffectivelyVanished) return null;
    if (isEffectivelyVanished) return null;

    const typedSpring = springProps as any;

    return (
      <AnimatedGroup
        ref={groupRef}
        visible={typedSpring.opacity.to((o: number) => o > 0.005)}
        position-y={typedSpring.groupY}
        scale={typedSpring.scale}
      >
        <AnimatedMesh
          ref={meshRef}
          geometry={geometry}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={(e) => {
            if (!isActivating) e.object.scale.set(1.05, 1.05, 1.05);
            invalidate();
          }}
          onPointerOut={(e) => {
            if (!isActivating) e.object.scale.set(1, 1, 1);
            invalidate();
          }}
        >
          <AnimatedPhysicalMaterial
            color={typedSpring.baseColor}
            emissive={typedSpring.emissiveColor}
            emissiveIntensity={typedSpring.emissiveIntensity}
            roughness={typedSpring.materialRoughness}
            metalness={typedSpring.materialMetalness}
            clearcoat={typedSpring.materialClearcoat}
            clearcoatRoughness={typedSpring.materialClearcoatRoughness}
            ior={typedSpring.materialIor}
            transmission={typedSpring.materialTransmission}
            thickness={typedSpring.materialThickness}
            transparent={true}
            opacity={typedSpring.opacity}
          />
        </AnimatedMesh>
        <AnimatedPointLight
          color={typedSpring.emissiveColor}
          intensity={typedSpring.lightIntensity}
          distance={typedSpring.scale.to((s: number) =>
            Math.max(1, s * initialRadius * 20)
          )}
          decay={1.5}
        />
      </AnimatedGroup>
    );
  }
);
KnowledgeSeed.displayName = 'KnowledgeSeed';
