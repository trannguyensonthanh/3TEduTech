// src/pages/instructor/InstructorCourses.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import PaginationControls from '@/components/admin/PaginationControls';
import { useInstructorCourseFilters } from '@/hooks/useCourseFilters';
import { useMyInstructorCourses } from '@/hooks/queries/course.queries';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/common/Icons';
import CourseFilterBar from './components/CourseFilterBar';
import CourseGrid from './components/CourseGrid';

const InstructorCourses: React.FC = () => {
  const { userData } = useAuth();
  const instructorId = userData ? parseInt(userData.id) : 0;

  const {
    currentPage,
    filters,
    queryParams,
    setPage,
    updateFilter,
    clearFilters,
  } = useInstructorCourseFilters(instructorId);

  const { data, isLoading, isError, error } = useMyInstructorCourses(
    queryParams,
    { enabled: !!instructorId } // Chỉ fetch khi đã có instructorId
  );

  console.log('InstructorCourses data:', data);

  const courses = data?.courses;
  const totalPages = data?.totalPages || 1;

  if (!instructorId) {
    // Trường hợp chưa load được user
    return (
      <InstructorLayout>
        <div className='flex items-center justify-center h-full'>
          <Icons.loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className='space-y-6 p-4 md:p-6 lg:p-8'>
        {/* Header Section */}
        <header className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>My Courses</h1>
            <p className='text-muted-foreground mt-1'>
              Manage, edit, and track the performance of all your courses.
            </p>
          </div>
          <Link to='/instructor/courses/create'>
            <Button className='w-full sm:w-auto'>
              <Icons.plus className='mr-2 h-4 w-4' />
              Create New Course
            </Button>
          </Link>
        </header>

        {/* Filter Bar Section */}
        <section className='bg-card border p-4 rounded-lg'>
          <CourseFilterBar
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
          />
        </section>

        {/* Main Content: Grid of Courses */}
        <main>
          <CourseGrid
            courses={courses}
            isLoading={isLoading}
            isError={isError}
            error={error}
            currentInstructorId={instructorId}
          />
        </main>

        {/* Pagination Section */}
        {totalPages > 1 && !isLoading && (
          <footer className='mt-8 flex justify-center'>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setPage}
            />
          </footer>
        )}
      </div>
    </InstructorLayout>
  );
};

export default InstructorCourses;
