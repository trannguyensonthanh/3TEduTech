import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '../common/Icons';
import CourseCard from '@/components/courses/CourseCard'; // Component CourseCard mới
import { useCourses } from '@/hooks/queries/course.queries'; // Hook lấy khóa học
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Các card sẽ xuất hiện lần lượt
      delayChildren: 0.2,
    },
  },
};

const FeaturedCoursesSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Lấy 4 khóa học nổi bật, sắp xếp theo rating giảm dần (ví dụ)
  const {
    data: coursesData,
    isLoading,
    error,
  } = useCourses({
    userPage: true, // Nếu bạn cần lấy khóa học của người dùng
    isFeatured: 1, // Hoặc một tiêu chí khác như sortBy: 'averageRating:desc'
    limit: 4, // Hiển thị 4 khóa học
    page: 1,
  });

  const featuredCourses = coursesData?.courses || [];

  console.log('Featured Courses:', coursesData);

  return (
    <section className='py-16 md:py-24 bg-background'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='flex flex-col sm:flex-row justify-between items-center mb-10 md:mb-12'
        >
          <div className='text-center sm:text-left mb-6 sm:mb-0'>
            <h2 className='text-3xl sm:text-4xl font-bold text-foreground tracking-tight'>
              {t('featured.title', 'Featured Courses')}
            </h2>
            <p className='mt-3 text-lg md:text-xl text-muted-foreground max-w-xl'>
              {t(
                'featured.description',
                'Handpicked courses to kickstart your learning journey with our top instructors.'
              )}
            </p>
          </div>
          <Button
            variant='outline'
            size='lg'
            onClick={() => navigate('/courses')}
            className='border-primary text-primary hover:bg-primary/5 hover:text-primary dark:border-primary/70 dark:text-primary/90 dark:hover:bg-primary/10 font-semibold group hidden sm:inline-flex'
          >
            {t('featured.viewAll', 'View All Courses')}
            <Icons.arrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
          </Button>
        </motion.div>

        {isLoading && (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8'
          >
            {[...Array(4)].map((_, index) => (
              <motion.div
                key={index}
                variants={containerVariants}
                className='rounded-xl overflow-hidden border bg-card'
              >
                <Skeleton className='w-full aspect-[16/9]' />
                <div className='p-4 space-y-3'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-4 w-10' />
                  </div>
                  <Skeleton className='h-6 w-1/3' />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {error && (
          <div className='text-center text-red-500 dark:text-red-400 py-10'>
            <Icons.warning className='h-12 w-12 mx-auto mb-4' />
            <p className='text-lg font-semibold'>
              {t('featured.errorTitle', 'Could not load featured courses.')}
            </p>
            <p>
              {t(
                'featured.errorDesc',
                'Please try refreshing the page or check back later.'
              )}
            </p>
          </div>
        )}

        {!isLoading && !error && featuredCourses.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.1 }} // Trigger khi 10% của list vào view
            className='grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-10'
          >
            {featuredCourses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </motion.div>
        )}

        {!isLoading && !error && featuredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-center text-muted-foreground py-10'
          >
            <Icons.help className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p className='text-lg'>
              {t(
                'featured.noCourses',
                'No featured courses available at this time.'
              )}
            </p>
          </motion.div>
        )}

        <div className='mt-12 md:mt-16 flex justify-center sm:hidden'>
          <Button
            size='lg'
            onClick={() => navigate('/courses')}
            className='bg-primary text-primary-foreground hover:bg-primary/90 font-semibold group'
          >
            {t('featured.viewAll', 'View All Courses')}
            <Icons.arrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoursesSection; // Đổi tên component
