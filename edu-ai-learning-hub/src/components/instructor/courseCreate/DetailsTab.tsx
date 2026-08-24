// src/components/instructor/courseCreate/DetailsTab.tsx
import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { TranslateButton } from '@/components/common/TranslateButton';

import { useGenerateCourseDescription } from '@/hooks/queries/course.queries';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AiDescriptionDialog } from './AiDescriptionDialog';

interface DetailsTabProps {
  courseId: number;
  courseLanguage?: 'vi' | 'en';
}

const DetailsTab: React.FC<DetailsTabProps> = ({ courseId }) => {
  const { control, watch, setValue } = useFormContext();
  const courseLanguage = watch('language');
  const [editorKeys, setEditorKeys] = useState({
    fullDescription: 1,
    requirements: 1,
    learningOutcomes: 1,
  });
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const { mutate: generateDescription, isPending: isGenerating } = useGenerateCourseDescription({
    onSuccess: (data) => {
      if (data.data?.course_description) {
        setValue('fullDescription', data.data.course_description, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setEditorKeys((prev) => ({ ...prev, fullDescription: prev.fullDescription + 1 }));
        toast.success('Đã sinh mô tả khóa học thành công!');
      } else {
        toast.error('AI không trả về mô tả hợp lệ.');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi sinh mô tả.');
    }
  });
  const TiptapFormField = ({ name, label, description }) => (
    <FormField
      control={control}
      name={name}
      render={() => (
        // Không cần fieldState ở đây
        <FormItem>
          <div className='flex items-center justify-between mb-2'>
            <FormLabel>{label}</FormLabel>
            <div className='flex items-center gap-2'>
              {name === 'fullDescription' && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setIsAiDialogOpen(true)}
                  disabled={isGenerating}
                  className='h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Tạo bằng AI
                </Button>
              )}
              <TranslateButton
              sourceText={watch(name)}
              sourceLang={courseLanguage as 'vi' | 'en'}
              onTranslated={(text) => {
                // Bước 1: Cập nhật giá trị trong form
                setValue(name, text, {
                  shouldValidate: true,
                  shouldDirty: true,
                });

                // *** SỬA LỖI: Bước 2: Thay đổi key để buộc Tiptap re-render ***
                setEditorKeys((prev) => ({ ...prev, [name]: prev[name] + 1 }));
              }}
            />
            </div>
          </div>
          <FormControl>
            <Controller
              name={name}
              control={control}
              render={({ field: controllerField }) => (
                <TiptapEditor
                  // *** SỬA LỖI: Bước 3: Truyền key vào TiptapEditor ***
                  key={editorKeys[name]}
                  initialContent={controllerField.value || ''}
                  onContentChange={(htmlContent) => {
                    const contentToSave =
                      htmlContent === '<p></p>' ? '' : htmlContent;
                    controllerField.onChange(contentToSave);
                  }}
                />
              )}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className='space-y-8'>
      <TiptapFormField
        name='fullDescription'
        label='Full Course Description'
        description='Provide a detailed description of your course. You can use rich text formatting.'
      />
      <TiptapFormField
        name='requirements'
        label='Requirements'
        description='List any prerequisites or required knowledge students need before taking this course.'
      />
      <TiptapFormField
        name='learningOutcomes'
        label="What You'll Learn"
        description='List key skills and knowledge students will gain from your course.'
      />

      <AiDescriptionDialog
        isOpen={isAiDialogOpen}
        onClose={() => setIsAiDialogOpen(false)}
        onGenerate={(hints) => {
          generateDescription({ courseId, hints });
          setIsAiDialogOpen(false);
        }}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default DetailsTab;
