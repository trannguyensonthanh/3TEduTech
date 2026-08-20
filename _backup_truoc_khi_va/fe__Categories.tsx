// src/components/home/Categories.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { useCategories } from '@/hooks/queries/category.queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const getCategoryIcon = (iconIdentifier?: string | null) => {
  if (!iconIdentifier) return <Icons.help className='h-8 w-8' />;
  const iconName = iconIdentifier.toLowerCase();
  if (iconName.includes('programm') || iconName.includes('laptop'))
    return <Icons.laptop className='h-8 w-8' />;
  if (iconName.includes('business') || iconName.includes('briefcase'))
    return <Icons.business className='h-8 w-8' />;
  if (iconName.includes('data') || iconName.includes('database'))
    return <Icons.dataScience className='h-8 w-8' />;
  if (iconName.includes('design') || iconName.includes('palette'))
    return <Icons.design className='h-8 w-8' />;
  if (iconName.includes('market') || iconName.includes('megaphone'))
    return <Icons.marketing className='h-8 w-8' />;
  if (iconName.includes('lang') || iconName.includes('language'))
    return <Icons.language className='h-8 w-8' />;
  if (iconName.includes('person') || iconName.includes('user'))
    return <Icons.user className='h-8 w-8' />;
  if (iconName.includes('ai') || iconName.includes('brain'))
    return <Icons.ai className='h-8 w-8' />;
  if (iconIdentifier.startsWith('http'))
    return (
      <img
        src={iconIdentifier}
        alt='category icon'
        className='h-8 w-8 object-contain'
      />
    );
  return <Icons.help className='h-8 w-8' />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const categoryGradients = [
  'from-blue-500/20 to-cyan-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-violet-500/20 to-purple-500/20',
  'from-rose-500/20 to-pink-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-cyan-500/20 to-sky-500/20',
  'from-indigo-500/20 to-blue-500/20',
  'from-red-500/20 to-rose-500/20',
];

const categoryIconColors = [
  'text-blue-500 dark:text-blue-400',
  'text-emerald-500 dark:text-emerald-400',
  'text-violet-500 dark:text-violet-400',
  'text-rose-500 dark:text-rose-400',
  'text-amber-500 dark:text-amber-400',
  'text-cyan-500 dark:text-cyan-400',
  'text-indigo-500 dark:text-indigo-400',
  'text-red-500 dark:text-red-400',
];

const CategoriesSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    data: categoryData,
    isLoading,
    error,
  } = useCategories({ page: 1, limit: 8 });

  const categories = categoryData?.categories || [];

  return (
    <section className='relative py-16 md:py-24 overflow-hidden'>
      {/* Grid background pattern */}
      <div className='absolute inset-0 grid-bg-pattern opacity-40 pointer-events-none z-0' />
      
      {/* Gradient orbs */}
      <div className='absolute top-0 left-1/4 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none z-0' />
      <div className='absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[100px] pointer-events-none z-0' />

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='text-center mb-12 md:mb-16'
        >
          <h2 className='text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white tracking-tight'>
            {t('categories.title', 'Explore Top')}{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500'>
              {t('categories.titleHighlight', 'Categories')}
            </span>
          </h2>
          <p className='mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto'>
            {t(
              'categories.description',
              'Discover our most popular course categories and find the perfect fit for your learning goals.'
            )}
          </p>
        </motion.div>

        {isLoading && (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
          >
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className='bg-white dark:bg-slate-800/60 rounded-xl p-6 flex flex-col items-center text-center h-full border border-slate-200/60 dark:border-slate-700/50'
              >
                <Skeleton className='w-16 h-16 rounded-2xl mb-5' />
                <Skeleton className='h-6 w-3/4 mb-2' />
                <Skeleton className='h-4 w-1/2' />
              </motion.div>
            ))}
          </motion.div>
        )}

        {error && (
          <div className='text-center text-red-500 dark:text-red-400 py-10'>
            <Icons.warning className='h-12 w-12 mx-auto mb-4' />
            <p className='text-lg font-semibold'>
              {t('categories.errorTitle', 'Oops! Something went wrong.')}
            </p>
            <p>
              {t(
                'categories.errorDesc',
                "We couldn't load the categories right now. Please try again later."
              )}
            </p>
          </div>
        )}

        {!isLoading && !error && categories.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.15 }}
            className='grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6'
          >
            {categories.map((category, index) => (
              <motion.div key={category.categoryId} variants={itemVariants}>
                <Link
                  to={`/categories/${category.slug}`}
                  className='group premium-card gradient-border-card bg-white dark:bg-slate-800/60 rounded-xl p-6 flex flex-col items-center text-center h-full border border-slate-200/60 dark:border-slate-700/40 block'
                >
                  {/* Icon with gradient background */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-400 group-hover:scale-110 group-hover:shadow-lg bg-gradient-to-br ${
                      categoryGradients[index % categoryGradients.length]
                    } ${categoryIconColors[index % categoryIconColors.length]}`}
                  >
                    {getCategoryIcon(category.iconUrl || category.slug)}
                  </div>
                  <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300'>
                    {category.categoryName}
                  </h3>
                  {category.courseCount !== undefined && (
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      {t('categories.courseCount', {
                        count: category.courseCount,
                        defaultValue: '{{count}} courses',
                      })}
                    </p>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && !error && categories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-center text-slate-500 dark:text-slate-400 py-10'
          >
            <Icons.help className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p className='text-lg'>
              {t(
                'categories.noCategories',
                'No categories available at the moment.'
              )}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.5,
            delay: categories.length > 0 ? 0.5 : 0.2,
          }}
          className='mt-12 md:mt-16 text-center'
        >
          <Button
            variant='ghost'
            size='lg'
            onClick={() => navigate('/categories')}
            className='text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 group px-6 py-3'
          >
            {t('categories.viewAll', 'View All Categories')}
            <Icons.arrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CategoriesSection;
