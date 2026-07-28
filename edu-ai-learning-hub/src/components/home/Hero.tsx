// src/components/home/Hero.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '../common/Icons';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { AbstractParticles } from '@/components/home/AbstractParticles';
import HeroVeins from '@/components/home/HeroVeins';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import WebGLErrorBoundary from '@/components/common/WebGLErrorBoundary';

const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15 + 0.3,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.8,
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.2,
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const statCounterVariants = {
    hidden: { scale: 0 },
    visible: (i: number) => ({
      scale: 1,
      transition: {
        delay: 1.4 + i * 0.15,
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
      },
    }),
  };

  return (
    <div className='relative hero-gradient-enhanced text-gray-100 min-h-[90vh] md:min-h-[calc(100vh-64px)] flex items-center overflow-hidden'>
      {/* Animated Wire/Vein Background */}
      <HeroVeins />

      {/* Three.js Particle System wrapped in WebGL Error Boundary */}
      <div className='absolute inset-0 z-[2]'>
        <WebGLErrorBoundary>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            gl={{ powerPreference: 'default', failIfMajorPerformanceCaveat: false }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
            }}
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <Suspense fallback={null}>
              <AbstractParticles
                count={200}
                color='#60a5fa'
                size={0.06}
                speed={0.04}
              />
              <AbstractParticles
                count={120}
                color='#818cf8'
                size={0.09}
                speed={0.025}
              />
            </Suspense>
          </Canvas>
        </WebGLErrorBoundary>
      </div>

      {/* Content */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-[15]'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-8 items-center'>
          {/* Left Content */}
          <motion.div
            initial='hidden'
            animate='visible'
            className='text-center lg:text-left lg:col-span-7'
          >
            <motion.h1
              custom={0}
              variants={textVariants}
              className='text-4xl sm:text-5xl lg:text-5xl xl:text-[3.5rem] font-extrabold mb-6 leading-[1.15] text-white'
            >
              {t('hero.title1')}
              <br className='hidden md:block' />
              {t('hero.title2a')}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400'>
                {t('hero.title2b')}
              </span>
              {t('hero.title2c')}
            </motion.h1>

            <motion.p
              custom={1}
              variants={textVariants}
              className='text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 text-slate-300/90'
            >
              {t('hero.desc')}
            </motion.p>

            <motion.div
              custom={2}
              variants={buttonVariants}
              className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'
            >
              <Button
                size='lg'
                onClick={() => navigate('/courses')}
                className='bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.03] border-0'
              >
                {t('hero.ctaExplore')}
                <Icons.arrowRight className='ml-2 h-5 w-5' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                onClick={() => navigate('/instructor/register')}
                className='bg-transparent border-slate-500/50 text-white hover:bg-white hover:text-slate-900 font-semibold px-8 py-3.5 text-base transition-all duration-300 transform hover:scale-[1.03] backdrop-blur-sm'
              >
                {t('hero.ctaInstructor')}
              </Button>
            </motion.div>

            <motion.div
              custom={3}
              variants={textVariants}
              className='mt-10 space-y-3 text-sm text-slate-400'
            >
              {['hero.bullet1', 'hero.bullet2', 'hero.bullet3'].map((key, i) => (
                <div key={i} className='flex items-center justify-center lg:justify-start'>
                  <div className='w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mr-3 flex-shrink-0'>
                    <Icons.check className='h-3 w-3 text-white' />
                  </div>
                  <span className='text-slate-300'>{t(key)}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Decorative Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            className='relative hidden lg:flex justify-center items-center lg:col-span-5'
          >
            <div className='relative w-[450px] h-[450px] xl:w-[500px] xl:h-[500px]'>
              <div className='absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/15 via-indigo-500/15 to-cyan-500/15 blur-3xl animate-pulse-slow' />
              <img
                src='https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                alt='AI Enhanced Learning Platform'
                className='relative z-10 w-full h-full object-contain rounded-2xl p-2'
              />
              {/* Floating decorative elements */}
              <div className='absolute -bottom-6 -left-6 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl animate-float' />
              <div className='absolute -top-6 -right-6 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl animate-float-delayed' />
              {/* Sparkle */}
              <svg viewBox="0 0 24 24" className="absolute top-8 right-0 w-5 h-5 text-cyan-400 animate-sparkle" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          variants={statsVariants}
          initial='hidden'
          animate='visible'
          className='mt-16 lg:mt-20 grid grid-cols-3 gap-8 max-w-3xl'
        >
          {[
            { value: '500+', label: t('hero.statCourses', 'Courses Available') },
            { value: '10K+', label: t('hero.statStudents', 'Active Students') },
            { value: '4.8', label: t('hero.statRating', 'Average Rating') },
          ].map((stat, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={statCounterVariants}
              className='text-center'
            >
              <p className='text-3xl sm:text-4xl font-bold text-blue-400 mb-1'>
                {stat.value}
              </p>
              <p className='text-xs sm:text-sm text-slate-400/80'>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 pointer-events-none z-20'>
        <div className='w-5 h-8 border border-slate-500/60 rounded-full flex justify-center pt-1.5'>
          <div className='w-1 h-2 bg-blue-400 rounded-full scroll-indicator-dot' />
        </div>
        <span className='text-[9px] font-mono text-slate-500 uppercase tracking-widest'>
          scroll
        </span>
      </div>
    </div>
  );
};

export default Hero;
