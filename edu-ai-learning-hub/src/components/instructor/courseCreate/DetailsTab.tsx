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

interface DetailsTabProps {
  // Không cần truyền form nữa
  // form: UseFormReturn<CourseCreateFormValues>;
  courseLanguage?: 'vi' | 'en';
} // Không cần truyền form nữa

const DetailsTab: React.FC<DetailsTabProps> = () => {
  const { control, watch, setValue } = useFormContext();
  const courseLanguage = watch('language');
  const [editorKeys, setEditorKeys] = useState({
    fullDescription: 1,
    requirements: 1,
    learningOutcomes: 1,
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
    </div>
  );
};

export default DetailsTab;
