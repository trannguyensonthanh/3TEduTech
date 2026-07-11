// src/components/instructor/courseCreate/CurriculumTab.tsx
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { Section } from '@/services/section.service';
import { Lesson } from '@/types/common.types';
import SectionDialog from './SectionDialog';
import LessonDialog from './LessonDialog';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
import { toast } from 'sonner';
import { useDeleteSection } from '@/hooks/queries/section.queries';
import { useDeleteLesson } from '@/hooks/queries/lesson.queries';
import { courseKeys } from '@/hooks/queries/course.queries';
import { formatDurationShort } from '@/utils/formatter.util';

interface CurriculumTabProps {
  courseId: number;
  initialSections: Section[];
}

const CurriculumTab: React.FC<CurriculumTabProps> = ({
  courseId,
  initialSections,
}) => {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<Section[]>(initialSections);

  // Update local state when initial data changes (e.g., after a refetch)
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Dialog states
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentSectionIdForLesson, setCurrentSectionIdForLesson] = useState<
    number | string | null
  >(null);

  // Confirmation dialog states
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'section' | 'lesson';
    sectionId: number | string;
    itemId: number | string;
    name: string;
  } | null>(null);

  const { mutate: deleteSection, isPending: isDeletingSection } =
    useDeleteSection();
  const { mutate: deleteLesson, isPending: isDeletingLesson } =
    useDeleteLesson();
  const isProcessingDelete = isDeletingSection || isDeletingLesson;

  // Handlers for opening dialogs
  const handleAddSection = () => {
    setEditingSection(null);
    setIsSectionDialogOpen(true);
  };
  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setIsSectionDialogOpen(true);
  };
  const handleAddLesson = (sectionId: number | string) => {
    setCurrentSectionIdForLesson(sectionId);
    setEditingLesson(null);
    setIsLessonDialogOpen(true);
  };
  const handleEditLesson = (sectionId: number | string, lesson: Lesson) => {
    setCurrentSectionIdForLesson(sectionId);
    setEditingLesson(lesson);
    setIsLessonDialogOpen(true);
  };

  const handleDeleteRequest = (
    type: 'section' | 'lesson',
    sectionId: number | string,
    itemId: number | string,
    name: string
  ) => {
    setItemToDelete({ type, sectionId, itemId, name });
  };

  const confirmDeletion = () => {
    if (!itemToDelete) return;

    const { type, itemId, sectionId } = itemToDelete;

    if (type === 'section') {
      deleteSection(
        { courseId, sectionId: Number(itemId) },
        {
          onSuccess: () => {
            toast.success('Section and its lessons deleted.');
            queryClient.removeQueries({
              queryKey: courseKeys.detailById(courseId),
            });
          },
          onError: (err) =>
            toast.error((err as Error).message || 'Failed to delete section.'),
          onSettled: () => setItemToDelete(null),
        }
      );
    } else if (type === 'lesson') {
      deleteLesson(
        { courseId, lessonId: Number(itemId) },
        {
          onSuccess: () => {
            toast.success('Lesson deleted.');
            queryClient.invalidateQueries({
              queryKey: courseKeys.detailById(courseId),
            });
          },
          onError: (err) =>
            toast.error((err as Error).message || 'Failed to delete lesson.'),
          onSettled: () => setItemToDelete(null),
        }
      );
    }
  };

  return (
    <div className='space-y-4'>
      {/* ... (Your tips/info box can go here) ... */}
      <div className='space-y-4'>
        {sections.length > 0 ? (
          sections
            .sort((a, b) => a.sectionOrder - b.sectionOrder)
            .map((section, index) => (
              <Card
                key={section.sectionId || section.tempId}
                className='overflow-hidden'
              >
                <CardHeader className='bg-muted/50 p-3 flex flex-row justify-between items-center border-b'>
                  <div className='flex items-center gap-3'>
                    <Icons.layers className='h-5 w-5 text-muted-foreground' />
                    <CardTitle
                      className='text-base font-semibold truncate'
                      title={section.sectionName}
                    >
                      {`Section ${index + 1}: ${section.sectionName}`}
                    </CardTitle>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleEditSection(section)}
                    >
                      <Icons.edit className='h-4 w-4 mr-1' />
                      Edit
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='text-destructive hover:text-destructive'
                      onClick={() =>
                        handleDeleteRequest(
                          'section',
                          section.sectionId!,
                          section.sectionId!,
                          section.sectionName
                        )
                      }
                    >
                      <Icons.trash className='h-4 w-4 mr-1' />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='p-0'>
                  <div className='divide-y'>
                    {section.lessons && section.lessons.length > 0 ? (
                      section.lessons
                        .sort((a, b) => a.lessonOrder - b.lessonOrder)
                        .map((lesson, lessonIndex) => (
                          <div
                            key={lesson.lessonId || lesson.tempId}
                            className='p-3 flex items-center justify-between hover:bg-muted/50'
                          >
                            <div className='flex items-center gap-3'>
                              <Icons.playCircle className='h-4 w-4 text-muted-foreground' />
                              <div className='text-sm'>
                                <p className='font-medium'>{`Lesson ${lessonIndex + 1}: ${lesson.lessonName}`}</p>
                                <p className='text-xs text-muted-foreground'>
                                  {lesson.lessonType} •{' '}
                                  {formatDurationShort(
                                    lesson.videoDurationSeconds || 0
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7'
                                onClick={() =>
                                  handleEditLesson(section.sectionId!, lesson)
                                }
                              >
                                <Icons.edit className='h-4 w-4' />
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7'
                                onClick={() =>
                                  handleDeleteRequest(
                                    'lesson',
                                    section.sectionId!,
                                    lesson.lessonId!,
                                    lesson.lessonName
                                  )
                                }
                              >
                                <Icons.trash className='h-4 w-4 text-destructive' />
                              </Button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className='p-4 text-center text-sm text-muted-foreground'>
                        No lessons in this section.
                      </p>
                    )}
                  </div>
                  <div className='p-3 border-t'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full'
                      size='sm'
                      onClick={() => handleAddLesson(section.sectionId!)}
                    >
                      <Icons.plus className='h-4 w-4 mr-2' />
                      Add Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
          <div className='text-center py-10 border border-dashed rounded-lg'>
            <Icons.layers className='mx-auto h-12 w-12 text-muted-foreground mb-3' />
            <h3 className='text-lg font-medium'>Your curriculum is empty</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Start by adding your first section.
            </p>
          </div>
        )}
        <Button type='button' className='w-full' onClick={handleAddSection}>
          <Icons.plus className='h-4 w-4 mr-2' />
          Add New Section
        </Button>
      </div>

      {/* Dialogs */}
      {isSectionDialogOpen && (
        <SectionDialog
          open={isSectionDialogOpen}
          onClose={() => setIsSectionDialogOpen(false)}
          initialData={editingSection}
          isEditing={!!editingSection}
          courseId={courseId}
        />
      )}
      {isLessonDialogOpen && (
        <LessonDialog
          open={isLessonDialogOpen}
          onClose={() => setIsLessonDialogOpen(false)}
          initialData={editingLesson}
          isEditing={!!editingLesson}
          sectionId={currentSectionIdForLesson!}
          courseId={courseId}
        />
      )}
      <ConfirmationDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
        onConfirm={confirmDeletion}
        isConfirming={isProcessingDelete}
        title={`Delete ${itemToDelete?.type}?`}
        description={`Are you sure you want to delete the ${itemToDelete?.type} "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmVariant='destructive'
      />
    </div>
  );
};
export default CurriculumTab;
