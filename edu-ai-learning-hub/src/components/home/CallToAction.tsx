// src/components/home/CallToAction.tsx
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.42, 0, 0.58, 1] },
  },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: 'easeOut' },
  }),
};

const buttonGroupVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.4,
    },
  },
};

const buttonItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const CallToActionSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.section
      variants={sectionVariants}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.3 }}
      className='cta-gradient text-white py-16 md:py-24 lg:py-32 relative overflow-hidden'
    >
      {/* Floating decorative elements */}
      <div className='absolute top-10 left-10 w-32 h-32 bg-white/3 rounded-full blur-3xl animate-float pointer-events-none' />
      <div className='absolute bottom-10 right-10 w-40 h-40 bg-white/2 rounded-full blur-3xl animate-float-delayed pointer-events-none' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none' />
      
      {/* Sparkle accents */}
      <svg viewBox="0 0 24 24" className="absolute top-16 right-[15%] w-5 h-5 text-white/20 animate-sparkle pointer-events-none" fill="currentColor">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
      </svg>
      <svg viewBox="0 0 24 24" className="absolute bottom-20 left-[10%] w-4 h-4 text-white/15 animate-sparkle pointer-events-none" style={{ animationDelay: '1.5s' }} fill="currentColor">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
      </svg>

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='max-w-3xl mx-auto text-center'>
          <motion.h2
            custom={0.2}
            variants={textItemVariants}
            className='text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight'
          >
            {t('cta.title', 'Ready to Start Your Learning Journey?')}
          </motion.h2>
          <motion.p
            custom={0.3}
            variants={textItemVariants}
            className='text-lg md:text-xl mb-10 opacity-85 leading-relaxed text-blue-100'
          >
            {t(
              'cta.description',
              'Join thousands of students who are already learning, growing, and achieving their goals with our AI-enhanced courses. Your future starts now.'
            )}
          </motion.p>

          <motion.div
            variants={buttonGroupVariants}
            className='flex flex-col sm:flex-row gap-4 justify-center'
          >
            <motion.div variants={buttonItemVariants}>
              <Button
                size='default'
                onClick={() => navigate('/register')}
                className='bg-white text-blue-700 hover:bg-blue-50 font-semibold px-10 py-4 text-base sm:text-lg shadow-xl shadow-black/20 hover:shadow-2xl transform transition-all duration-300 hover:scale-[1.03] w-full sm:w-auto'
              >
                {t('cta.getStarted', 'Get Started For Free')}
                <Icons.arrowRight className='ml-2 h-5 w-5' />
              </Button>
            </motion.div>
            <motion.div variants={buttonItemVariants}>
              <Button
                size='default'
                variant='outline'
                onClick={() => navigate('/courses')}
                className='bg-transparent border-white/50 text-white hover:bg-white hover:text-blue-700 dark:hover:text-blue-900 font-semibold px-10 py-4 text-base sm:text-lg shadow-md transform transition-all duration-300 hover:scale-[1.03] w-full sm:w-auto backdrop-blur-sm'
              >
                {t('cta.browseCourses', 'Browse Courses')}
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            custom={0.8}
            variants={textItemVariants}
            className='mt-8 text-sm opacity-60'
          >
            {t(
              'cta.noCreditCard',
              'No credit card required for free account. Start learning today!'
            )}
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
};

export default CallToActionSection;
