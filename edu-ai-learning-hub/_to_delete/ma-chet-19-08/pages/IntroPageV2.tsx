/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/IntroPageV2.tsx
// Phiên bản 2 của trang Intro - Cuốn Sách Tri Thức
// Giữ nguyên IntroPage.tsx cũ, file này là phiên bản mới hoàn toàn

import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Html,
  useProgress,
  Preload,
  useFont,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  FXAA,
  Vignette,
} from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import * as THREE from 'three';
import {
  useSpring,
  a as animated,
  config as springConfig,
} from '@react-spring/three';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { cn } from '@/lib/utils';

// New intro components
import { BookOfKnowledge } from '@/components/intro/BookOfKnowledge';
import { KnowledgeWorld } from '@/components/intro/KnowledgeWorld';
import { LightBurstParticles } from '@/components/intro/LightBurstParticles';
import { CosmicBackground } from '@/components/intro/CosmicBackground';
import { IntroFinale } from '@/components/intro/IntroFinale';

// --- Types ---
type IntroPhase =
  | 'loading'     // Đang tải assets
  | 'book'        // Cuốn sách lơ lửng, chờ click
  | 'opening'     // Sách đang mở ra, chói sáng
  | 'burst'       // Ánh sáng bùng nổ
  | 'world'       // Thế giới tri thức hiện ra
  | 'finale'      // Slogan + thông tin hệ thống
  | 'exiting';    // Đang thoát

const FONT_URL = '/fonts/Inter_Bold.json';

// --- Timing ---
const BOOK_OPEN_DURATION = 2500;
const BURST_DURATION = 2000;
const WORLD_DURATION = 6000;
const FINALE_DURATION = 7000;
const EXIT_FADE_DURATION = 1100;

// --- Colors ---
const PALETTE = {
  background: '#050310',
  loaderSpinner: 'text-amber-400',
  loaderTextPrimary: 'text-gray-300',
  loaderTextSecondary: 'text-amber-300',
};

// --- Loader ---
const Loader: React.FC = React.memo(() => {
  const { progress } = useProgress();
  return (
    <Html
      center
      wrapperClass="loader-wrapper fixed inset-0 flex items-center justify-center z-50"
    >
      <div className="text-center p-8 bg-black/80 rounded-2xl backdrop-blur-xl shadow-2xl border border-amber-900/30">
        <div className="relative w-20 h-20 mx-auto mb-5">
          {/* Book icon animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 text-amber-400 animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          {/* Rotating ring */}
          <div className="absolute inset-0 border-2 border-amber-400/30 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-amber-400 rounded-full" />
          </div>
        </div>
        <p className={`${PALETTE.loaderTextPrimary} text-lg tracking-wider`}>
          Đang mở cuốn sách tri thức...
        </p>
        <p className={`${PALETTE.loaderTextSecondary} text-3xl font-bold mt-2`}>
          {Math.round(progress)}%
        </p>
      </div>
    </Html>
  );
});
Loader.displayName = 'IntroV2Loader';

// --- Font Preloader ---
const GlobalPreloader = React.memo(() => {
  useFont.preload(FONT_URL);
  return null;
});
GlobalPreloader.displayName = 'GlobalPreloaderV2';

// --- Camera Controller ---
const CameraController: React.FC<{ phase: IntroPhase }> = React.memo(({ phase }) => {
  const { camera, controls, invalidate } = useThree() as any;

  const targetPosition = useMemo((): [number, number, number] => {
    switch (phase) {
      case 'book': return [0, 0.5, 5];
      case 'opening': return [0, 0.8, 3.5];
      case 'burst': return [0, 0.5, 2];
      case 'world': return [0, 1.5, 14];
      case 'finale': return [0, 0, 16];
      default: return [0, 0.5, 5];
    }
  }, [phase]);

  const targetLookAt = useMemo((): [number, number, number] => {
    switch (phase) {
      case 'book': return [0, 0.3, 0];
      case 'opening': return [0, 0.3, 0];
      case 'burst': return [0, 0, 0];
      case 'world': return [0, 0.5, 0];
      case 'finale': return [0, -0.5, 0];
      default: return [0, 0.3, 0];
    }
  }, [phase]);

  useSpring({
    to: {
      camX: targetPosition[0],
      camY: targetPosition[1],
      camZ: targetPosition[2],
      lookX: targetLookAt[0],
      lookY: targetLookAt[1],
      lookZ: targetLookAt[2],
    },
    config: () => {
      if (phase === 'burst')
        return { ...springConfig.stiff, tension: 200, friction: 30, duration: 1200 };
      if (phase === 'world')
        return { ...springConfig.slow, tension: 35, friction: 45, duration: 3000 };
      if (phase === 'finale')
        return { ...springConfig.gentle, tension: 40, friction: 50, duration: 2500 };
      if (phase === 'opening')
        return { ...springConfig.gentle, tension: 60, friction: 40, duration: 2000 };
      return { ...springConfig.gentle, duration: 1500 };
    },
    onChange: ({ value }) => {
      camera.position.set(value.camX, value.camY, value.camZ);
      const lookAt = new THREE.Vector3(value.lookX, value.lookY, value.lookZ);
      if (controls?.target) {
        controls.target.lerp(lookAt, 0.1);
        controls.update();
      } else {
        camera.lookAt(lookAt);
      }
      invalidate();
    },
  });

  return null;
});
CameraController.displayName = 'CameraControllerV2';

// --- Flash overlay for transition ---
const FlashOverlay: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className={cn(
      'fixed inset-0 z-30 pointer-events-none transition-opacity',
      active ? 'opacity-100' : 'opacity-0'
    )}
    style={{
      background: 'radial-gradient(circle, rgba(255,248,220,0.95) 0%, rgba(255,215,0,0.6) 40%, transparent 80%)',
      transitionDuration: active ? '200ms' : '1200ms',
    }}
  />
);

// === MAIN PAGE COMPONENT ===
const IntroPageV2: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<IntroPhase>('book');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const phaseTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      phaseTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Show hint after delay
  useEffect(() => {
    if (phase === 'book') {
      const timer = setTimeout(() => setShowHint(true), 5000);
      return () => clearTimeout(timer);
    }
    setShowHint(false);
  }, [phase]);

  // Exit handler
  const prepareToExit = useCallback(() => {
    if (isFadingOut || phase === 'exiting') return;
    setPhase('exiting');
    setIsFadingOut(true);
    localStorage.setItem('hasSeenIntro', 'true');
    setTimeout(() => navigate('/'), EXIT_FADE_DURATION);
  }, [isFadingOut, navigate, phase]);

  // Phase orchestration: Book click -> opening -> burst -> world -> finale -> exit
  const handleBookClick = useCallback(() => {
    if (phase !== 'book') return;
    setShowHint(false);
    setPhase('opening');

    const timers: NodeJS.Timeout[] = [];

    // After book opens, burst
    timers.push(
      setTimeout(() => {
        setShowFlash(true);
        setPhase('burst');
        // Flash off
        setTimeout(() => setShowFlash(false), 600);
      }, BOOK_OPEN_DURATION)
    );

    // After burst, show world
    timers.push(
      setTimeout(() => {
        setPhase('world');
      }, BOOK_OPEN_DURATION + BURST_DURATION)
    );

    // After world exploration, show finale
    timers.push(
      setTimeout(() => {
        setPhase('finale');
      }, BOOK_OPEN_DURATION + BURST_DURATION + WORLD_DURATION)
    );

    // After finale viewing, exit
    timers.push(
      setTimeout(() => {
        prepareToExit();
      }, BOOK_OPEN_DURATION + BURST_DURATION + WORLD_DURATION + FINALE_DURATION)
    );

    phaseTimersRef.current = timers;
  }, [phase, prepareToExit]);

  const handleSkip = useCallback(() => {
    phaseTimersRef.current.forEach(clearTimeout);
    prepareToExit();
  }, [prepareToExit]);

  // Compute background phase for cosmic backdrop
  const bgPhase = useMemo((): 'book' | 'world' | 'finale' => {
    if (phase === 'world') return 'world';
    if (phase === 'finale') return 'finale';
    return 'book';
  }, [phase]);

  return (
    <div
      className={cn(
        'relative w-screen h-screen overflow-hidden',
        'transition-opacity ease-out',
        isFadingOut ? 'opacity-0' : 'opacity-100'
      )}
      style={{
        background: `linear-gradient(135deg, ${PALETTE.background} 0%, #0a0520 50%, #0d0318 100%)`,
        transitionDuration: `${EXIT_FADE_DURATION}ms`,
      }}
    >
      {/* Flash overlay */}
      <FlashOverlay active={showFlash} />

      {/* 3D Canvas */}
      {!isFadingOut && (
        <>
          <Canvas
            frameloop="always"
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: false,
            }}
            dpr={[1, 1.5]}
            shadows
            camera={{ fov: 50, near: 0.1, far: 500, position: [0, 0.5, 5] }}
          >
            <CameraController phase={phase} />
            <color attach="background" args={[PALETTE.background]} />

            {/* Lighting */}
            <ambientLight intensity={0.08} />
            <directionalLight
              position={[5, 8, 5]}
              color="#FFF5E6"
              intensity={phase === 'opening' || phase === 'burst' ? 4 : 1.5}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight
              position={[-6, 4, -3]}
              color="#8888FF"
              intensity={1.2}
              distance={30}
              decay={2}
            />
            <pointLight
              position={[4, -2, 6]}
              color="#FFAA66"
              intensity={0.8}
              distance={25}
              decay={2}
            />

            {/* Stars */}
            <Stars
              radius={250}
              depth={100}
              count={6000}
              factor={4.5}
              saturation={0.1}
              fade
              speed={0.02}
            />

            <Suspense fallback={<Loader />}>
              <GlobalPreloader />

              {/* === Cosmic background === */}
              <CosmicBackground
                phase={bgPhase}
                dustActive={phase !== 'book'}
              />

              {/* === The Book === */}
              <BookOfKnowledge
                onClick={handleBookClick}
                isOpening={phase === 'opening'}
                isOpened={phase === 'burst' || phase === 'world' || phase === 'finale' || phase === 'exiting'}
                visible={phase === 'book' || phase === 'opening'}
              />

              {/* === Light Burst === */}
              <LightBurstParticles
                isActive={phase === 'burst' || phase === 'opening'}
                count={800}
                burstOrigin={[0, 0.3, 0]}
                particleSize={0.07}
                duration={3000}
              />

              {/* === Knowledge World === */}
              <KnowledgeWorld
                isActive={phase === 'world' || phase === 'finale'}
              />

              {/* === Finale: Brand + Slogan === */}
              <IntroFinale
                isVisible={phase === 'finale'}
                title="3TEduTech"
                slogan="Khơi Nguồn Tri Thức, Kiến Tạo Tương Lai"
                subtitle="Nền tảng học tập thông minh với AI"
              />

              <Preload all />
            </Suspense>

            {/* Floor for shadow */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -2, 0]}
              receiveShadow
            >
              <planeGeometry args={[500, 500]} />
              <shadowMaterial opacity={0.12} depthWrite={false} />
            </mesh>

            {/* Controls */}
            <OrbitControls
              enableZoom={phase === 'book'}
              enablePan={false}
              minDistance={3}
              maxDistance={25}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={phase === 'book'}
              autoRotateSpeed={0.04}
              enableDamping
              dampingFactor={0.025}
              enabled={phase === 'book' || phase === 'world'}
            />

            {/* Post-processing */}
            <EffectComposer multisampling={0} enableNormalPass={false}>
              <Bloom
                intensity={
                  phase === 'burst'
                    ? 1.8
                    : phase === 'opening'
                      ? 1.2
                      : phase === 'world'
                        ? 0.5
                        : phase === 'finale'
                          ? 0.7
                          : 0.25
                }
                luminanceThreshold={0.08}
                luminanceSmoothing={0.04}
                mipmapBlur
                kernelSize={KernelSize.VERY_LARGE}
                height={512}
              />
              <Vignette eskil={false} offset={0.12} darkness={0.85} />
              <FXAA />
            </EffectComposer>
          </Canvas>

          {/* === HTML Overlay UI === */}

          {/* Logo */}
          <div className="absolute top-6 sm:top-8 left-6 sm:left-8 z-20">
            <img
              src="/images/logo/3telogo.jpeg"
              alt="3TEduTech Logo"
              className="h-10 sm:h-12 opacity-90 hover:opacity-100 transition-opacity duration-300 filter drop-shadow-lg rounded-lg"
            />
          </div>

          {/* Skip / Enter button */}
          <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 z-20">
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              disabled={isFadingOut || phase === 'exiting'}
              className={cn(
                'text-gray-200 hover:text-white font-medium tracking-wider',
                'bg-black/25 hover:bg-white/15 backdrop-blur-lg',
                'border-gray-500/50 hover:border-amber-400/70',
                'px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base',
                'shadow-xl hover:shadow-2xl hover:shadow-amber-500/10',
                'transition-all duration-300 group'
              )}
            >
              {phase === 'book' ? 'Bỏ qua' : 'Vào Trang Chủ'}
              <Icons.arrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Button>
          </div>

          {/* Hint text */}
          {showHint && phase === 'book' && (
            <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 text-center">
              <p className="text-sm sm:text-base text-amber-300/80 animate-pulse tracking-wide">
                ✨ Click vào cuốn sách để mở cánh cửa tri thức ✨
              </p>
            </div>
          )}

          {/* Phase indicator dots */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {['book', 'opening', 'world', 'finale'].map((p, i) => (
              <div
                key={p}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-500',
                  phase === p || (phase === 'burst' && p === 'opening')
                    ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50'
                    : ['book', 'opening', 'burst', 'world', 'finale', 'exiting'].indexOf(phase) > i
                      ? 'bg-amber-400/50'
                      : 'bg-gray-600/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default IntroPageV2;
