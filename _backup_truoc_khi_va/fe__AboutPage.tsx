import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// --- Animation Variants ---
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.42, 0, 0.58, 1],
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// --- Data (quản lý qua i18n) ---

const AboutPage = () => {
  const { t } = useTranslation();

  const leadershipTeam = [
    {
      key: 'ceo',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&q=80&fm=jpg&crop=faces&fit=crop&w=200&h=200',
    },
    {
      key: 'cto',
      image:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&q=80&fm=jpg&crop=faces&fit=crop&w=200&h=200',
    },
    {
      key: 'cpo',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=faces&fit=crop&w=200&h=200',
    },
    {
      key: 'headOfLearning',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=faces&fit=crop&w=200&h=200',
    },
  ];

  const platformStats = [
    {
      icon: <Icons.users className='w-10 h-10' />,
      number: '5M+',
      labelKey: 'stats.learners',
      color: 'text-blue-500',
    },
    {
      icon: <Icons.courses className='w-10 h-10' />,
      number: '10K+',
      labelKey: 'stats.courses',
      color: 'text-green-500',
    },
    {
      icon: <Icons.instructors className='w-10 h-10' />,
      number: '2K+',
      labelKey: 'stats.instructors',
      color: 'text-purple-500',
    },
    {
      icon: <Icons.globe className='w-10 h-10' />,
      number: '150+',
      labelKey: 'stats.countries',
      color: 'text-red-500',
    },
  ];

  const coreValues = [
    {
      icon: (
        <Icons.users className='w-8 h-8 text-blue-600 dark:text-blue-400' />
      ),
      titleKey: 'values.learnerCentric',
      descKey: 'values.learnerCentricDesc',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: (
        <Icons.lightbulb className='w-8 h-8 text-yellow-500 dark:text-yellow-400' />
      ),
      titleKey: 'values.innovation',
      descKey: 'values.innovationDesc',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      icon: (
        <Icons.star className='w-8 h-8 text-green-500 dark:text-green-400' />
      ),
      titleKey: 'values.excellence',
      descKey: 'values.excellenceDesc',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: (
        <Icons.globe className='w-8 h-8 text-purple-500 dark:text-purple-400' />
      ),
      titleKey: 'values.accessibility',
      descKey: 'values.accessibilityDesc',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: (
        <Icons.heartHandshake className='w-8 h-8 text-red-500 dark:text-red-400' />
      ),
      titleKey: 'values.integrity',
      descKey: 'values.integrityDesc',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      icon: <Icons.ai className='w-8 h-8 text-teal-500 dark:text-teal-400' />,
      titleKey: 'values.empowerment',
      descKey: 'values.empowermentDesc',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white pt-20 pb-16 md:pt-32 md:pb-24 text-center overflow-hidden'
      >
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute -top-20 -left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl animate-pulse-slow'></div>
          <div className='absolute -bottom-20 -right-10 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl animate-pulse-slower animation-delay-2000'></div>
          <div className='absolute top-1/3 left-1/4 w-60 h-60 bg-teal-400 rounded-full filter blur-3xl animate-pulse-slow animation-delay-4000'></div>
        </div>
        <div className='container mx-auto px-4 relative z-10'>
          <motion.h1
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight'
          >
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-green-400'>
              {t('aboutPage.hero.title')}
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto'
          >
            {t('aboutPage.hero.subtitle')}
          </motion.p>
        </div>
      </motion.div>

      <div className='container mx-auto px-4 py-12 md:py-16'>
        <div className='max-w-6xl mx-auto'>
          {/* Our Story */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
            className='mb-16 md:mb-20'
          >
            <motion.h2
              variants={itemVariants}
              className='text-3xl md:text-4xl font-bold mb-8 text-slate-800 dark:text-slate-100 text-center md:text-left'
            >
              {t('aboutPage.story.title')}
            </motion.h2>
            <div className='prose prose-lg dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed'>
              <motion.p variants={itemVariants}>
                {t('aboutPage.story.p1')}
              </motion.p>
              <motion.p variants={itemVariants}>
                {t('aboutPage.story.p2')}
              </motion.p>
              <motion.p variants={itemVariants}>
                {t('aboutPage.story.p3')}
              </motion.p>
            </div>
          </motion.section>

          {/* Our Mission & Vision */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
            className='mb-16 md:mb-20 bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 rounded-2xl shadow-xl'
          >
            <div className='grid md:grid-cols-2 gap-8 md:gap-12 items-center'>
              <motion.div variants={itemVariants}>
                <div className='flex items-center text-blue-600 dark:text-blue-400 mb-3'>
                  <Icons.target className='w-8 h-8 mr-3' />
                  <h2 className='text-3xl font-bold text-slate-800 dark:text-slate-100'>
                    {t('aboutPage.mission.title')}
                  </h2>
                </div>
                <p className='text-lg text-slate-700 dark:text-slate-300 mb-4 leading-relaxed'>
                  {t('aboutPage.mission.description')}
                </p>
                <ul className='space-y-2 text-slate-600 dark:text-slate-300'>
                  {[...Array(4)].map((_, idx) => (
                    <li key={idx} className='flex items-start'>
                      <Icons.checkCircle className='h-5 w-5 text-green-500 dark:text-green-400 mr-2.5 mt-1 flex-shrink-0' />
                      <span>{t(`aboutPage.mission.item${idx + 1}`)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={itemVariants} className='mt-8 md:mt-0'>
                <div className='flex items-center text-purple-600 dark:text-purple-400 mb-3'>
                  <Icons.eye className='w-8 h-8 mr-3' />
                  <h2 className='text-3xl font-bold text-slate-800 dark:text-slate-100'>
                    {t('aboutPage.vision.title')}
                  </h2>
                </div>
                <p className='text-lg text-slate-700 dark:text-slate-300 leading-relaxed'>
                  {t('aboutPage.vision.description')}
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Our Core Values */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
            className='mb-16 md:mb-20'
          >
            <motion.h2
              variants={itemVariants}
              className='text-3xl md:text-4xl font-bold mb-10 md:mb-12 text-slate-800 dark:text-slate-100 text-center'
            >
              {t('aboutPage.values.title')}
            </motion.h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              {coreValues.map((value, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className='h-full text-center p-6 md:p-8 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl dark:hover:shadow-slate-700/60 transition-all duration-300 transform hover:-translate-y-1.5 border dark:border-slate-700'>
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${value.bgColor}`}
                    >
                      {value.icon}
                    </div>
                    <h3 className='text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3'>
                      {t(`aboutPage.${value.titleKey}`)}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
                      {t(`aboutPage.${value.descKey}`)}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Our Leadership Team */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.1 }}
            className='mb-16 md:mb-20'
          >
            <motion.h2
              variants={itemVariants}
              className='text-3xl md:text-4xl font-bold mb-10 md:mb-12 text-slate-800 dark:text-slate-100 text-center'
            >
              {t('aboutPage.leadership.title')}
            </motion.h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10'>
              {leadershipTeam.map((member, index) => {
                const name = t(`aboutPage.leadership.${member.key}.name`);
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className='flex flex-col items-center text-center group'
                  >
                    <Avatar className='w-32 h-32 md:w-36 md:h-36 mb-4 shadow-lg border-4 border-transparent group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-300'>
                      <AvatarImage src={member.image} alt={name} />
                      <AvatarFallback className='text-3xl bg-slate-200 dark:bg-slate-700'>
                        {name.substring(0, 1) + (name.split(' ')[1]?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100'>
                      {t(`aboutPage.leadership.${member.key}.name`)}
                    </h3>
                    <p className='text-sm text-blue-600 dark:text-blue-400 font-medium mb-1'>
                      {t(`aboutPage.leadership.${member.key}.title`)}
                    </p>
                    <p className='text-xs text-muted-foreground px-2'>
                      {t(`aboutPage.leadership.${member.key}.bio`)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Stats Section */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
            className='mb-16 md:mb-20 bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 rounded-2xl shadow-xl'
          >
            <motion.h2
              variants={itemVariants}
              className='text-3xl md:text-4xl font-bold mb-10 text-slate-800 dark:text-slate-100 text-center'
            >
              {t('aboutPage.stats.title')}
            </motion.h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8'>
              {platformStats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className='text-center p-4 bg-background dark:bg-slate-800 rounded-lg shadow-md'
                >
                  <div className={`mb-3 ${stat.color}`}>
                    {React.cloneElement(stat.icon, {
                      className: 'w-10 h-10 md:w-12 md:h-12 mx-auto',
                    })}
                  </div>
                  <div
                    className={`text-3xl md:text-4xl font-extrabold ${stat.color} mb-1`}
                  >
                    {stat.number}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {t(stat.labelKey)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Final CTA */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.3 }}
            className='text-center py-10 md:py-16 border-t dark:border-slate-700'
          >
            <motion.h2
              variants={itemVariants}
              className='text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6'
            >
              {t('aboutPage.cta.title')}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className='text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto'
            >
              {t('aboutPage.cta.description')}
            </motion.p>
            <motion.div
              variants={itemVariants}
              className='flex flex-col sm:flex-row gap-4 justify-center'
            >
              <Button
                size='lg'
                asChild
                className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105'
              >
                <Link to='/courses'>
                  {t('aboutPage.cta.explore')}{' '}
                  <Icons.arrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
              <Button
                size='lg'
                variant='outline'
                asChild
                className='border-foreground/30 text-foreground hover:bg-foreground/5 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/60 font-semibold shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105'
              >
                <Link to='/instructor/register'>
                  {t('aboutPage.cta.becomeInstructor')}
                </Link>
              </Button>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
