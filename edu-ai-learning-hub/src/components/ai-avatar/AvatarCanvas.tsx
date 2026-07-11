// src/components/ai-avatar/AvatarCanvas.tsx
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { AvatarModel } from './AvatarModel';
import { playBase64Audio, stopCurrentAudio } from '@/lib/ai/audioService';
import { Icons } from '../common/Icons';

interface AvatarCanvasProps {
  voiceData: string | null;
  onSpeakingStateChange: (isSpeaking: boolean) => void;
  externalAnimation?: string;
}

const TALKING_ANIMATION = 'Talking';
const IDLE_ANIMATION = 'Idle';

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  voiceData,
  onSpeakingStateChange,
  externalAnimation = IDLE_ANIMATION,
}) => {
  const [currentAnimation, setCurrentAnimation] = useState(IDLE_ANIMATION);

  // Ưu tiên animation đang nói
  useEffect(() => {
    if (currentAnimation !== TALKING_ANIMATION) {
      setCurrentAnimation(externalAnimation);
    }
  }, [externalAnimation, currentAnimation]);

  // Xử lý khi có dữ liệu voice mới
  useEffect(() => {
    if (voiceData) {
      playBase64Audio(
        `data:audio/wav;base64,${voiceData}`, // Thêm tiền tố MIME type
        () => {
          // onStart
          setCurrentAnimation(TALKING_ANIMATION);
          onSpeakingStateChange(true);
        },
        () => {
          // onEnd
          setCurrentAnimation(IDLE_ANIMATION);
          onSpeakingStateChange(false);
        }
      );
    }
    return () => stopCurrentAudio();
  }, [voiceData, onSpeakingStateChange]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0.9, 2.5], fov: 40 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1} castShadow />
        <Environment preset='city' />
        <Suspense
          fallback={
            <Html center>
              <div className='flex flex-col items-center gap-2'>
                <Icons.spinner className='h-8 w-8 animate-spin' />
                <span className='text-xs text-muted-foreground'>
                  Loading Avatar...
                </span>
              </div>
            </Html>
          }
        >
          <AvatarModel
            animationName={currentAnimation}
            position={[0, -0.9, 0]}
            scale={0.65}
          />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          target={[0, 0.9, 0]}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 10}
          maxAzimuthAngle={Math.PI / 10}
        />
      </Canvas>
    </div>
  );
};
