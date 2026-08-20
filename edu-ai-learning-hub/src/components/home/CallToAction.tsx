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
      className='border-y border-border bg-muted py-16 md:py-24 lg:py-32'
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto text-center'>
          <motion.h2
            custom={0.2}
            variants={textItemVariants}
            className='mb-6 text-3xl font-bold leading-tight text-foreground md:text-4xl'
          >
            {t('cta.title', 'Ready to Start Your Learning Journey?')}
          </motion.h2>
          <motion.p
            custom={0.3}
            variants={textItemVariants}
            className='mb-10 text-lg leading-relaxed text-muted-foreground'
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
                className='w-full px-10 py-4 text-base font-semibold sm:w-auto'
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
                className='w-full border-border px-10 py-4 text-base font-semibold sm:w-auto'
              >
                {t('cta.browseCourses', 'Browse Courses')}
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            custom={0.8}
            variants={textItemVariants}
            className='mt-8 text-sm text-muted-foreground'
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
