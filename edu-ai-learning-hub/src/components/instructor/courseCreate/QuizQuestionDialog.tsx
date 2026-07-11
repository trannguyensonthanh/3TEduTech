// src/components/instructor/courseCreate/QuizQuestionDialog.tsx
import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Trash, Plus, Loader2 } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, useToast } from '@/hooks/use-toast';
import {
  useCreateQuizQuestion,
  useMockCreateQuizQuestion,
  useMockUpdateQuestion,
  useUpdateQuizQuestion,
} from '@/hooks/queries/lesson.queries'; // *** THAY THẾ BẰNG HOOK THỰC TẾ ***
import { useQueryClient } from '@tanstack/react-query';
import { courseKeys } from '@/hooks/queries/course.queries'; // Để invalidate course detail (hoặc lesson detail)
import { QuizQuestion } from '@/services/quiz.service';

// Zod Schemas (giữ nguyên)
const optionFormSchema = z.object({
  // Schema cho một option trong form
  tempId: z.union([z.string(), z.number()]).optional(),
  optionId: z.number().optional(), // ID gốc từ DB nếu có
  optionText: z.string().trim().min(1, 'Option text is required').max(500),
  isCorrectAnswer: z.boolean().default(false),
});

const questionFormSchema = z.object({
  // Schema cho toàn bộ form
  questionText: z.string().trim().min(1, 'Question text is required').max(4000),
  explanation: z.string().max(4000).optional().nullable(),
  options: z
    .array(optionFormSchema)
    .min(2, 'At least two options are required.')
    .refine(
      (options) => options.filter((opt) => opt.isCorrectAnswer).length === 1,
      { message: 'Exactly one correct answer must be selected.' }
    ),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface QuizQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  // Bỏ onSave cũ, không cần trả state lên cha
  // onSave: (data: QuestionFormData & { tempId?: string | number; id?: number; questionOrder?: number; }) => void;
  initialData: QuizQuestion | null;
  isEditing: boolean;
  lessonId: number; // ** Cần lessonId để gọi API **
  courseId: number; // ** Cần courseId để invalidate query **
}

const QuizQuestionDialog: React.FC<QuizQuestionDialogProps> = ({
  open,
  onClose,
  initialData,
  isEditing,
  lessonId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: '',
      explanation: null,
      options: [
        { optionText: '', isCorrectAnswer: false },
        { optionText: '', isCorrectAnswer: false },
      ],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
    keyName: 'fieldId', // Dùng fieldId làm key
  });

  const _useCreateQuizQuestion =
    useCreateQuizQuestion || useMockCreateQuizQuestion;
  const _useUpdateQuestion = useUpdateQuizQuestion || useMockUpdateQuestion; // Đảm bảo tên hook update là useUpdateQuestion

  // Gọi hook đã chọn
  const { mutateAsync: createQuestionMutateAsync, isPending: isCreating } =
    _useCreateQuizQuestion();
  const { mutateAsync: updateQuestionMutateAsync, isPending: isUpdating } =
    _useUpdateQuestion();
  const isProcessing = isCreating || isUpdating;

  // Reset form
  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        form.reset({
          questionText: initialData.questionText,
          explanation: initialData.explanation || null,
          options: initialData.options?.map((opt) => ({
            tempId:
              opt.tempId ||
              opt.optionId ||
              `option-${Date.now()}-${Math.random()}`, // Ưu tiên tempId FE, rồi ID DB
            optionId: Number(opt.optionId) || undefined, // ID gốc từ DB
            optionText: opt.optionText,
            isCorrectAnswer: opt.isCorrectAnswer || false,
          })) || [
            { optionText: '', isCorrectAnswer: false },
            { optionText: '', isCorrectAnswer: false },
          ],
        });
      } else {
        form.reset({
          questionText: '',
          explanation: null,
          options: [
            { optionText: '', isCorrectAnswer: false },
            { optionText: '', isCorrectAnswer: false },
          ],
        });
      }
    }
  }, [open, isEditing, initialData, form]);

  // --- Submit Handler ---
  const handleDialogSubmit = async (data: QuestionFormData) => {
    try {
      // Chuẩn bị payload cho API (có thể cần điều chỉnh dựa trên yêu cầu của API)
      const questionPayload = {
        questionText: data.questionText,
        explanation: data.explanation,
        // Map lại options, gán order và chỉ gửi các trường cần thiết
        questionOrder: initialData?.questionOrder || 0, // Nếu có questionOrder từ DB
        options: data.options.map((opt, index) => ({
          optionId: opt.optionId, // Gửi ID gốc nếu có (cho việc update option)
          optionText: opt.optionText,
          isCorrectAnswer: opt.isCorrectAnswer,
          optionOrder: index,
        })),
      };

      if (isEditing && initialData?.questionId) {
        // --- Update Question ---
        await updateQuestionMutateAsync(
          {
            questionId: Number(initialData.questionId),
            data: questionPayload,
          },
          {
            onSuccess: () => {
              toast({
                title: 'Success',
                description: 'Question updated successfully.',
              });
              // Invalidate query chi tiết khóa học
              console.log('Invalidate course detail query', lessonId);
              queryClient.invalidateQueries({
                queryKey: ['lessons', 'detail', lessonId],
              });
              onClose();
            },
            onError: (error) => {
              toast({
                title: 'Error',
                description: `Failed to update question: ${error.message}`,
                variant: 'destructive',
              });
            },
          }
        );
      } else {
        // --- Create Question ---
        // API create thường chỉ cần lessonId và data
        await createQuestionMutateAsync(
          {
            lessonId,
            data: questionPayload,
          },
          {
            onSuccess: () => {
              toast({
                title: 'Success',
                description: 'Question added successfully.',
              });
              // Invalidate query chi tiết khóa học

              queryClient.invalidateQueries({
                queryKey: ['lessons', 'detail', lessonId],
              });
              onClose();
            },
            onError: (error) => {
              toast({
                title: 'Error',
                description: `Failed to add question: ${error.message}`,
                variant: 'destructive',
              });
            },
          }
        );
      }
    } catch (error) {
      console.error('Error saving quiz question:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // Handler phụ (giữ nguyên)
  // Đảm bảo chỉ có 1 checkbox được check
  const handleCorrectChange = (index: number) => {
    const currentOptions = form.getValues('options');
    // Đặt isCorrectAnswer cho cái được click và bỏ check những cái khác
    currentOptions.forEach((opt, i) => {
      form.setValue(`options.${i}.isCorrectAnswer`, i === index, {
        shouldDirty: true,
      });
    });
    form.trigger('options'); // Trigger validation lại cho mảng options
  };

  const handleAddOption = () => {
    append({ optionText: '', isCorrectAnswer: false });
  };

  const handleRemoveOption = (index: number) => {
    if (fields.length <= 2) {
      toast({
        title: 'Cannot Remove',
        description: 'A question must have at least two options.',
        variant: 'destructive',
      });
      return;
    }
    remove(index);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
          {/* <DialogDescription>...</DialogDescription> */}
        </DialogHeader>
        <ScrollArea className='max-h-[calc(90vh-200px)] pr-6'>
          {' '}
          {/* Thêm ScrollArea */}
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                form.handleSubmit(handleDialogSubmit)(e);
              }}
              className='space-y-5 py-2 pr-2'
            >
              <FormField
                control={form.control}
                name='questionText'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter question...'
                        {...field}
                        className='min-h-[80px]'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='explanation'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Explain the correct answer...'
                        {...field}
                        value={field.value ?? ''}
                        className='min-h-[80px]'
                      />
                    </FormControl>
                    <FormDescription className='text-xs'>
                      Shown after attempt.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-3 border-t pt-4'>
                <Label className='font-medium'>Answer Options *</Label>
                <FormField
                  control={form.control}
                  name='options'
                  render={() => <FormMessage />}
                />
                {/* Lỗi chung của mảng */}
                {fields.map((fieldItem, index) => (
                  <div
                    key={fieldItem.fieldId}
                    className='flex items-center space-x-2'
                  >
                    <FormField
                      control={form.control}
                      name={`options.${index}.isCorrectAnswer`}
                      render={({ field: checkField }) => (
                        <FormItem className='flex items-center pt-6'>
                          <FormControl>
                            <Checkbox
                              checked={checkField.value}
                              onCheckedChange={() => handleCorrectChange(index)}
                              id={`correct-${fieldItem.fieldId}`}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`correct-${fieldItem.fieldId}`}
                            className='sr-only'
                          >
                            Correct
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.optionText`}
                      render={({ field: inputField }) => (
                        <FormItem className='flex-1'>
                          <FormLabel
                            htmlFor={`option-text-${fieldItem.fieldId}`}
                            className='sr-only'
                          >
                            Option {index + 1}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id={`option-text-${fieldItem.fieldId}`}
                              placeholder={`Option ${index + 1}`}
                              {...inputField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveOption(index)}
                      className='mt-6'
                      disabled={fields.length <= 2}
                    >
                      <Trash className='h-4 w-4 text-destructive' />
                    </Button>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAddOption}
                  className='mt-2'
                >
                  <Plus className='h-4 w-4 mr-1' /> Add Option
                </Button>
              </div>

              <DialogFooter className='pt-4'>
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
                  {isEditing ? 'Update Question' : 'Add Question'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default QuizQuestionDialog;
