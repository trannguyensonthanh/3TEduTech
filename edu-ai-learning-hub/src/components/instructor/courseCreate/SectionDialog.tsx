// src/components/instructor/courseCreate/SectionDialog.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  useCreateSection,
  useUpdateSection,
} from '@/hooks/queries/section.queries'; // Import hook mutation
import { courseKeys } from '@/hooks/queries/course.queries'; // Import key để invalidate
import { useQueryClient } from '@tanstack/react-query';
import { Section } from '@/services/section.service';

// Schema validation (giữ nguyên)
const sectionFormSchema = z.object({
  sectionName: z.string().trim().min(1, 'Section name is required').max(255),
  description: z.string().max(4000).optional().nullable(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

interface SectionDialogProps {
  open: boolean;
  onClose: () => void;
  // Bỏ onSave cũ, không cần trả dữ liệu lên state local nữa
  // onSave: (data: SectionFormData) => void;
  initialData?: Section | null; // Nhận toàn bộ Section object khi edit
  isEditing: boolean;
  courseId: number; // ** Cần courseId để gọi API **
}

const SectionDialog: React.FC<SectionDialogProps> = ({
  open,
  onClose,
  initialData,
  isEditing,
  courseId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: { sectionName: '', description: null },
    mode: 'onChange',
  });

  // --- Mutation Hooks ---
  const { mutateAsync: createSectionMutateAsync, isPending: isCreating } =
    useCreateSection();
  const { mutateAsync: updateSectionMutateAsync, isPending: isUpdating } =
    useUpdateSection();

  const isProcessing = isCreating || isUpdating;

  // Reset form khi mở dialog hoặc initialData thay đổi
  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        form.reset({
          sectionName: initialData.sectionName,
          description: initialData.description || null,
        });
      } else {
        form.reset({ sectionName: '', description: null });
      }
    }
  }, [open, isEditing, initialData, form]);

  // --- Submit Handler ---
  const handleDialogSubmit = async (data: SectionFormData) => {
    try {
      if (isEditing && initialData?.sectionId) {
        // --- Update Section ---
        await updateSectionMutateAsync(
          {
            courseId, // Truyền courseId
            sectionId: Number(initialData.sectionId), // Đảm bảo sectionId là number
            data: {
              sectionName: data.sectionName,
              description: data.description,
            },
          },
          {
            onSuccess: () => {
              toast({
                title: 'Success',
                description: 'Section updated successfully.',
              });

              queryClient.invalidateQueries({
                queryKey: ['courses', 'detail', 'slug'],
              });

              onClose();
            },
            onError: (error) => {
              toast({
                title: 'Error',
                description: `Failed to update section: ${error.message}`,
                variant: 'destructive',
              });
            },
          }
        );
      } else {
        // --- Create Section ---
        await createSectionMutateAsync(
          {
            courseId,
            data: {
              sectionName: data.sectionName,
              description: data.description,
            },
          },
          {
            onSuccess: () => {
              toast({
                title: 'Success',
                description: 'Section created successfully.',
              });
              // Invalidate query chi tiết khóa học để cập nhật UI
              queryClient.invalidateQueries({
                queryKey: courseKeys.detailById(courseId),
              });
              queryClient.invalidateQueries({
                queryKey: courseKeys.detailBySlug(undefined),
              });
              onClose(); // Đóng dialog sau khi thành công
            },
            onError: (error) => {
              toast({
                title: 'Error',
                description: `Failed to create section: ${error.message}`,
                variant: 'destructive',
              });
            },
          }
        );
      }
    } catch (error) {
      // Lỗi không mong muốn khác (ít xảy ra nếu onError được xử lý)
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Section' : 'Add New Section'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the section details.'
              : 'Enter name and optional description.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleDialogSubmit)}
            className='space-y-4 py-2'
          >
            <FormField
              control={form.control}
              name='sectionName'
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Section Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Introduction' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='What this section covers...'
                      {...field}
                      value={field.value ?? ''}
                      className='min-h-[80px]'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isProcessing || !form.formState.isValid}
              >
                {isProcessing ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : null}
                {isEditing ? 'Update Section' : 'Add Section'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SectionDialog;
