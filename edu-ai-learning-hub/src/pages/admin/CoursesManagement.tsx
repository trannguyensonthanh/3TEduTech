/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/CoursesManagement.tsx
import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';

// Custom Hooks & Components
import { useAdminCourseFilters } from '@/hooks/useAdminCourseFilters';
import AdminCourseFilters from '@/components/admin/courses/CourseFilters';
import AdminCoursesTable from '@/components/admin/courses/CoursesTable';
import CourseDetailsDialog from '@/components/admin/courses/CourseDetailsDialog';
import LessonDetailsDialog from '@/components/admin/courses/LessonDetailsDialog';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
import PaginationControls from '@/components/admin/PaginationControls';
import { useCourses, useDeleteCourse } from '@/hooks/queries/course.queries';
import { CourseListItem } from '@/services/course.service';

const CoursesManagement: React.FC = () => {
  const {
    queryParams,
    filters,
    updateFilter,
    clearFilters,
    setPage,
    currentPage,
  } = useAdminCourseFilters();

  const {
    data: coursesData,
    isLoading,
    isError,
    error,
  } = useCourses(queryParams);
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();

  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(
    null
  );
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(
    null
  );

  const handleViewDetails = (course: CourseListItem) => {
    setSelectedCourseSlug(course.slug);
  };

  const handleViewLesson = (lesson: any, sectionTitle: string) => {
    setSelectedLesson({ ...lesson, sectionTitle });
  };

  const handleDeleteRequest = (course: CourseListItem) => {
    setCourseToDelete(course);
  };

  const confirmDelete = () => {
    if (!courseToDelete) return;
    deleteCourse(courseToDelete.courseId, {
      onSuccess: () => {
        toast.success(
          `Course "${courseToDelete.courseName}" has been deleted.`
        );
        setCourseToDelete(null);
      },
      onError: (err) => {
        toast.error((err as Error).message || 'Failed to delete course.');
        setCourseToDelete(null);
      },
    });
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>Course Management</h1>

        <AdminCourseFilters
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
        />

        <AdminCoursesTable
          courses={coursesData?.courses}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onDelete={handleDeleteRequest}
        />

        {coursesData && coursesData.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={coursesData.totalPages}
            setCurrentPage={setPage}
          />
        )}
      </div>

      {/* Dialogs */}
      <CourseDetailsDialog
        open={!!selectedCourseSlug}
        onOpenChange={(open) => !open && setSelectedCourseSlug(null)}
        courseSlug={selectedCourseSlug}
        onViewLesson={handleViewLesson}
      />
      <LessonDetailsDialog
        open={!!selectedLesson}
        onOpenChange={(open) => !open && setSelectedLesson(null)}
        lesson={selectedLesson}
      />
      <ConfirmationDialog
        open={!!courseToDelete}
        onOpenChange={() => setCourseToDelete(null)}
        onConfirm={confirmDelete}
        isConfirming={isDeleting}
        title='Delete Course?'
        description={`Are you sure you want to permanently delete the course "${courseToDelete?.courseName}"? This action cannot be undone.`}
        confirmText='Delete'
        confirmVariant='destructive'
      />
    </AdminLayout>
  );
};

export default CoursesManagement;
