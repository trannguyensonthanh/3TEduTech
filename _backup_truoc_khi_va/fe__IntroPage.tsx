/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/IntroPage.tsx
import React, {
  Suspense,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useThree, invalidate } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Html,
  useProgress,
  Preload,
  useFont,
  PointMaterial,
  Points,
} from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { KnowledgeSeed } from '@/components/intro/KnowledgeSeed';
import { TreeModel, TreeModelInstances } from '@/components/intro/TreeModel';
import { TreeFlourishParticles } from '@/components/intro/TreeFlourishParticles';
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
import { cn } from '@/lib/utils';
import { TreeModelSimple } from '@/components/intro/TreeModelSimple';

// --- Type Definitions ---
type IntroStateType =
  | 'idle'
  | 'seedActivating'
  | 'trunkGrowing'
  | 'treeComplete'
  | 'sloganVisible'
  | 'exiting';

// --- Constants ---
const SEED_PULSE_DURATION = 700;
const SEED_SHRINK_FADE_DURATION = 600;
const FINAL_TRUNK_HEIGHT = 6.8;
const TRUNK_BASE_Y_POSITION = -0.15;
const TREE_APPEAR_DURATION = 3800;
// const BRANCH_BASE_DELAY = 350; const BRANCH_SPACING_DELAY = 450; // Không còn dùng nếu chỉ có TreeModel
const SHINE_EFFECT_DURATION = 800;
const FLOURISH_PARTICLES_DURATION = 4500;
const SLOGAN_DELAY_AFTER_FLOURISH_ENDS = 400;
const FINAL_VIEWING_DURATION = 8000;
const TREE_HEIGHT_MULTIPLIER = 1.2;
const TREE_WIDTH_DEPTH_MULTIPLIER = 1.0;
const SLOGAN_TEXT_MAIN = '3TEduTech';
const SLOGAN_TEXT_SUB = 'Khơi Nguồn Tri Thức, Kiến Tạo Tương Lai';
const FONT_URL = '/fonts/Inter_Bold.json';
const PALETTE = {
  background3D: '#070410',
  ambientLight: 0.12,
  mainLightColor: '#FFDAB9',
  fillLightColor: '#A89BFF',
  rimLightColor: '#DDEEFF',
  starSaturation: 0,
  loaderSpinner: 'text-purple-400',
  loaderTextPrimary: 'text-gray-300',
  loaderTextSecondary: 'text-purple-300',
  magicParticlesColor: '#b0c0ff',
  sloganTitleColor: '#E0E8FF',
  sloganSubtitleColor: '#C8D8F8',
  flourishParticleColor: '#FFC0CB',
  buttonText: 'text-gray-200',
  buttonBorder: 'border-gray-500/60',
  buttonHoverText: 'text-white',
  buttonHoverBorder: 'border-white/80',
  buttonHoverBg: 'bg-white/15',
  skipHintText: 'text-gray-400/90',
};

// --- Helper Components ---
const Loader: React.FC = React.memo(() => {
  const { progress } = useProgress();
  return (
    <Html
      center
      wrapperClass='loader-wrapper fixed inset-0 flex items-center justify-center z-50'
    >
      {' '}
      <div className='text-center p-6 bg-black/75 rounded-2xl backdrop-blur-xl shadow-2xl'>
        {' '}
        <Icons.spinner
          className={`h-16 w-16 animate-spin ${PALETTE.loaderSpinner} mx-auto`}
        />{' '}
        <p
          className={`${PALETTE.loaderTextPrimary} mt-5 text-lg sm:text-xl tracking-wide`}
        >
          Đang khám phá không gian tri thức...
        </p>{' '}
        <p
          className={`${PALETTE.loaderTextSecondary} text-3xl sm:text-4xl font-bold mt-2`}
        >
          {Math.round(progress)}%
        </p>{' '}
      </div>{' '}
    </Html>
  );
});
Loader.displayName = 'Loader';

const GlobalPreloader = React.memo(() => {
  useFont.preload(FONT_URL);
  return null;
});
GlobalPreloader.displayName = 'GlobalPreloader';

const Text3DLazy = React.lazy(() =>
  import('@react-three/drei').then((module) => ({ default: module.Text3D }))
);
const AnimatedText3DSpringForSlogan = animated(Text3DLazy);
const AnimatedGroupSpringForSlogan = animated.group;

// THÊM LẠI MAGICPARTICLES COMPONENT
const MagicParticles: React.FC<{ count: number; isActiveNow: boolean }> =
  React.memo(({ count, isActiveNow }) => {
    const pointsRef = useRef<THREE.Points>(null!);
    const { invalidate: localInvalidate, clock } = useThree(); // Thêm clock nếu cần cho frame logic phức tạp hơn
    const particlePositions = useMemo(() => {
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 0] = (Math.random() - 0.5) * 45; // Tăng phạm vi XZ
        arr[i * 3 + 1] = Math.random() * 28 - 8; // Tăng phạm vi Y
        arr[i * 3 + 2] = (Math.random() - 0.5) * 45;
      }
      return arr;
    }, [count]);

    useEffect(() => {
      // Reset opacity khi isActiveNow thay đổi nếu cần
      if (
        pointsRef.current &&
        pointsRef.current.material instanceof THREE.PointsMaterial
      ) {
        pointsRef.current.material.opacity = isActiveNow ? 0.18 : 0; // Khởi tạo opacity
      }
    }, [isActiveNow]);

    useThree(({ invalidate: globalInvalidate, clock: globalClock }) => {
      // Sử dụng useThree hook để lấy invalidate và clock
      if (!pointsRef.current?.geometry || !pointsRef.current.material) return;
      const stateNow = { clock: globalClock, delta: globalClock.getDelta() }; // Tạo state object cho useFrame logic

      const positions = pointsRef.current.geometry.attributes.position
        .array as Float32Array;
      const effectiveDelta = Math.min(stateNow.delta, 0.033);

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += effectiveDelta * (0.045 + Math.random() * 0.085); // Tốc độ Y nhanh hơn chút
        if (positions[i + 1] > 26) {
          // Giới hạn Y cao hơn
          positions[i + 1] = -9 - Math.random() * 4; // Reset Y thấp hơn
          positions[i] = (Math.random() - 0.5) * 48; // Reset XZ rộng hơn
          positions[i + 2] = (Math.random() - 0.5) * 48;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;

      if (pointsRef.current.material instanceof THREE.PointsMaterial) {
        const targetOpacity = isActiveNow ? 0.75 : 0.15; // Opacity rõ hơn khi active
        pointsRef.current.material.opacity = THREE.MathUtils.lerp(
          pointsRef.current.material.opacity,
          targetOpacity,
          0.03 * effectiveDelta * 60 // Lerp mượt hơn
        );
      }
      globalInvalidate();
    });

    return (
      <Points
        ref={pointsRef}
        positions={particlePositions}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color={PALETTE.magicParticlesColor}
          size={0.042} // Kích thước hạt lớn hơn chút
          sizeAttenuation
          depthWrite={false}
          opacity={0.15} // Opacity ban đầu
        />
      </Points>
    );
  });
MagicParticles.displayName = 'MagicParticles';

const IntroSlogan: React.FC<{
  isVisible: boolean;
  title: string;
  slogan?: string;
}> = React.memo(({ isVisible, title, slogan }) => {
  const { invalidate: localInvalidate } = useThree();
  const springProps = useSpring({
    opacity: isVisible ? 1 : 0,
    positionY: isVisible ? 0.2 : -0.7,
    scaleVal: isVisible ? 1 : 0.6,
    config: {
      mass: 1.2,
      tension: 90,
      friction: 32,
      duration: isVisible ? 1750 : 420,
    },
    delay: isVisible ? SLOGAN_DELAY_AFTER_FLOURISH_ENDS + 100 : 0,
    onStart: () => {
      if (isVisible) localInvalidate();
    },
    onRest: () => {
      if (isVisible) localInvalidate();
    },
    onChange: () => localInvalidate(),
  });
  if (!isVisible && springProps.opacity.get() < 0.01) return null;
  return (
    <Suspense fallback={null}>
      <AnimatedGroupSpringForSlogan
        position-y={springProps.positionY}
        scale={springProps.scaleVal}
        rotation={[-Math.PI / 24, 0, 0]}
        position={[0, -2.65, 2.3]}
        renderOrder={10}
      >
        {' '}
        <animated.group>
          <AnimatedText3DSpringForSlogan
            font={FONT_URL}
            size={0.8}
            height={0.085}
            curveSegments={16}
            bevelEnabled
            bevelThickness={0.019}
            bevelSize={0.017}
          >
            {' '}
            {title}{' '}
            <animated.meshStandardMaterial
              attach='material'
              color={PALETTE.sloganTitleColor}
              emissive={PALETTE.sloganTitleColor}
              emissiveIntensity={springProps.opacity.to((o) => o * 0.95)}
              roughness={0.08}
              metalness={0.88}
              transparent={true}
              opacity={springProps.opacity}
              depthWrite={false}
            />{' '}
          </AnimatedText3DSpringForSlogan>
          {slogan && (
            <AnimatedText3DSpringForSlogan
              font={FONT_URL}
              size={0.42}
              height={0.045}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.01}
              bevelSize={0.009}
              position-y={-0.95}
              position-z={0.03}
            >
              {' '}
              {slogan}{' '}
              <animated.meshStandardMaterial
                attach='material'
                color={PALETTE.sloganSubtitleColor}
                emissive={PALETTE.sloganSubtitleColor}
                emissiveIntensity={springProps.opacity.to((o) => o * 0.75)}
                roughness={0.12}
                metalness={0.8}
                transparent={true}
                opacity={springProps.opacity}
                depthWrite={false}
              />{' '}
            </AnimatedText3DSpringForSlogan>
          )}
        </animated.group>{' '}
      </AnimatedGroupSpringForSlogan>
    </Suspense>
  );
});
IntroSlogan.displayName = 'IntroSlogan';

const CameraAnimator: React.FC<{
  introState: IntroStateType;
  finalTreeHeight: number;
  currentTreeScale: number;
}> = React.memo(({ introState, finalTreeHeight, currentTreeScale }) => {
  const { camera, controls, invalidate: localInvalidate } = useThree() as any;
  const targetPosition = useMemo((): THREE.Vector3Tuple => {
    const treeCurrentHeightVisual = finalTreeHeight * currentTreeScale;
    if (introState === 'seedActivating') return [0, 0.35, 3.4];
    if (introState === 'trunkGrowing') {
      const progress = currentTreeScale;
      const zPath =
        progress < 0.8
          ? THREE.MathUtils.lerp(1.5, 5.0, progress / 0.8)
          : THREE.MathUtils.lerp(5.0, 4.5, (progress - 0.8) / 0.2);
      const yPath =
        TRUNK_BASE_Y_POSITION +
        treeCurrentHeightVisual * (0.15 + progress * 0.25) +
        0.7;
      return [0, yPath, zPath];
    }
    if (introState === 'treeComplete' || introState === 'sloganVisible')
      return [0, finalTreeHeight * 0.2, 14.0 + finalTreeHeight * 0.1];
    return [0, 1.8, 16];
  }, [introState, finalTreeHeight, currentTreeScale]);
  const targetLookAt = useMemo((): THREE.Vector3Tuple => {
    const treeCurrentHeightVisual = finalTreeHeight * currentTreeScale;
    if (introState === 'seedActivating')
      return [0, TRUNK_BASE_Y_POSITION + 0.1, 0];
    if (introState === 'trunkGrowing')
      return [
        0,
        TRUNK_BASE_Y_POSITION +
          treeCurrentHeightVisual * (0.4 + Math.min(currentTreeScale, 1) * 0.3),
        0,
      ];
    if (introState === 'treeComplete' || introState === 'sloganVisible')
      return [0, finalTreeHeight * 0.15, 0];
    return [0, 0.3, 0];
  }, [introState, finalTreeHeight, currentTreeScale]);
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
      if (introState === 'trunkGrowing')
        return {
          ...springConfig.molasses,
          tension: 40,
          friction: 50,
          duration: TREE_APPEAR_DURATION - 200,
        };
      if (introState === 'treeComplete')
        return {
          ...springConfig.gentle,
          tension: 60,
          friction: 40,
          duration: 2200,
        };
      if (introState === 'sloganVisible')
        return {
          ...springConfig.slow,
          tension: 45,
          friction: 52,
          duration: 2600,
        };
      return { ...springConfig.gentle, duration: 1700 };
    },
    onChange: ({ value }) => {
      camera.position.set(value.camX, value.camY, value.camZ);
      const lookAtVec = new THREE.Vector3(
        value.lookX,
        value.lookY,
        value.lookZ
      );
      if (controls?.target) {
        controls.target.lerp(lookAtVec, 0.12);
        controls.update();
      } else {
        camera.lookAt(lookAtVec);
      }
      localInvalidate();
    },
  });
  return null;
});
CameraAnimator.displayName = 'CameraAnimator';

const IntroPage = () => {
  const navigate = useNavigate();
  const [introState, setIntroState] = useState<IntroStateType>('idle');
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [triggerFlourish, setTriggerFlourish] = useState(false);
  const [shineEffectActive, setShineEffectActive] = useState(false);
  const [sloganReady, setSloganReady] = useState(false);
  const invalidateScene = useCallback(() => {
    invalidate();
  }, []);
  useEffect(() => {
    if (introState === 'idle') {
      setTriggerFlourish(false);
      setShineEffectActive(false);
      setSloganReady(false);
    }
  }, [introState]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (introState === 'idle' && !isFadingOut) setShowSkipHint(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [introState, isFadingOut]);
  const prepareToExit = useCallback(() => {
    if (isFadingOut || introState === 'exiting') return;
    setIntroState('exiting');
    setIsFadingOut(true);
    localStorage.setItem('hasSeenIntro', 'true');
    setTimeout(() => navigate('/'), 1100);
  }, [isFadingOut, navigate, introState]);
  const handleSkipIntro = useCallback(() => prepareToExit(), [prepareToExit]);
  const handleSeedClick = useCallback(() => {
    if (introState === 'idle') {
      setShowSkipHint(false);
      setIntroState('seedActivating');
    }
  }, [introState]);
  const handleSeedActivationComplete = useCallback(() => {
    if (introState === 'seedActivating') {
      setIntroState('trunkGrowing');
    }
  }, [introState]);
  useEffect(() => {
    if (
      introState === 'treeComplete' &&
      !shineEffectActive &&
      !triggerFlourish
    ) {
      setShineEffectActive(true);
      setTimeout(() => {
        setShineEffectActive(false);
        setTriggerFlourish(true);
      }, SHINE_EFFECT_DURATION);
    }
  }, [introState, shineEffectActive, triggerFlourish]);
  const handleFlourishComplete = useCallback(() => {
    if (introState === 'treeComplete' && triggerFlourish) {
      setSloganReady(true);
    }
  }, [introState, triggerFlourish]);
  useEffect(() => {
    if (sloganReady && introState === 'treeComplete') {
      setIntroState('sloganVisible');
    }
  }, [sloganReady, introState]);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (introState === 'sloganVisible' && !isFadingOut)
      timer = setTimeout(prepareToExit, FINAL_VIEWING_DURATION);
    return () => clearTimeout(timer);
  }, [introState, isFadingOut, prepareToExit]);

  const lightSpring = useSpring({
    intensity:
      introState !== 'idle' && introState !== 'seedActivating' ? 3.9 : 2.1,
    config: springConfig.gentle,
    onChange: invalidateScene,
  });
  const treeShineSpring = useSpring({
    bloomIntensity: shineEffectActive ? 0.9 : 0.22,
    mainLightIntensityFactor: shineEffectActive ? 1.8 : 1,
    trunkEmissive: shineEffectActive ? 0.5 : 0.05,
    leafEmissive: shineEffectActive ? 0.85 : 0.15,
    config: shineEffectActive
      ? { ...springConfig.wobbly, duration: SHINE_EFFECT_DURATION - 30 }
      : { ...springConfig.gentle, duration: SHINE_EFFECT_DURATION + 200 },
    onChange: invalidateScene,
  });
  const showTreeModel = useMemo(
    () =>
      introState === 'trunkGrowing' ||
      introState === 'treeComplete' ||
      introState === 'sloganVisible',
    [introState]
  );
  console.log('showTreeModel', showTreeModel);
  const treeAppearSpring = useSpring({
    scale: showTreeModel ? 1 : 0.001,
    opacity: showTreeModel ? 1 : 0,
    config:
      introState === 'trunkGrowing'
        ? {
            ...springConfig.molasses,
            duration: TREE_APPEAR_DURATION,
            tension: 100,
            friction: 90,
          }
        : springConfig.wobbly,
    delay: introState === 'trunkGrowing' ? SEED_SHRINK_FADE_DURATION - 150 : 0,
    onRest: () => {
      if (
        introState === 'trunkGrowing' &&
        treeAppearSpring.scale.get() > 0.99
      ) {
        setIntroState('treeComplete');
      }
    },
    onChange: invalidateScene,
  });
  const frameloopMode: 'always' | 'demand' =
    (introState === 'treeComplete' || introState === 'sloganVisible') &&
    !shineEffectActive &&
    !triggerFlourish &&
    !isFadingOut
      ? 'demand'
      : 'always';

  return (
    <div
      className={cn(
        'relative w-screen h-screen bg-gradient-to-br from-[#06030c] via-[#100a22] to-[#0a0616] overflow-hidden',
        'transition-opacity duration-1000 ease-out',
        isFadingOut ? 'opacity-0' : 'opacity-100',
        (introState === 'idle' || introState === 'seedActivating') &&
          !isFadingOut
          ? 'cursor-pointer'
          : 'cursor-default'
      )}
    >
      {!isFadingOut && (
        <>
          <Canvas // dùng Canvas để tạo không gian 3D
            frameloop={frameloopMode}
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: false,
            }}
            dpr={[1, 1.6]}
            shadows
          >
            <CameraAnimator // điều khiển camera theo trạng thái
              introState={introState}
              finalTreeHeight={FINAL_TRUNK_HEIGHT}
              currentTreeScale={treeAppearSpring.scale.get()}
            />
            <color attach='background' args={[PALETTE.background3D]} />
            <ambientLight intensity={PALETTE.ambientLight} />
            <animated.pointLight
              name='mainPointLight'
              position={[8.5, FINAL_TRUNK_HEIGHT * 0.98, 8.5]}
              color={PALETTE.mainLightColor}
              intensity={lightSpring.intensity.to(
                (base) => base * treeShineSpring.mainLightIntensityFactor.get()
              )}
              distance={135}
              decay={1.25}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0022}
            />
            <animated.directionalLight
              name='fillLight'
              position={[-12.5, FINAL_TRUNK_HEIGHT * 1.35, -9.5]}
              color={PALETTE.fillLightColor}
              intensity={treeShineSpring.mainLightIntensityFactor.to(
                (f) => 0.55 * f
              )}
            />
            <pointLight
              name='rimLight'
              position={[-7.5, FINAL_TRUNK_HEIGHT * 0.68, -13.5]}
              intensity={2.1}
              color={PALETTE.rimLightColor}
              distance={105}
              decay={1.35}
            />
            <Stars
              radius={290}
              depth={135}
              count={7500}
              factor={4.8}
              saturation={PALETTE.starSaturation}
              fade
              speed={0.018}
            />
            <Suspense fallback={<Loader />}>
              {' '}
              <GlobalPreloader />
              <KnowledgeSeed
                onSeedClick={handleSeedClick}
                isActivating={introState === 'seedActivating'}
                visible={
                  introState === 'idle' || introState === 'seedActivating'
                }
                onActivationComplete={handleSeedActivationComplete}
                baseY={0.9}
                pulseY={1.3}
                finalYAfterPulse={TRUNK_BASE_Y_POSITION}
                pulseDuration={SEED_PULSE_DURATION}
                shrinkFadeDuration={SEED_SHRINK_FADE_DURATION}
                initialRadius={0.55}
              />
              {showTreeModel && ( // Chỉ hiển thị TreeModel khi cần
                <animated.group // Sử dụng animated.group để scale và position
                  scale={0.001}
                  // Và bọc TreeModelSimple trong một group con để scale Y riêng
                  position={[-10, -5, 2]} // Vị trí bạn đã thấy đẹp
                  rotation={[0, -5, 0]}
                  visible={showTreeModel}
                >
                  <group
                    scale={[
                      TREE_WIDTH_DEPTH_MULTIPLIER,
                      TREE_HEIGHT_MULTIPLIER,
                      TREE_WIDTH_DEPTH_MULTIPLIER,
                    ]}
                  >
                    <pointLight
                      position={[-10, -5, 2]} // Tọa độ tương đối với gốc cây
                      intensity={Math.random() * 0.5 + 0.3} // Cường độ ngẫu nhiên nhẹ
                      color='#FFEECC'
                      distance={3}
                      decay={2}
                    />
                    <TreeModelSimple
                      trunkEmissiveIntensity={treeShineSpring.trunkEmissive}
                      leafEmissiveIntensity={treeShineSpring.leafEmissive}
                      visible={showTreeModel}
                    />
                  </group>
                </animated.group>
              )}
              <MagicParticles
                count={250}
                isActiveNow={introState !== 'idle' && introState !== 'exiting'}
              />{' '}
              {/* Tăng count cho MagicParticles */}
              <TreeFlourishParticles // dùng TreeFlourishParticles để tạo hiệu ứng lấp lánh
                isActive={triggerFlourish}
                onComplete={handleFlourishComplete}
                // Điều chỉnh treeHeight để hạt phát ra từ phần ngọn của cây đã scale
                treeHeight={
                  FINAL_TRUNK_HEIGHT *
                    TREE_HEIGHT_MULTIPLIER *
                    treeAppearSpring.scale.get() *
                    0.8 +
                  TRUNK_BASE_Y_POSITION +
                  5
                } // Ví dụ: 80% chiều cao cây, điều chỉnh Y_offset của cây
                // treeRadius cũng có thể cần điều chỉnh dựa trên tán cây mới
                treeRadius={
                  FINAL_TRUNK_HEIGHT *
                  TREE_WIDTH_DEPTH_MULTIPLIER *
                  treeAppearSpring.scale.get() *
                  1
                }
                count={800} // Tăng số lượng hạt
                particleBaseColor={'#FFD700'} // Màu vàng gold cho lấp lánh
                particleSize={0.08} // Kích thước hạt
                lifespanRange={[
                  (FLOURISH_PARTICLES_DURATION * 0.7) / 1000, // Sống ngắn hơn để tạo hiệu ứng "lóe sáng"
                  (FLOURISH_PARTICLES_DURATION * 1.0) / 1000,
                ]}
                gravity={0.005} // Giảm gravity để hạt bay lơ lửng hơn
                initialUpwardVelocity={0.3} // Giảm vận tốc lên ban đầu
                spreadFactor={1.2} // Giảm độ tỏa ra để tập trung ở ngọn
              />
              {/* Tinh chỉnh TreeFlourishParticles */}
              <IntroSlogan
                isVisible={introState === 'sloganVisible'}
                title={SLOGAN_TEXT_MAIN}
                slogan={SLOGAN_TEXT_SUB}
              />
              <Preload all />{' '}
            </Suspense>
            <mesh
              name='floor'
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, TRUNK_BASE_Y_POSITION - 0.12, 0]}
              receiveShadow
            >
              {' '}
              <planeGeometry args={[500, 500]} />{' '}
              <shadowMaterial opacity={0.15} depthWrite={false} />{' '}
            </mesh>
            <OrbitControls
              enableZoom
              enablePan={false}
              minDistance={introState === 'trunkGrowing' ? 1.5 : 4.0}
              maxDistance={38}
              minPolarAngle={Math.PI / 7.5}
              maxPolarAngle={Math.PI / 1.75}
              autoRotate={introState === 'idle'}
              autoRotateSpeed={0.035}
              enableDamping
              dampingFactor={0.02}
            />
            <EffectComposer multisampling={0} enableNormalPass={false}>
              <Bloom
                intensity={treeShineSpring.bloomIntensity.get()}
                luminanceThreshold={0.09}
                luminanceSmoothing={0.035}
                mipmapBlur
                kernelSize={KernelSize.VERY_LARGE}
                height={512}
              />
              <Vignette eskil={false} offset={0.1} darkness={0.78} />
              <FXAA />
            </EffectComposer>
          </Canvas>
          <div className='absolute bottom-8 sm:bottom-10 right-8 sm:right-10 z-20'>
            {' '}
            <Button
              onClick={handleSkipIntro}
              variant='outline'
              size='lg'
              disabled={isFadingOut || introState === 'exiting'}
              className={cn(
                `${PALETTE.buttonText} hover:${PALETTE.buttonHoverText} font-medium tracking-wider`,
                `bg-black/20 ${PALETTE.buttonHoverBg} backdrop-blur-lg`,
                `${PALETTE.buttonBorder} hover:${PALETTE.buttonHoverBorder}`,
                'px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group'
              )}
            >
              {' '}
              Vào Trang Chủ{' '}
              <Icons.arrowRight className='ml-3 h-[19px] w-[19px] sm:h-[21px] sm:w-[21px] transition-transform duration-300 group-hover:translate-x-2' />{' '}
            </Button>{' '}
          </div>
          <div className='absolute top-8 sm:top-10 left-8 sm:left-10 z-20'>
            {' '}
            <img
              src='/images/logo/3telogo.jpeg '
              alt='3TEduTech Logo'
              className='h-11 sm:h-12 opacity-90 hover:opacity-100 transition-opacity duration-300 filter drop-shadow-lg'
            />{' '}
          </div>
          {showSkipHint && introState === 'idle' && (
            <div className='absolute bottom-36 sm:bottom-40 right-8 sm:right-10 z-20 text-right'>
              {' '}
              <p
                className={`text-xs sm:text-sm ${PALETTE.skipHintText} opacity-75 animate-[pulse_3.5s_cubic-bezier(0.4,0,0.6,1)_infinite]`}
              >
                {' '}
                Click vào khối tinh thể để bắt đầu, <br className='sm:hidden' />{' '}
                hoặc vào trang chủ.{' '}
              </p>{' '}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default IntroPage;
