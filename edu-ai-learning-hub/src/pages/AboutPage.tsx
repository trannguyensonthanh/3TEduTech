// src/pages/AboutPage.tsx
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatCard from '@/components/common/StatCard';
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

/**
 * Trang giới thiệu.
 *
 * Bản trước mở đầu bằng một dải nền tối chuyển sắc kèm ba quầng sáng mờ, rồi
 * mỗi giá trị cốt lõi và mỗi con số lại mang một màu riêng. Nay trang chỉ dùng
 * nền nhạt để phân tách các dải, và một sắc độ duy nhất của màu nhấn.
 */
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

  /* Nhãn nằm trong nhánh `aboutPage.stats` của tệp dịch. Bản trước gọi
     t('stats.learners') nên không khớp khóa nào và hiện ra nguyên chuỗi khóa. */
  const platformStats = [
    { icon: Icons.users, number: '5M+', labelKey: 'aboutPage.stats.learners' },
    { icon: Icons.courses, number: '10K+', labelKey: 'aboutPage.stats.courses' },
    {
      icon: Icons.instructors,
      number: '2K+',
      labelKey: 'aboutPage.stats.instructors',
    },
    { icon: Icons.globe, number: '150+', labelKey: 'aboutPage.stats.countries' },
  ];

  const coreValues = [
    {
      icon: Icons.users,
      titleKey: 'values.learnerCentric',
      descKey: 'values.learnerCentricDesc',
    },
    {
      icon: Icons.lightbulb,
      titleKey: 'values.innovation',
      descKey: 'values.innovationDesc',
    },
    {
      icon: Icons.star,
      titleKey: 'values.excellence',
      descKey: 'values.excellenceDesc',
    },
    {
      icon: Icons.globe,
      titleKey: 'values.accessibility',
      descKey: 'values.accessibilityDesc',
    },
    {
      icon: Icons.heartHandshake,
      titleKey: 'values.integrity',
      descKey: 'values.integrityDesc',
    },
    {
      icon: Icons.ai,
      titleKey: 'values.empowerment',
      descKey: 'values.empowermentDesc',
    },
  ];

  return (
    <Layout>
      {/* Dải mở đầu */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='border-b border-border bg-muted/40'
      >
        <div className='container mx-auto px-4 py-16 text-center md:py-20'>
          <motion.h1
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='text-3xl font-semibold tracking-tight sm:text-4xl'
          >
            {t('aboutPage.hero.title')}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='mx-auto mt-4 max-w-3xl text-base text-muted-foreground md:text-lg'
          >
            {t('aboutPage.hero.subtitle')}
          </motion.p>
        </div>
      </motion.section>

      <div className='container mx-auto px-4 py-12 md:py-16'>
        <div className='mx-auto max-w-6xl space-y-16 md:space-y-20'>
          {/* Câu chuyện của chúng tôi */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2
              variants={itemVariants}
              className='text-2xl font-semibold tracking-tight sm:text-3xl'
            >
              {t('aboutPage.story.title')}
            </motion.h2>
            <div className='mt-6 space-y-4 text-base leading-relaxed text-muted-foreground'>
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

          {/* Sứ mệnh và tầm nhìn */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
            className='rounded-xl border border-border bg-muted/40 p-8 md:p-12'
          >
            <div className='grid items-start gap-8 md:grid-cols-2 md:gap-12'>
              <motion.div variants={itemVariants}>
                <div className='mb-3 flex items-center gap-3'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <Icons.target className='h-5 w-5' aria-hidden='true' />
                  </span>
                  <h2 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                    {t('aboutPage.mission.title')}
                  </h2>
                </div>
                <p className='text-base leading-relaxed text-muted-foreground'>
                  {t('aboutPage.mission.description')}
                </p>
                <ul className='mt-4 space-y-2 text-sm'>
                  {[...Array(4)].map((_, idx) => (
                    <li key={idx} className='flex items-start gap-2.5'>
                      <Icons.checkCircle
                        className='mt-0.5 h-4 w-4 shrink-0 text-primary'
                        aria-hidden='true'
                      />
                      <span className='text-muted-foreground'>
                        {t(`aboutPage.mission.item${idx + 1}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className='mb-3 flex items-center gap-3'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <Icons.eye className='h-5 w-5' aria-hidden='true' />
                  </span>
                  <h2 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                    {t('aboutPage.vision.title')}
                  </h2>
                </div>
                <p className='text-base leading-relaxed text-muted-foreground'>
                  {t('aboutPage.vision.description')}
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Giá trị cốt lõi */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2
              variants={itemVariants}
              className='text-center text-2xl font-semibold tracking-tight sm:text-3xl'
            >
              {t('aboutPage.values.title')}
            </motion.h2>
            <div className='mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
              {coreValues.map((value) => {
                const ValueIcon = value.icon;
                return (
                  <motion.div key={value.titleKey} variants={itemVariants}>
                    <div className='h-full rounded-xl border border-border bg-card p-6 text-center'>
                      <span className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        <ValueIcon className='h-6 w-6' aria-hidden='true' />
                      </span>
                      <h3 className='mb-2 text-base font-semibold'>
                        {t(`aboutPage.${value.titleKey}`)}
                      </h3>
                      <p className='text-sm leading-relaxed text-muted-foreground'>
                        {t(`aboutPage.${value.descKey}`)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Ban lãnh đạo */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.h2
              variants={itemVariants}
              className='text-center text-2xl font-semibold tracking-tight sm:text-3xl'
            >
              {t('aboutPage.leadership.title')}
            </motion.h2>
            <div className='mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4'>
              {leadershipTeam.map((member) => {
                const name = t(`aboutPage.leadership.${member.key}.name`);
                return (
                  <motion.div
                    key={member.key}
                    variants={itemVariants}
                    className='flex flex-col items-center text-center'
                  >
                    <Avatar className='mb-4 h-28 w-28 border border-border'>
                      <AvatarImage src={member.image} alt={name} />
                      <AvatarFallback className='bg-muted text-xl text-muted-foreground'>
                        {name.substring(0, 1) + (name.split(' ')[1]?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className='text-base font-semibold'>{name}</h3>
                    <p className='mt-0.5 text-sm font-medium text-primary'>
                      {t(`aboutPage.leadership.${member.key}.title`)}
                    </p>
                    <p className='mt-1 px-2 text-xs text-muted-foreground'>
                      {t(`aboutPage.leadership.${member.key}.bio`)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Số liệu nền tảng */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2
              variants={itemVariants}
              className='text-center text-2xl font-semibold tracking-tight sm:text-3xl'
            >
              {t('aboutPage.stats.title')}
            </motion.h2>
            <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {platformStats.map((stat) => (
                <motion.div key={stat.labelKey} variants={itemVariants}>
                  <StatCard
                    label={t(stat.labelKey)}
                    value={stat.number}
                    icon={stat.icon}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Lời mời cuối trang */}
          <motion.section
            variants={sectionVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.3 }}
            className='border-t border-border pt-12 text-center md:pt-16'
          >
            <motion.h2
              variants={itemVariants}
              className='text-2xl font-semibold tracking-tight sm:text-3xl'
            >
              {t('aboutPage.cta.title')}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className='mx-auto mt-3 max-w-2xl text-base text-muted-foreground'
            >
              {t('aboutPage.cta.description')}
            </motion.p>
            <motion.div
              variants={itemVariants}
              className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'
            >
              <Button size='lg' asChild>
                <Link to='/courses'>
                  {t('aboutPage.cta.explore')}
                  <Icons.arrowRight
                    className='ml-2 h-4 w-4'
                    aria-hidden='true'
                  />
                </Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
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
