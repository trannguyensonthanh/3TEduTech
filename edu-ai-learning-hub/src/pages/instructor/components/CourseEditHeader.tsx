// src/pages/instructor/components/CourseEditHeader.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { Course } from '@/services/course.service';
import { CourseStatusId } from '@/types/common.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CourseEditHeaderProps {
  course: Course;
  isDirty: boolean; // Có thay đổi chưa lưu hay không
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onSaveChanges: () => void;
  onSubmitForApproval: () => void;
  onCancelUpdate?: () => void; // Cho việc hủy bản cập nhật
  onDelete: () => void;
  isProcessingAction: boolean; // Cờ chung cho các hành động (submit, delete...)
}

const statusConfig = {
  [CourseStatusId.DRAFT]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800',
  },
  [CourseStatusId.PENDING]: {
    label: 'Pending Review',
    className: 'bg-yellow-100 text-yellow-800',
  },
  [CourseStatusId.UPDATING]: {
    label: 'Published (Updating)',
    className: 'bg-blue-100 text-blue-800',
  },
  [CourseStatusId.PUBLISHED]: {
    label: 'Published',
    className: 'bg-green-100 text-green-800',
  },
  [CourseStatusId.REJECTED]: {
    label: 'Needs Revision',
    className: 'bg-red-100 text-red-800',
  },
  [CourseStatusId.ARCHIVED]: {
    label: 'Archived',
    className: 'bg-gray-500 text-white',
  },
};

export const CourseEditHeader: React.FC<CourseEditHeaderProps> = ({
  course,
  isDirty,
  saveStatus,
  onSaveChanges,
  onSubmitForApproval,
  onCancelUpdate,
  onDelete,
  isProcessingAction,
}) => {
  const config = statusConfig[course.statusId] || statusConfig.DRAFT;
  const isUpdatingLiveCourse =
    course.statusId === 'DRAFT' && !!course.liveCourseId;

  const canSubmit = [CourseStatusId.DRAFT, CourseStatusId.REJECTED].includes(
    course.statusId as CourseStatusId
  );
  const canDelete = [CourseStatusId.DRAFT, CourseStatusId.REJECTED].includes(
    course.statusId as CourseStatusId
  );

  return (
    <div className='space-y-4'>
      <header className='flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {isUpdatingLiveCourse ? 'Editing Update for:' : 'Editing Course:'}
          </h1>
          <div className='flex items-center gap-3 mt-1'>
            <p
              className='text-muted-foreground text-lg truncate'
              title={course.courseName}
            >
              {course.courseName}
            </p>
            <Badge variant='outline' className={config.className}>
              {config.label}
            </Badge>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='text-xs text-muted-foreground w-28 text-right'>
            {saveStatus === 'saving' && (
              <span className='flex items-center justify-end gap-1.5'>
                <Icons.spinner className='h-4 w-4 animate-spin' />
                Saving...
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className='flex items-center justify-end gap-1.5'>
                <Button
                  variant='destructive'
                  size='sm'
                  className='ml-2'
                  onClick={onSaveChanges}
                  disabled={
                    isProcessingAction ||
                    course.statusId === CourseStatusId.PUBLISHED
                  }
                >
                  Save Changes
                </Button>
              </span>
            )}

            {saveStatus === 'saved' && (
              <span className='flex items-center justify-end gap-1.5 text-green-600'>
                <Icons.checkCircle className='h-4 w-4' />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className='flex items-center justify-end gap-1.5 text-destructive'>
                <Icons.alertTriangle className='h-4 w-4' />
                Error
              </span>
            )}
          </div>
          <Button asChild variant='outline' size='sm'>
            <Link to={`/courses/${course.slug}`} target='_blank'>
              Preview
            </Link>
          </Button>
          {canSubmit && (
            <Button
              type='button'
              size='sm'
              onClick={onSubmitForApproval}
              disabled={isProcessingAction || isDirty}
            >
              {isProcessingAction ? <Icons.spinner /> : <Icons.send />} Submit
              for Approval
            </Button>
          )}
        </div>
      </header>

      {isUpdatingLiveCourse && (
        <Alert
          variant='default'
          className='bg-blue-50 border-blue-200 text-blue-800'
        >
          <Icons.info className='h-4 w-4 !text-blue-600' />
          <AlertTitle>You're Editing a New Version</AlertTitle>
          <AlertDescription className='flex justify-between items-center'>
            Your changes will not affect the live course until they are
            approved.
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-blue-700 hover:text-blue-900'
              onClick={onCancelUpdate}
              disabled={isProcessingAction}
            >
              Cancel Update
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {course.statusId === 'REJECTED' && (
        <Alert variant='destructive'>
          <Icons.alertCircle className='h-4 w-4' />
          <AlertTitle>Course Needs Revision</AlertTitle>
          <AlertDescription>
            Please review the administrator's feedback, make the required
            changes, and resubmit for approval.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
