// src/components/common/AbstractParticles.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AbstractParticlesProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
}

export const AbstractParticles: React.FC<AbstractParticlesProps> = ({
  count = 200,
  color = '#ffffff',
  size = 0.07,
  speed = 0.1,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 20 + Math.random() * 100; // factor để điều chỉnh khoảng cách và tốc độ
      const x = (Math.random() - 0.5) * factor * 2;
      const y = (Math.random() - 0.5) * factor * 1.5; // Giảm chiều cao phân bố
      const z = (Math.random() - 0.5) * factor * 1.5 - 20; // Đẩy lùi về sau một chút
      temp.push({ time, factor, x, y, z });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      const { factor, x, y, z } = particle;
      let { time } = particle;
      time += delta * speed * 10; // Tốc độ di chuyển chậm hơn

      // Di chuyển theo một quỹ đạo nhẹ nhàng, ví dụ lượn sóng hoặc xoáy tròn
      const newY = y + Math.sin(time + x / factor) * (factor / 20); // Lượn sóng theo trục Y
      const newX = x + Math.cos(time + y / factor) * (factor / 30); // Lượn nhẹ theo trục X

      dummy.position.set(newX, newY, z); // z không thay đổi nhiều để tạo chiều sâu

      // Reset khi ra khỏi tầm nhìn (ví dụ)
      if (time > 100) {
        // Hoặc khi y > một ngưỡng nào đó
        particle.time = Math.random() * -10; // Reset thời gian
        particle.x = (Math.random() - 0.5) * factor * 2;
        particle.y = (Math.random() - 0.5) * factor * 1.5 - factor / 5; // Xuất hiện lại từ dưới
      } else {
        particle.time = time;
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow={false}
      receiveShadow={false}
    >
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        roughness={0.8}
        metalness={0.1}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
};
