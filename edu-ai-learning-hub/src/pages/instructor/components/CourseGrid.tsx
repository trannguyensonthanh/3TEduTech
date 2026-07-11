// src/pages/instructor/components/CourseGrid.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CourseListItem } from '@/services/course.service';
import CourseCardv2 from '@/components/courses/CourseCardv2'; // Sử dụng lại card đã tối ưu
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseGridProps {
  courses?: CourseListItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  currentInstructorId: number | string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  isLoading,
  isError,
  error,
  currentInstructorId,
}) => {
  if (isLoading) {
    return (
      <motion.div
        className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`skel-${index}`}>
            <Skeleton className='aspect-[16/9] w-full rounded-lg' />
            <div className='mt-2 space-y-2'>
              <Skeleton className='h-4 w-1/3' />
              <Skeleton className='h-5 w-5/6' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center bg-destructive/10 rounded-lg'>
        <Icons.alertTriangle className='h-12 w-12 text-destructive mb-4' />
        <h3 className='text-xl font-semibold text-destructive'>
          Error Loading Courses
        </h3>
        <p className='text-muted-foreground mt-2 max-w-md'>
          {error?.message || 'Please try refreshing the page.'}
        </p>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center bg-card border rounded-lg'>
        <Icons.bookOpen className='h-12 w-12 text-muted-foreground mb-4' />
        <h3 className='text-xl font-semibold'>No Courses Found</h3>
        <p className='text-muted-foreground mt-2 max-w-md'>
          Try adjusting your filters or create your first course to get started.
        </p>
        <Button asChild className='mt-6'>
          <Link to='/instructor/courses/create'>
            <Icons.plus className='mr-2 h-4 w-4' /> Create First Course
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <AnimatePresence>
        {courses.map((course) => (
          <CourseCardv2
            key={course.courseId}
            course={course}
            currentInstructorId={currentInstructorId}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CourseGrid;
