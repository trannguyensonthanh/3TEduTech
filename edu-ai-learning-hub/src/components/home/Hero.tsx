// src/components/home/Hero.tsx
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import { Button } from '@/components/ui/button';
import { Icons } from '../common/Icons'; // Đảm bảo có Icons.check, Icons.arrowRight
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { AbstractParticles } from '@/components/home/AbstractParticles'; // Component mới
import { motion } from 'framer-motion'; // Cho animation của text và button
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15 + 0.3, // Delay tăng dần cho từng element + delay tổng
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
        delay: 0.8, // Delay cho button sau text
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.5,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className='relative hero-gradient-enhanced text-gray-900 dark:text-gray-100 min-h-[85vh] md:min-h-[calc(100vh-80px)] flex items-center overflow-hidden'>
      <div className='absolute inset-0 z-0'>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <Suspense fallback={null}>
            <AbstractParticles
              count={150}
              color='#a7b3d6'
              size={0.08}
              speed={0.05}
            />
            <AbstractParticles
              count={100}
              color='#82aaff'
              size={0.1}
              speed={0.03}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center'>
          {/* Content bên trái */}
          <motion.div
            initial='hidden'
            animate='visible'
            className='text-center lg:text-left'
          >
            <motion.h1
              custom={0}
              variants={textVariants}
              className='text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight dark:text-white text-slate-800'
            >
              {t('hero.title1')}
              <br className='hidden md:block' />
              {t('hero.title2a')}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-teal-400 to-green-500'>
                {t('hero.title2b')}
              </span>
              {t('hero.title2c')}
            </motion.h1>

            <motion.p
              custom={1}
              variants={textVariants}
              className='text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 text-slate-600 dark:text-slate-300'
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
                className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold px-8 py-3 text-base shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105'
              >
                {t('hero.ctaExplore')}
                <Icons.arrowRight className='ml-2 h-5 w-5' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                onClick={() => navigate('/instructor/register')}
                className='border-slate-400 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/60 font-semibold px-8 py-3 text-base shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105'
              >
                {t('hero.ctaInstructor')}
              </Button>
            </motion.div>

            <motion.div
              custom={3}
              variants={textVariants}
              className='mt-10 space-y-3 text-sm text-slate-500 dark:text-slate-400'
            >
              <div className='flex items-center justify-center lg:justify-start'>
                <Icons.check className='h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0' />
                <span>{t('hero.bullet1')}</span>
              </div>
              <div className='flex items-center justify-center lg:justify-start'>
                <Icons.check className='h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0' />
                <span>{t('hero.bullet2')}</span>
              </div>
              <div className='flex items-center justify-center lg:justify-start'>
                <Icons.check className='h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0' />
                <span>{t('hero.bullet3')}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hình ảnh/Animation bên phải */}
          <motion.div
            variants={imageVariants}
            initial='hidden'
            animate='visible'
            className='relative hidden lg:flex justify-center items-center'
          >
            <div className='relative w-[450px] h-[450px] xl:w-[500px] xl:h-[500px]'>
              <div className='absolute inset-0 rounded-full bg-gradient-to-br from-teal-400/20 via-blue-500/20 to-purple-600/20 blur-3xl animate-pulse-slow'></div>
              <img
                src='https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                alt='AI Enhanced Learning Platform'
                className='relative z-10 w-full h-full object-contain rounded-2xl p-2'
              />
              <div className='absolute -bottom-8 -left-8 w-32 h-32 bg-green-400/30 rounded-full blur-2xl opacity-70 animate-pulse-slower'></div>
              <div className='absolute -top-8 -right-8 w-24 h-24 bg-purple-500/30 rounded-full blur-2xl opacity-70 animate-pulse-slow'></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
