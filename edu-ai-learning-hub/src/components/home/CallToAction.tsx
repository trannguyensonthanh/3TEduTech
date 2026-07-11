// src/components/home/CallToAction.tsx
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import { Icons } from '../common/Icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.42, 0, 0.58, 1] }, // Custom ease cho hiệu ứng "trồi lên" mượt
  },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    // Cho phép truyền delay
    opacity: 1,
    y: 0,
    transition: { delay: delay, duration: 0.6, ease: 'easeOut' },
  }),
};

const buttonGroupVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2, // Các button sẽ xuất hiện lần lượt
      delayChildren: 0.4, // Delay sau khi text đã xuất hiện
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
      viewport={{ once: true, amount: 0.3 }} // Trigger khi 30% section vào view
      className='cta-gradient text-white py-16 md:py-24 lg:py-32' // Sử dụng class CSS cho gradient
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto text-center'>
          <motion.h2
            custom={0.2} // Delay nhỏ cho tiêu đề
            variants={textItemVariants}
            className='text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight'
          >
            {t('cta.title', 'Ready to Start Your Learning Journey?')}
          </motion.h2>
          <motion.p
            custom={0.3} // Delay lớn hơn chút cho mô tả
            variants={textItemVariants}
            className='text-lg md:text-xl mb-10 opacity-90 leading-relaxed'
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
                size='default' // Kích thước lớn hơn cho nút chính
                onClick={() => navigate('/register')} // Điều hướng đến trang đăng ký
                className='bg-white text-blue-600 hover:bg-slate-100 font-semibold px-10 py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 w-full sm:w-auto'
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
                className='border-white text-white hover:bg-white/10 hover:text-white font-semibold px-10 py-4 text-base sm:text-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 w-full sm:w-auto'
              >
                {t('cta.browseCourses', 'Browse Courses')}
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            custom={0.8} // Delay lớn nhất cho dòng text nhỏ
            variants={textItemVariants}
            className='mt-8 text-sm opacity-70'
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

export default CallToActionSection; // Đổi tên component
