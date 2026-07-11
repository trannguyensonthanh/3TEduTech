// src/components/ai-avatar/AvatarModel.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AvatarModelProps {
  animationName: string;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}

const modelPath = '/models/avatar.glb';

export const AvatarModel: React.FC<AvatarModelProps> = ({
  animationName,
  position = [0, 0, 0],
  scale = 0.7,
  rotation = [0, 0, 0],
}) => {
  // Không cần group ref nữa nếu dùng primitive trực tiếp
  // const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);

  // ----- THAY ĐỔI QUAN TRỌNG: Nhắm useAnimations vào scene -----
  // Cần đảm bảo scene ổn định, useGLTF cung cấp điều này
  const { actions, mixer, names } = useAnimations(animations, scene);
  // --------------------------------------------------------

  const [activeAction, setActiveAction] =
    useState<THREE.AnimationAction | null>(null);

  // useFrame để cập nhật mixer (vẫn cần thiết)
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });

  useEffect(() => {
    // Log này giờ quan trọng hơn để xem actions có thực sự rỗng không
    console.log('[AvatarModel Effect] Initial available actions:', actions);
    console.log('[AvatarModel Effect] Initial available names:', names);
  }, [actions, names]); // Chạy một lần khi actions/names được tạo

  // useEffect xử lý chuyển đổi animation
  useEffect(() => {
    // Log để xác nhận effect chạy và actions hiện tại
    console.log(`[AvatarModel Anim Change] Running for: "${animationName}"`);
    console.log(`[AvatarModel Anim Change] Current actions object:`, actions); // Xem actions ở đây

    const newAction = actions ? actions[animationName] : undefined; // Kiểm tra actions tồn tại

    console.log(`[AvatarModel Anim Change] Found action:`, newAction);
    console.log(`[AvatarModel Anim Change] Active action state:`, activeAction);

    if (newAction) {
      if (newAction !== activeAction) {
        activeAction?.fadeOut(0.5);
        console.log(
          `[AvatarModel Anim Change] Playing new: "${newAction.getClip().name}"`
        );
        newAction.reset().fadeIn(0.5).play();
        setActiveAction(newAction);
      } else {
        console.log(
          `[AvatarModel Anim Change] Same action "${animationName}".`
        );
      }
    } else {
      console.warn(
        `[AvatarModel Anim Change] Action "${animationName}" not found. Trying fallback 'idle'.`
      );
      const idleAction = actions ? actions['idle'] : undefined; // Kiểm tra actions tồn tại
      if (idleAction && idleAction !== activeAction) {
        activeAction?.fadeOut(0.5);
        console.log(
          `[AvatarModel Anim Change] Playing fallback: "${
            idleAction.getClip().name
          }"`
        );
        idleAction.reset().fadeIn(0.5).play();
        setActiveAction(idleAction);
      } else if (!idleAction) {
        console.error(
          "[AvatarModel Anim Change] Fallback 'idle' not found either!"
        );
      } else {
        console.log(
          "[AvatarModel Anim Change] Fallback 'idle' already active."
        );
      }
    }
    // Bỏ activeAction khỏi dependency array để tránh vòng lặp không cần thiết khi setActiveAction
  }, [animationName, actions, mixer]); // Chỉ phụ thuộc vào animationName, actions, mixer

  // ----- THAY ĐỔI QUAN TRỌNG: Render bằng primitive -----
  // Áp dụng transform trực tiếp lên primitive nếu cần
  // Hoặc giữ lại group chỉ để transform
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <primitive object={scene} dispose={null} />
    </group>
    // Hoặc nếu không cần group bao ngoài:
    // <primitive object={scene} position={position} scale={scale} rotation={rotation} dispose={null} />
  );
  // ----------------------------------------------------
};

useGLTF.preload(modelPath);
