/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/intro/KnowledgeBranch.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useSpring,
  a,
  config as springConfig,
  SpringValue,
} from '@react-spring/three';

interface CrystalLeafProps {
  color: string;
  position: [number, number, number];
  initialScaleFactor: number;
  isBranchHovered: boolean;
  isTreeComplete: boolean;
  randomOffset: number;
  branchIsMostlyGrown: boolean;
  leafAppearDelay?: number;
}
const AnimatedPhysicalMaterialLeaf = a.meshPhysicalMaterial;

const CrystalLeaf: React.FC<CrystalLeafProps> = React.memo(
  ({
    color,
    position,
    initialScaleFactor,
    isBranchHovered,
    isTreeComplete,
    randomOffset,
    branchIsMostlyGrown,
    leafAppearDelay = 0,
  }) => {
    const leafMeshRef = useRef<THREE.Mesh>(null!);
    const { invalidate } = useThree();
    const baseLeafSize = 0.2 * initialScaleFactor; // Lá nhỏ hơn nữa
    const geometry = useMemo(() => {
      const geom = new THREE.IcosahedronGeometry(baseLeafSize, 0);
      geom.scale(0.85, 1.15, 0.85);
      geom.computeVertexNormals();
      return geom;
    }, [baseLeafSize]);
    const { leafAppearScale, leafOpacity, leafRotation } = useSpring({
      leafAppearScale: branchIsMostlyGrown ? 1 : 0.001,
      leafOpacity: branchIsMostlyGrown ? 0.9 : 0,
      leafRotation: branchIsMostlyGrown ? 0 : Math.PI / 3.5,
      config: {
        ...springConfig.wobbly,
        tension: 180,
        friction: 16,
        duration: 750,
      },
      delay: leafAppearDelay + Math.random() * 200,
      onChange: () => invalidate(),
    }); // Thêm random delay nhỏ cho lá
    const { emissiveIntensityLeaf, leafHoverScale, iorLeaf, transmissionLeaf } =
      useSpring({
        emissiveIntensityLeaf:
          isBranchHovered && isTreeComplete && branchIsMostlyGrown ? 1.5 : 0.7,
        leafHoverScale:
          isBranchHovered && isTreeComplete && branchIsMostlyGrown ? 1.25 : 1.0,
        iorLeaf:
          isBranchHovered && isTreeComplete && branchIsMostlyGrown
            ? 2.15
            : 1.85,
        transmissionLeaf:
          isBranchHovered && isTreeComplete && branchIsMostlyGrown
            ? 0.88
            : 0.78,
        config: { ...springConfig.stiff, duration: 260 },
        onChange: () => invalidate(),
      });
    useFrame((state) => {
      if (leafMeshRef.current && leafAppearScale.get() > 0.01) {
        let currentScaleMultiplier = leafHoverScale.get();
        if (isTreeComplete && !isBranchHovered) {
          const time = state.clock.getElapsedTime();
          const breathFactor =
            1 +
            Math.sin(time * 0.75 + randomOffset * 1.3 + position[1]) * 0.055;
          currentScaleMultiplier *= breathFactor;
        }
        const finalScale = leafAppearScale.get() * currentScaleMultiplier;
        leafMeshRef.current.scale.set(finalScale, finalScale, finalScale);
        leafMeshRef.current.rotation.y +=
          0.0025 * Math.sin(state.clock.elapsedTime * 0.55 + randomOffset);
        leafMeshRef.current.rotation.x =
          leafRotation.get() +
          0.0018 * Math.cos(state.clock.elapsedTime * 0.65 + randomOffset);
        invalidate();
      } else if (leafMeshRef.current) {
        leafMeshRef.current.scale.set(0, 0, 0);
      }
    });

    const leafColor = useMemo(() => {
      const c = new THREE.Color(color);
      c.offsetHSL(
        0,
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.25) * 0.18
      );
      return c;
    }, [color]);

    if (leafAppearScale.get() < 0.01 && !branchIsMostlyGrown) return null;

    return (
      <a.mesh
        ref={leafMeshRef}
        geometry={geometry}
        position={position}
        castShadow
      >
        {' '}
        <AnimatedPhysicalMaterialLeaf
          color={leafColor}
          emissive={leafColor}
          emissiveIntensity={emissiveIntensityLeaf}
          roughness={0.04}
          metalness={0.06}
          clearcoat={0.85}
          clearcoatRoughness={0.06}
          ior={iorLeaf}
          transmission={transmissionLeaf}
          thickness={0.11}
          transparent
          opacity={leafOpacity}
        />{' '}
      </a.mesh>
    );
  }
);
CrystalLeaf.displayName = 'CrystalLeaf';

interface KnowledgeBranchProps {
  id: number | string;
  position: [number, number, number];
  baseRotation: [number, number, number];
  radialAngle: number;
  scaleTarget?: number;
  delay?: number;
  color?: string;
  animationComplete?: (id: KnowledgeBranchProps['id']) => void;
  isTreeComplete?: boolean;
}
const AnimatedGroupBranch = a.group;
const AnimatedMeshBranch = a.mesh;
const AnimatedPhysicalMaterialBranch = a.meshPhysicalMaterial;

export const KnowledgeBranch: React.FC<KnowledgeBranchProps> = React.memo(
  ({
    id,
    position,
    baseRotation,
    radialAngle,
    scaleTarget = 1.6,
    delay = 0,
    color = '#C3AED6',
    animationComplete,
    isTreeComplete = false,
  }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const { invalidate } = useThree();
    const [isBranchHovered, setIsBranchHovered] = useState(false);
    const [isBranchMostlyGrown, setIsBranchMostlyGrown] = useState(false);
    const branchRandomFactor = useMemo(() => Math.random() * Math.PI * 2.5, []);
    const stemLength = 2.5 * scaleTarget;
    const stemGeometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          0.02 * scaleTarget,
          0.1 * scaleTarget,
          stemLength,
          12,
          1
        ),
      [scaleTarget, stemLength]
    ); // Cành thuôn nhọn hơn
    const baseMaterialProps = useMemo(
      () => ({
        color: new THREE.Color(color).offsetHSL(0, -0.06, -0.12),
        emissive: new THREE.Color(color).multiplyScalar(0.35),
        roughness: 0.55,
        metalness: 0.08,
        clearcoat: 0.15,
        clearcoatRoughness: 0.45,
        ior: 1.42,
        transmission: 0.01,
        thickness: 0.04,
      }),
      [color]
    );
    const { groupScale, groupOpacity } = useSpring({
      from: { groupScale: 0.001, groupOpacity: 0 },
      to: { groupScale: 1, groupOpacity: 0.98 },
      delay: delay,
      config: {
        ...springConfig.wobbly,
        mass: 1.5,
        tension: 85,
        friction: 28,
        duration: 1350,
      },
      onRest: (result) => {
        if (result.finished && animationComplete) animationComplete(id);
      },
      onChange: (springValues) => {
        if (springValues.value.groupScale >= 0.75 && !isBranchMostlyGrown)
          setIsBranchMostlyGrown(true);
        invalidate();
      },
    });
    const { stemEmissiveIntensity, stemActualScale } = useSpring({
      stemEmissiveIntensity: isBranchHovered && isTreeComplete ? 0.9 : 0.4,
      stemActualScale: isBranchHovered && isTreeComplete ? 1.08 : 1,
      config: springConfig.stiff,
      onChange: () => invalidate(),
    });

    const initialQuaternion = useMemo(() => {
      const euler = new THREE.Euler(
        baseRotation[0],
        radialAngle + baseRotation[1],
        baseRotation[2],
        'YXZ'
      );
      return new THREE.Quaternion().setFromEuler(euler);
    }, [baseRotation, radialAngle]);
    useEffect(() => {
      if (groupRef.current) groupRef.current.quaternion.copy(initialQuaternion);
    }, [initialQuaternion]);

    useFrame((state) => {
      let hasChanged = false;
      if (groupRef.current && isTreeComplete) {
        const time = state.clock.getElapsedTime();
        const swaySpeed = 0.28 + (branchRandomFactor % 0.1);
        const swayAmount = 0.025 + (branchRandomFactor % 0.01); // Thêm chút ngẫu nhiên vào sway
        const swayXQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          Math.cos(time * (swaySpeed * 0.72) + branchRandomFactor * 0.62) *
            (swayAmount * 0.65)
        );
        const swayZQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          Math.sin(time * swaySpeed + branchRandomFactor) * swayAmount
        );
        groupRef.current.quaternion
          .copy(initialQuaternion)
          .multiply(swayXQ)
          .multiply(swayZQ);
        hasChanged = true;
      } else if (groupRef.current && !isTreeComplete) {
        if (!groupRef.current.quaternion.equals(initialQuaternion)) {
          groupRef.current.quaternion.slerp(initialQuaternion, 0.08);
          hasChanged = true;
        }
      }
      if (hasChanged) invalidate();
    });

    const leafPositions = useMemo((): [number, number, number][] => {
      const numLeaves = 15 + Math.floor(Math.random() * 7); // Nhiều lá hơn nữa
      const positions: [number, number, number][] = [];
      for (let i = 0; i < numLeaves; i++) {
        const ratioAlongBranch = 0.35 + Math.random() * 0.65; // Phân bổ lá rộng hơn trên cành
        const yPos = stemLength * ratioAlongBranch;
        const angle = Math.random() * Math.PI * 2;
        const radiusSpread =
          (0.03 + (1 - ratioAlongBranch * 0.8) * 0.28) *
          scaleTarget *
          (0.75 + Math.random() * 0.5); // Điều chỉnh sự tỏa ra của lá
        const offsetX = (Math.random() - 0.5) * 0.06 * scaleTarget;
        const offsetZ = (Math.random() - 0.5) * 0.06 * scaleTarget;
        positions.push([
          Math.cos(angle) * radiusSpread + offsetX,
          yPos - stemLength / 2 + 0.05 * scaleTarget,
          Math.sin(angle) * radiusSpread + offsetZ,
        ]);
      }
      return positions;
    }, [scaleTarget, stemLength]);

    const leafRandomOffsets = useMemo(
      () =>
        leafPositions.map(
          (_, i) =>
            branchRandomFactor +
            (i * Math.PI) / (leafPositions.length * 0.72) +
            position[1]
        ),
      [leafPositions, branchRandomFactor, position]
    );
    const typedGroupScale = groupScale as SpringValue<number>;
    const typedGroupOpacity = groupOpacity as SpringValue<number>;
    if (typedGroupScale.get() < 0.005 && typedGroupOpacity.get() < 0.005)
      return null;

    return (
      <AnimatedGroupBranch
        ref={groupRef}
        position={position}
        scale={typedGroupScale}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsBranchHovered(true);
          invalidate();
        }}
        onPointerOut={() => {
          setIsBranchHovered(false);
          invalidate();
        }}
      >
        <AnimatedMeshBranch
          geometry={stemGeometry}
          castShadow
          receiveShadow
          scale={stemActualScale as any}
          position={[0, stemLength / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <AnimatedPhysicalMaterialBranch
            {...baseMaterialProps}
            emissiveIntensity={stemEmissiveIntensity as any}
            transparent={true}
            opacity={typedGroupOpacity}
          />
        </AnimatedMeshBranch>
        <group name="crystalLeafGroup" position={[0, stemLength * 0.1, 0]}>
          {' '}
          {/* Dịch chuyển gốc của cụm lá lên trên một chút so với gốc cành */}
          {leafPositions.map((leafPos, index) => (
            <CrystalLeaf
              key={`${id}-leaf-${index}`}
              color={color}
              position={leafPos}
              initialScaleFactor={scaleTarget * 0.7}
              isBranchHovered={isBranchHovered}
              isTreeComplete={isTreeComplete}
              randomOffset={leafRandomOffsets[index]}
              branchIsMostlyGrown={isBranchMostlyGrown}
              leafAppearDelay={index * 60 + 300}
            />
          ))}
        </group>
      </AnimatedGroupBranch>
    );
  }
);
KnowledgeBranch.displayName = 'KnowledgeBranch';
