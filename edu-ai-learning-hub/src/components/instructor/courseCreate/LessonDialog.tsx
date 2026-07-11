/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/instructor/courseCreate/LessonDialog.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/common/Icons';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { TranslateButton } from '@/components/common/TranslateButton';

// Child Components
import { LessonVideoManager } from './LessonVideoManager';
import { LessonAttachmentsManager } from './LessonAttachmentsManager';
import { LessonSubtitlesManager } from './LessonSubtitlesManager';
import { LessonQuizManager } from './LessonQuizManager';

// Hooks, Services & Types
import {
  useCreateLesson,
  useUpdateLesson,
} from '@/hooks/queries/lesson.queries';
import { courseKeys } from '@/hooks/queries/course.queries';
import { Lesson } from '@/types/common.types';
import { extractYoutubeId, extractVimeoId } from '@/utils/video.util';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Zod Schema cho form chính (chỉ metadata)
const lessonMetadataSchema = z
  .object({
    lessonName: z.string().trim().min(1, 'Lesson name is required').max(255),
    description: z.string().max(4000).optional().nullable(),
    lessonType: z.enum(['VIDEO', 'TEXT', 'QUIZ']),
    isFreePreview: z.boolean().default(false),
    videoSourceType: z
      .enum(['CLOUDINARY', 'YOUTUBE', 'VIMEO'])
      .optional()
      .nullable(),
    externalVideoInput: z.string().trim().max(1000).optional().nullable(),
    textContent: z
      .string()
      .max(30000, 'Content is too long')
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      data.lessonType !== 'TEXT' ||
      (!!data.textContent && data.textContent.trim().length > 10),
    { message: 'Text content cannot be empty.', path: ['textContent'] }
  );

type LessonMetadataFormData = z.infer<typeof lessonMetadataSchema>;

interface LessonDialogProps {
  open: boolean;
  onClose: () => void;
  initialData: Lesson | null;
  isEditing: boolean;
  sectionId: number | string;
  courseId: number;
}

const LessonDialog: React.FC<LessonDialogProps> = ({
  open,
  onClose,
  initialData,
  isEditing,
  sectionId,
  courseId,
}) => {
  const queryClient = useQueryClient();
  const form = useForm<LessonMetadataFormData>({
    resolver: zodResolver(lessonMetadataSchema),
    defaultValues: {
      lessonName: '',
      description: '',
      lessonType: 'VIDEO',
      isFreePreview: false,
      videoSourceType: 'CLOUDINARY',
      externalVideoInput: '',
      textContent: '',
    },
    mode: 'onChange',
  });

  const { mutateAsync: createLesson, isPending: isCreating } =
    useCreateLesson();
  const { mutateAsync: updateLesson, isPending: isUpdating } =
    useUpdateLesson();
  const isProcessing = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        form.reset({
          lessonName: initialData.lessonName,
          description: initialData.description,
          lessonType: initialData.lessonType,
          isFreePreview: initialData.isFreePreview,
          videoSourceType: initialData.videoSourceType,
          textContent: initialData.textContent,
          externalVideoInput: initialData.externalVideoId, // ID sẽ được dùng để xây dựng lại URL nếu cần
        });
      } else {
        form.reset();
      }
    }
  }, [open, isEditing, initialData, form]);

  const handleFormSubmit = async (data: LessonMetadataFormData) => {
    let payload;
    console.log('Form data:', data);
    let externalVideoInput: string | null = null;
    if (data.lessonType === 'VIDEO') {
      if (data.videoSourceType === 'YOUTUBE') {
        externalVideoInput = extractYoutubeId(data.externalVideoInput || '');
      } else if (data.videoSourceType === 'VIMEO') {
        externalVideoInput = extractVimeoId(data.externalVideoInput || '');
      }
      data.textContent = null; // Không cần text content cho video lessons
    }

    payload = {
      lessonName: data.lessonName,
      description: data.description,
      lessonType: data.lessonType,
      isFreePreview: data.isFreePreview,
      videoSourceType:
        data.lessonType === 'VIDEO' ? data.videoSourceType : null,
      externalVideoInput: data.externalVideoInput || null,
      textContent: data.textContent || null,
    };
    // Remove fields not allowed for QUIZ type
    if (data.lessonType === 'QUIZ') {
      payload = {
        lessonName: data.lessonName,
        description: data.description,
        lessonType: data.lessonType,
        isFreePreview: data.isFreePreview,
        textContent: null,
      };
    }

    if (data.lessonType === 'TEXT') {
      payload = {
        lessonName: data.lessonName,
        description: data.description,
        lessonType: data.lessonType,
        isFreePreview: data.isFreePreview,
        textContent: data.textContent || null,
      };
    }

    const promise = isEditing
      ? updateLesson(
          {
            lessonId: Number(initialData!.lessonId as string | number),
            data: payload,
          },
          {
            onSuccess: (savedLesson) => {
              queryClient.invalidateQueries({
                queryKey: courseKeys.detailById(courseId),
              });
              onClose();
              toast.success(
                `Lesson "${savedLesson.lessonName}" updated successfully!`
              );
            },
            onError: (err: any) => {
              toast.error(err.message || 'Failed to update lesson.');
            },
          }
        )
      : createLesson(
          { courseId, sectionId: Number(sectionId), data: payload },
          {
            onSuccess: (savedLesson) => {
              queryClient.invalidateQueries({
                queryKey: courseKeys.detailById(courseId),
              });
              onClose();
              toast.success(
                `Lesson "${savedLesson.lessonName}" created successfully!`
              );
            },
            onError: (err: any) => {
              toast.error(err.message || 'Failed to create lesson.');
            },
          }
        );

    toast.promise(promise, {
      loading: 'Saving lesson...',
      success: (savedLesson) => {
        queryClient.invalidateQueries({
          queryKey: courseKeys.detailById(courseId),
        });
        onClose();
        return `Lesson "${savedLesson.lessonName}" saved successfully!`;
      },
      error: (err: any) => err.message || 'Failed to save lesson.',
    });
  };

  const lessonType = form.watch('lessonType');
  const lessonId = initialData?.lessonId
    ? Number(initialData.lessonId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-w-4xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <ScrollArea className='max-h-[calc(90vh-150px)] pr-6 overflow-auto'>
              <div className='space-y-6 p-1 '>
                {/* --- Basic Info Section --- */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='lessonName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., Introduction to React Hooks'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='lessonType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='VIDEO'>Video</SelectItem>
                              <SelectItem value='TEXT'>Text</SelectItem>
                              <SelectItem value='QUIZ'>Quiz</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='isFreePreview'
                      render={({ field }) => (
                        <FormItem className='flex items-center gap-2 pt-2'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className='!mt-0'>
                            Allow Free Preview
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* --- Content Section (Dynamic) --- */}
                {lessonType === 'VIDEO' && isEditing && lessonId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Video Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LessonVideoManager
                        lesson={initialData}
                        isEditing={isEditing}
                      />
                    </CardContent>
                  </Card>
                )}
                {lessonType === 'TEXT' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Text Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Controller
                        name='textContent'
                        control={form.control}
                        render={({ field }) => (
                          <TiptapEditor
                            initialContent={field.value || ''}
                            onContentChange={field.onChange}
                          />
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
                {lessonType === 'QUIZ' && isEditing && lessonId && (
                  <LessonQuizManager lessonId={lessonId} courseId={courseId} />
                )}

                {/* --- Additional Resources (chỉ hiển thị khi đã edit) --- */}
                {isEditing && lessonId && (
                  <>
                    <LessonAttachmentsManager
                      lessonId={lessonId}
                      initialAttachments={initialData?.attachments?.map(
                        (att) => ({
                          ...att,
                          lessonId: lessonId,
                        })
                      )}
                    />
                    {lessonType === 'VIDEO' && (
                      <LessonSubtitlesManager lessonId={lessonId} />
                    )}
                  </>
                )}

                {!isEditing && (
                  <div className='text-center text-muted-foreground p-4 border rounded-md bg-muted/50'>
                    <Icons.info className='mx-auto h-6 w-6 mb-2' />
                    <p>
                      Save this lesson to add video content, attachments, and
                      quizzes.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className='pt-6 border-t mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isProcessing}>
                {isProcessing && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isEditing ? 'Update Lesson' : 'Save and Continue'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonDialog;
