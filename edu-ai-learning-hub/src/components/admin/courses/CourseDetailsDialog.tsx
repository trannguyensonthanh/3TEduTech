/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/courses/CourseDetailsDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { Separator } from '@/components/ui/separator';
import { Course } from '@/services/course.service';
import { useCourseDetailBySlug } from '@/hooks/queries/course.queries';
import { useSettings } from '@/contexts/SettingsContext';

interface CourseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseSlug: string | null;
  onViewLesson: (lesson: any, sectionTitle: string) => void;
}

const CourseDetailsDialog: React.FC<CourseDetailsDialogProps> = ({
  open,
  onOpenChange,
  courseSlug,
  onViewLesson,
}) => {
  const {
    data: course,
    isLoading,
    isError,
  } = useCourseDetailBySlug(courseSlug, { enabled: !!courseSlug && open });
  const { formatPrice } = useSettings();

  const renderContent = () => {
    if (isLoading)
      return (
        <div className='p-8 text-center'>
          <Icons.spinner className='h-8 w-8 animate-spin mx-auto' />
        </div>
      );
    if (isError || !course)
      return (
        <div className='p-8 text-center text-destructive'>
          Failed to load course details.
        </div>
      );
    console.log('Course Details:', course);
    return (
      <div className='space-y-4'>
        {/* Course Info */}
        <div className='flex flex-col sm:flex-row gap-6'>
          <img
            src={course.thumbnailUrl || undefined}
            alt={course.courseName}
            className='w-full sm:w-1/3 aspect-video object-cover rounded-lg bg-muted'
          />
          <div className='space-y-2'>
            <h2 className='text-2xl font-bold'>{course.courseName}</h2>
            <p className='text-sm text-muted-foreground'>
              by {course.instructorName}
            </p>
            <div className='flex flex-wrap gap-2 pt-2'>
              <Badge variant='outline'>{course.categoryName}</Badge>
              <Badge variant='secondary'>{course.levelName}</Badge>
              <Badge variant='success'>
                {formatPrice(course.pricing.base.originalPrice)}
              </Badge>
            </div>
          </div>
        </div>
        <Separator />
        {/* Curriculum */}
        <div>
          <h3 className='text-lg font-semibold mb-2'>Curriculum</h3>
          {course.sections && course.sections.length > 0 ? (
            course.sections.map((section) => (
              <div key={section.sectionId} className='mb-3 border-l-2 pl-4'>
                <h4 className='font-semibold'>{section.sectionName}</h4>
                <div className='mt-1 space-y-1'>
                  {section.lessons.map((lesson) => (
                    <div
                      key={lesson.lessonId}
                      className='flex items-center justify-between text-sm'
                    >
                      <span className='flex items-center gap-2'>
                        <Icons.playCircle className='h-4 w-4 text-muted-foreground' />
                        {lesson.lessonName}
                      </span>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          onViewLesson(lesson, section.sectionName)
                        }
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>
              No curriculum available.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Course Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className='max-h-[70vh] p-1 -mx-1'>
          <div className='px-4 py-2'>{renderContent()}</div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsDialog;
