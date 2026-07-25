// src/components/home/Features.tsx
import { useState } from 'react';
import { Icons } from '../common/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const FeaturesSection = () => {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);

  const featureItems = [
    {
      icon: <Icons.ai className='h-5 w-5' />,
      title: t('features.aiTitle'),
      description: t('features.aiDesc'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      accentColor: 'bg-blue-500',
      preview: {
        stat: 'AI Score',
        value: '98%',
        badge: 'Smart',
        chartColor: 'text-blue-500',
      },
    },
    {
      icon: <Icons.expert className='h-5 w-5' />,
      title: t('features.expertTitle'),
      description: t('features.expertDesc'),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      accentColor: 'bg-emerald-500',
      preview: {
        stat: 'Expert Rating',
        value: '4.9★',
        badge: 'Top Rated',
        chartColor: 'text-emerald-500',
      },
    },
    {
      icon: <Icons.learnAnywhere className='h-5 w-5' />,
      title: t('features.anywhereTitle'),
      description: t('features.anywhereDesc'),
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      accentColor: 'bg-violet-500',
      preview: {
        stat: 'Devices',
        value: '3+',
        badge: 'Multi-Platform',
        chartColor: 'text-violet-500',
      },
    },
    {
      icon: <Icons.shieldCheck className='h-5 w-5' />,
      title: t('features.trustedTitle'),
      description: t('features.trustedDesc'),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      accentColor: 'bg-amber-500',
      preview: {
        stat: 'Trust Score',
        value: '100%',
        badge: 'Verified',
        chartColor: 'text-amber-500',
      },
    },
    {
      icon: <Icons.zap className='h-5 w-5' />,
      title: t('features.interactiveTitle'),
      description: t('features.interactiveDesc'),
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      accentColor: 'bg-rose-500',
      preview: {
        stat: 'Engagement',
        value: '95%',
        badge: 'Interactive',
        chartColor: 'text-rose-500',
      },
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

  return (
    <section className='relative py-16 md:py-24 overflow-hidden'>
      {/* Dark background with gradient */}
      <div className='absolute inset-0 bg-slate-100 dark:bg-[#0a0e1a] z-0' />
      <div className='absolute inset-0 grid-bg-pattern opacity-20 pointer-events-none z-0' />
      <div className='absolute top-0 left-1/4 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-600/8 blur-[100px] pointer-events-none z-0' />
      <div className='absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-600/8 blur-[100px] pointer-events-none z-0' />

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='text-center mb-12 md:mb-16'
        >
          <h2 className='text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white tracking-tight'>
            {t('features.whyTitle', 'Why Learn with')}{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400'>
              3TEduTech
            </span>
            ?
          </h2>
          <p className='mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto'>
            {t('features.whyDesc')}
          </p>
        </motion.div>

        {/* Interactive Feature Showcase — bms.im inspired */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='w-full max-w-5xl mx-auto rounded-2xl bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-12 shadow-xl dark:shadow-[0_24px_50px_rgba(0,0,0,0.4)] relative overflow-hidden mb-16 md:mb-24'
        >
          {/* Background glow */}
          <div className='absolute top-0 right-0 w-60 h-60 rounded-full bg-blue-500/3 dark:bg-blue-600/8 blur-[80px] pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-500/3 dark:bg-indigo-600/8 blur-[80px] pointer-events-none' />

          <div className='grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch relative z-10'>
            {/* Left — Feature List */}
            <div className='lg:col-span-5 flex flex-col'>
              <div className='mb-6'>
                <Badge className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15'>
                  <Icons.sparkles className='w-3.5 h-3.5 mr-1.5' />
                  {t('features.platformBadge', 'Platform Features')}
                </Badge>
              </div>

              <div className='space-y-1'>
                {featureItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full rounded-xl transition-all duration-300 text-left cursor-pointer ${
                      activeFeature === index
                        ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-4'
                        : 'border border-transparent px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <span
                          className={`p-1.5 rounded-lg transition-colors ${
                            activeFeature === index
                              ? `${item.bgColor} ${item.color}`
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span
                          className={`font-semibold text-sm sm:text-base transition-colors ${
                            activeFeature === index
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {activeFeature === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className='overflow-hidden'
                        >
                          <div className='pt-3 pl-9'>
                            <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3'>
                              {item.description}
                            </p>
                            <div
                              className={`h-0.5 w-10 ${item.accentColor} rounded-full`}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Feature Preview Card */}
            <div className='lg:col-span-7 flex items-center justify-center'>
              <div className='rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-2 shadow-lg w-full'>
                {/* Browser chrome */}
                <div className='flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 rounded-t-xl'>
                  <span className='w-2 h-2 rounded-full bg-rose-400/80' />
                  <span className='w-2 h-2 rounded-full bg-amber-400/80' />
                  <span className='w-2 h-2 rounded-full bg-emerald-400/80' />
                  <span className='text-[9px] text-slate-400 dark:text-slate-600 font-medium ml-2 font-mono'>
                    3tedutech_dashboard.tsx
                  </span>
                </div>

                {/* Preview content */}
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className='p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex flex-col justify-center bg-white dark:bg-slate-900 rounded-b-xl'
                  >
                    <div className='flex justify-between items-center mb-6'>
                      <span className='text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider'>
                        {featureItems[activeFeature].preview.stat}
                      </span>
                      <Badge className='text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'>
                        {featureItems[activeFeature].preview.badge}
                      </Badge>
                    </div>

                    <p className='text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6'>
                      {featureItems[activeFeature].preview.value}
                    </p>

                    {/* Mini chart */}
                    <svg
                      className={`w-full h-12 ${featureItems[activeFeature].preview.chartColor}`}
                      viewBox='0 0 200 50'
                      fill='none'
                    >
                      <path
                        d='M0,40 Q20,35 40,30 T80,15 T120,20 T160,8 T200,12'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        fill='none'
                      />
                      <path
                        d='M0,40 Q20,35 40,30 T80,15 T120,20 T160,8 T200,12 L200,50 L0,50 Z'
                        fill='currentColor'
                        opacity='0.05'
                      />
                    </svg>

                    <p className='text-sm text-slate-500 dark:text-slate-400 mt-4'>
                      {featureItems[activeFeature].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Chatbot Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-800 rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 text-white relative overflow-hidden'
        >
          {/* Animated background */}
          <div className='absolute inset-0 opacity-30'>
            <div className='absolute top-0 left-0 w-full h-full'>
              <div className='absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float' />
              <div className='absolute bottom-10 right-10 w-40 h-40 bg-white/3 rounded-full blur-3xl animate-float-delayed' />
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10'>
            <div className='text-center lg:text-left'>
              <Badge
                variant='secondary'
                className='mb-4 bg-white/15 text-white border-white/20 backdrop-blur-sm hover:bg-white/20'
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
                  className='bg-white text-blue-700 hover:bg-slate-100 font-semibold px-8 py-3 text-base shadow-lg hover:shadow-white/20 transition-all duration-300 transform hover:scale-[1.03]'
                >
                  <Link to='/courses'>{t('features.ctaExplore')}</Link>
                </Button>
              </div>
            </div>

            {/* AI Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'circOut' }}
              className='relative h-80 md:h-96 lg:h-[450px] glass rounded-xl shadow-2xl p-4 md:p-6 flex items-center justify-center'
            >
              <Icons.chatbot className='w-32 h-32 md:w-48 md:h-48 text-cyan-300 opacity-80 animate-pulse-slow' />
              <div className='absolute -top-4 -left-4 w-16 h-16 bg-cyan-400/30 rounded-full blur-xl animate-float' />
              <div className='absolute -bottom-4 -right-4 w-20 h-20 bg-purple-400/30 rounded-full blur-xl animate-float-delayed' />
              {/* Sparkle accents */}
              <svg viewBox="0 0 24 24" className="absolute top-6 right-6 w-4 h-4 text-yellow-300 animate-sparkle" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
