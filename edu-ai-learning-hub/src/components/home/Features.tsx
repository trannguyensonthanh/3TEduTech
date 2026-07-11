// src/components/home/Features.tsx
import { Icons } from '../common/Icons';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'; // Nếu cần nút CTA
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const FeaturesSection = () => {
  const { t } = useTranslation();
  const featureItems = [
    {
      icon: <Icons.ai className='h-10 w-10' />,
      title: t('features.aiTitle'),
      description: t('features.aiDesc'),
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: <Icons.expert className='h-10 w-10' />,
      title: t('features.expertTitle'),
      description: t('features.expertDesc'),
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: <Icons.learnAnywhere className='h-10 w-10' />,
      title: t('features.anywhereTitle'),
      description: t('features.anywhereDesc'),
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: <Icons.shieldCheck className='h-10 w-10' />,
      title: t('features.trustedTitle'),
      description: t('features.trustedDesc'),
      color: 'text-yellow-500 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      icon: <Icons.zap className='h-10 w-10' />,
      title: t('features.interactiveTitle'),
      description: t('features.interactiveDesc'),
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      icon: <Icons.palette className='h-10 w-10' />,
      title: t('features.creativeTitle'),
      description: t('features.creativeDesc'),
      color: 'text-pink-500 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    },
  ];

  const aiChatbotItems = [
    {
      icon: <Icons.checkCircle2 className='text-green-300' />,
      text: t(
        'features.ai24h',
        '<strong>24/7 Instant Help:</strong> Get unstuck anytime with immediate answers.'
      ),
    },
    {
      icon: <Icons.checkCircle2 className='text-green-300' />,
      text: t(
        'features.aiPersonalized',
        '<strong>Personalized Explanations:</strong> AI adapts to your understanding level.'
      ),
    },
    {
      icon: <Icons.checkCircle2 className='text-green-300' />,
      text: t(
        'features.aiPractice',
        '<strong>Interactive Practice:</strong> Reinforce learning with AI-generated examples.'
      ),
    },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const gridItemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <section className='py-16 md:py-24 bg-slate-100 dark:bg-slate-900'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          variants={sectionVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.3 }}
          className='text-center mb-12 md:mb-16'
        >
          <h2 className='text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
            {t('features.whyTitle', 'Why Learn with')}{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500'>
              3TEduTech
            </span>
            ?
          </h2>
          <p className='mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto'>
            {t('features.whyDesc')}
          </p>
        </motion.div>

        {/* Grid for general features */}
        <motion.div
          // variants={containerVariants} // Nếu muốn staggerChildren cho cả grid này
          // initial="hidden"
          // whileInView="visible"
          // viewport={{ once: true, amount: 0.1 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 md:mb-24'
        >
          {featureItems.map((item, index) => (
            <motion.div
              key={item.title as string}
              custom={index}
              variants={gridItemVariants}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}
              className='bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 flex flex-col items-center text-center transform hover:-translate-y-2'
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${item.bgColor} ${item.color} transition-all duration-300 group-hover:scale-110`}
              >
                {item.icon}
              </div>
              <h3 className='text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3'>
                {item.title}
              </h3>
              <p className='text-slate-600 dark:text-slate-400 text-sm leading-relaxed'>
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Dedicated section for AI Chatbot Feature */}
        <motion.div
          variants={sectionVariants} // Dùng lại sectionVariants hoặc tạo mới
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.2 }}
          className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-800 rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 text-white'
        >
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center'>
            <div className='text-center lg:text-left'>
              <Badge
                variant='secondary'
                className='mb-4 bg-white/20 text-white border-transparent backdrop-blur-sm'
              >
                <Icons.sparkles className='w-4 h-4 mr-2 text-yellow-300' />
                {t('features.aiBadge')}
              </Badge>
              <h2 className='text-3xl md:text-4xl font-bold mb-6 leading-tight'>
                {t('features.aiSectionTitle')}
              </h2>
              <p className='text-lg text-blue-100 dark:text-indigo-200 mb-8 opacity-90'>
                {t('features.aiSectionDesc')}
              </p>
              <ul className='space-y-4 mb-10'>
                {aiChatbotItems.map((item, idx) => (
                  <li key={idx} className='flex items-start'>
                    <div className='flex-shrink-0 w-6 h-6 mt-0.5'>
                      {item.icon}
                    </div>
                    <p
                      className='ml-3 text-blue-50 dark:text-indigo-100'
                      dangerouslySetInnerHTML={{ __html: item.text }}
                    />
                  </li>
                ))}
              </ul>
              <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
                <Button
                  asChild
                  size='lg'
                  className='bg-white text-blue-700 hover:bg-slate-100 font-semibold px-8 py-3 text-base shadow-lg hover:shadow-slate-400/30 transition-all duration-300 transform hover:scale-105'
                >
                  <Link to='/courses'>{t('features.ctaExplore')}</Link>
                </Button>
              </div>
            </div>

            {/* Placeholder for AI Chatbot Visual - Cần thay thế bằng hình ảnh/animation thực tế */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'circOut' }}
              className='relative h-80 md:h-96 lg:h-[450px] bg-slate-800/30 dark:bg-black/30 rounded-xl shadow-2xl p-4 md:p-6 flex items-center justify-center backdrop-blur-sm border border-white/10'
            >
              {/* Ý tưởng 1: Ảnh mock-up giao diện chatbot */}
              {/* <img src="/path-to-your-chatbot-mockup.png" alt="AI Chatbot Interface" className="max-h-full rounded-lg object-contain shadow-lg" /> */}

              {/* Ý tưởng 2: Icon lớn với hiệu ứng */}
              <Icons.chatbot className='w-32 h-32 md:w-48 md:h-48 text-teal-300 opacity-80 animate-pulse-slow' />

              {/* Ý tưởng 3: Một animation Lottie hoặc R3F đơn giản */}
              <div className='absolute -top-4 -left-4 w-16 h-16 bg-teal-400/50 rounded-full blur-xl animate-pulse'></div>
              <div className='absolute -bottom-4 -right-4 w-20 h-20 bg-purple-400/50 rounded-full blur-xl animate-pulse-slower'></div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection; // Đổi tên component
