// src/components/home/Categories.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { useCategories } from '@/hooks/queries/category.queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const getCategoryIcon = (iconIdentifier?: string | null) => {
  if (!iconIdentifier) return <Icons.help className='h-6 w-6' />;
  const iconName = iconIdentifier.toLowerCase();
  if (iconName.includes('programm') || iconName.includes('laptop'))
    return <Icons.laptop className='h-6 w-6' />;
  if (iconName.includes('business') || iconName.includes('briefcase'))
    return <Icons.business className='h-6 w-6' />;
  if (iconName.includes('data') || iconName.includes('database'))
    return <Icons.dataScience className='h-6 w-6' />;
  if (iconName.includes('design') || iconName.includes('palette'))
    return <Icons.design className='h-6 w-6' />;
  if (iconName.includes('market') || iconName.includes('megaphone'))
    return <Icons.marketing className='h-6 w-6' />;
  if (iconName.includes('lang') || iconName.includes('language'))
    return <Icons.language className='h-6 w-6' />;
  if (iconName.includes('person') || iconName.includes('user'))
    return <Icons.user className='h-6 w-6' />;
  if (iconName.includes('ai') || iconName.includes('brain'))
    return <Icons.ai className='h-6 w-6' />;
  if (iconIdentifier.startsWith('http'))
    return (
      <img
        src={iconIdentifier}
        alt=''
        className='h-6 w-6 object-contain'
      />
    );
  return <Icons.help className='h-6 w-6' />;
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

/**
 * Dải lĩnh vực khóa học.
 *
 * Bản trước phát cho mỗi thẻ một cặp màu chuyển sắc khác nhau, nên tám thẻ
 * cùng hàng hiện ra tám bảng màu và mắt không đọc được đâu là nhóm. Nay tám
 * thẻ cùng một kiểu, biểu tượng dùng chung một sắc độ của màu nhấn.
 */
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
    <section className='border-b border-border bg-muted/40 py-16 md:py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='mx-auto max-w-2xl text-center'
        >
          <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
            {t('categories.title', 'Khám phá các lĩnh vực hàng đầu')}
          </h2>
          <p className='mt-3 text-base text-muted-foreground md:text-lg'>
            {t(
              'categories.description',
              'Khám phá những lĩnh vực khóa học phổ biến nhất và tìm hướng đi phù hợp với mục tiêu học tập của bạn.'
            )}
          </p>
        </motion.div>

        {isLoading && (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          >
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className='flex h-full flex-col items-center rounded-xl border border-border bg-card p-6 text-center'
              >
                <Skeleton className='mb-4 h-12 w-12 rounded-lg' />
                <Skeleton className='mb-2 h-5 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </motion.div>
            ))}
          </motion.div>
        )}

        {error && (
          <div className='mt-12 text-center'>
            <Icons.warning
              className='mx-auto mb-3 h-10 w-10 text-danger'
              aria-hidden='true'
            />
            <p className='text-base font-medium text-danger'>
              {t('categories.errorTitle', 'Rất tiếc! Đã xảy ra lỗi.')}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t(
                'categories.errorDesc',
                'Hiện không thể tải danh mục. Vui lòng thử lại sau.'
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
            className='mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          >
            {categories.map((category) => (
              <motion.div key={category.categoryId} variants={itemVariants}>
                <Link
                  to={`/categories/${category.slug}`}
                  className='group flex h-full flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/40 hover:bg-accent'
                >
                  <span className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    {getCategoryIcon(category.iconUrl || category.slug)}
                  </span>
                  <h3 className='mb-1 text-base font-semibold transition-colors group-hover:text-primary'>
                    {category.categoryName}
                  </h3>
                  {category.courseCount !== undefined && (
                    <p className='text-sm text-muted-foreground'>
                      {t('categories.courseCount', {
                        count: category.courseCount,
                        defaultValue: '{{count}} khóa học',
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
            className='mt-12 text-center'
          >
            <Icons.help
              className='mx-auto mb-3 h-10 w-10 text-muted-foreground'
              aria-hidden='true'
            />
            <p className='text-sm text-muted-foreground'>
              {t('categories.noCategories', 'Hiện chưa có lĩnh vực nào.')}
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
          className='mt-12 text-center'
        >
          <Button
            variant='outline'
            size='lg'
            onClick={() => navigate('/categories')}
            className='group'
          >
            {t('categories.viewAll', 'Xem tất cả lĩnh vực')}
            <Icons.arrowRight
              className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5'
              aria-hidden='true'
            />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CategoriesSection;
