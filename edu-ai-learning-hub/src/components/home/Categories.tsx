// src/components/home/Categories.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { useCategories } from '@/hooks/queries/category.queries'; // Hook lấy categories từ API
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // Cho trạng thái loading
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Function để map tên icon từ API (hoặc slug) ra component Icon
// Bạn cần tùy chỉnh logic này dựa trên dữ liệu `iconUrl` hoặc `slug` từ API của bạn
const getCategoryIcon = (iconIdentifier?: string | null) => {
  if (!iconIdentifier) return <Icons.help className='h-8 w-8' />; // Default icon

  const iconName = iconIdentifier.toLowerCase();
  // Ví dụ map dựa trên slug hoặc tên icon từ API
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

  // Nếu iconUrl là một URL ảnh thực sự
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

// Animation variants cho Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Các item con sẽ xuất hiện lần lượt
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const CategoriesSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Lấy categories từ API, chỉ lấy trang đầu, giới hạn số lượng (ví dụ 8)
  const {
    data: categoryData,
    isLoading,
    error,
  } = useCategories(
    { page: 1, limit: 8 } // Lấy 8 categories cho trang chủ
  );

  const categories = categoryData?.categories || [];

  // Màu sắc cho icon background (có thể lấy từ API nếu có, hoặc define ở FE)
  const categoryColors = [
    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  ];

  return (
    <section className='py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='text-center mb-12 md:mb-16'
        >
          <h2 className='text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
            {t('categories.title', 'Explore Top Categories')}
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
                className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg flex flex-col items-center text-center h-full'
              >
                <Skeleton className='w-16 h-16 rounded-full mb-5' />
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
            viewport={{ once: true, amount: 0.2 }}
            className='grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6'
          >
            {categories.map((category, index) => (
              <motion.div key={category.categoryId} variants={itemVariants}>
                <Link
                  to={`/categories/${category.slug}`}
                  className='group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl dark:hover:shadow-slate-700/50 transition-all duration-300 flex flex-col items-center text-center h-full transform hover:-translate-y-1 border border-transparent hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-500'
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 ${
                      categoryColors[index % categoryColors.length]
                    }`}
                  >
                    {getCategoryIcon(category.iconUrl || category.slug)}
                  </div>
                  <h3 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
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

export default CategoriesSection; // Đổi tên component cho nhất quán
