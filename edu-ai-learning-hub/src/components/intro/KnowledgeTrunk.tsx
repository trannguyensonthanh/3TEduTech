/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/KnowledgeTrunk.tsx
import React, { useMemo, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useSpring,
  a,
  config as springConfig,
  SpringValue,
} from '@react-spring/three';

interface KnowledgeTrunkProps {
  isGrowing: boolean;
  onGrowthComplete?: () => void;
  onHeightChange?: (height: number) => void;
  finalHeight?: number;
  baseRadius?: number;
  topRadius?: number;
  color?: string;
  positionYOffset?: number;
  trunkMaterialProps?: Partial<THREE.MeshStandardMaterialParameters>;
  animationConfig?: typeof springConfig.molasses | object;
  animationDuration?: number;
}

const AnimatedGroup = a.group;
const AnimatedMeshStandardMaterial = a.meshStandardMaterial;

export const KnowledgeTrunk: React.FC<KnowledgeTrunkProps> = React.memo(
  ({
    isGrowing,
    onGrowthComplete,
    onHeightChange,
    finalHeight = 6.8,
    baseRadius = 0.3,
    topRadius = 0.09,
    color = '#403028',
    positionYOffset = -0.15,
    trunkMaterialProps,
    animationConfig = springConfig.molasses,
    animationDuration = 3400, // Matches IntroPage constant
  }) => {
    const { invalidate } = useThree();
    const meshRef = useRef<THREE.Mesh>(null!);

    const handleRest = useCallback(
      (result: {
        finished?: boolean;
        value: { scaleY: number; opacity: number };
      }) => {
        if (isGrowing && result.finished && onGrowthComplete)
          onGrowthComplete();
      },
      [isGrowing, onGrowthComplete]
    );
    const handleChange = useCallback(
      (springValues: { value: { scaleY: number; opacity: number } }) => {
        if (springValues.value.scaleY !== undefined && onHeightChange)
          onHeightChange(springValues.value.scaleY * finalHeight);
        invalidate();
      },
      [finalHeight, onHeightChange, invalidate]
    );

    const { scaleY, opacity, swayFactor } = useSpring({
      scaleY: isGrowing ? 1 : 0.0001,
      opacity: isGrowing ? 1 : 0,
      swayFactor: isGrowing ? 1 : 0,
      config: (animationConfig as { duration?: unknown }).duration
        ? animationConfig
        : {
            ...animationConfig,
            tension: 110,
            friction: 70,
            duration: animationDuration,
          },
      onRest: handleRest,
      onChange: handleChange,
      delay: isGrowing ? 150 : 0,
    });

    const trunkGeometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          topRadius,
          baseRadius,
          finalHeight,
          28,
          5,
          false
        ),
      [topRadius, baseRadius, finalHeight]
    );
    const typedScaleY = scaleY as SpringValue<number>;
    const typedOpacity = opacity as SpringValue<number>;
    const typedSwayFactor = swayFactor as SpringValue<number>;

    if (typedOpacity.get() < 0.005 && !isGrowing) return null;

    const defaultMaterialProps: Partial<THREE.MeshStandardMaterialParameters> =
      { color: color, roughness: 0.85, metalness: 0.01 };
    const combinedMaterialProps = {
      ...defaultMaterialProps,
      ...trunkMaterialProps,
    };

    return (
      <AnimatedGroup
        position-y={positionYOffset}
        scale-y={typedScaleY}
        rotation-z={typedSwayFactor.to(
          (sf) => Math.sin(sf * Math.PI * 2.5) * (1 - sf) * 0.035
        )}
        rotation-x={typedSwayFactor.to(
          (sf) => Math.cos(sf * Math.PI * 1.5) * (1 - sf) * 0.02
        )}
      >
        <mesh
          ref={meshRef}
          geometry={trunkGeometry}
          castShadow
          receiveShadow
          position-y={finalHeight / 2}
        >
          <AnimatedMeshStandardMaterial
            attach="material"
            transparent={true}
            opacity={typedOpacity}
            {...combinedMaterialProps}
          />
        </mesh>
      </AnimatedGroup>
    );
  }
);
KnowledgeTrunk.displayName = 'KnowledgeTrunk';
