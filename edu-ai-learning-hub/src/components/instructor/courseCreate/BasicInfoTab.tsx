// src/components/instructor/courseCreate/BasicInfoTab.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/services/category.service';
import { Level } from '@/services/level.service';
import { Language } from '@/services/language.service';
import { TranslateButton } from '@/components/common/TranslateButton';
import TiptapEditor from '@/components/editor/TiptapEditor'; // Giả sử TiptapEditor đã được tạo

interface BasicInfoTabProps {
  categories: Category[];
  levels: Level[];
  languages: Language[];
  isLoading: boolean;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  categories,
  levels,
  languages,
  isLoading,
}) => {
  const form = useFormContext();
  const { control, watch, setValue } = form;

  const courseName = watch('courseName');
  const shortDescription = watch('shortDescription');
  const courseLanguage = watch('language');

  const generateSlug = useCallback((title: string): string => {
    if (!title) return '';
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('courseName', title, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('slug', generateSlug(title), { shouldDirty: true });
    form.setValue('shortDescription', shortDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const [shortDescriptionKey, setShortDescriptionKey] = useState(1);

  // Force re-render of TiptapEditor when form is reset (e.g. after reload)
  useEffect(() => {
    setShortDescriptionKey((prev) => prev + 1);
  }, [
    form.formState.isSubmitted,
    form.formState.isSubmitSuccessful,
    courseName,
  ]);

  return (
    <div className='space-y-6'>
      <FormField
        control={control}
        name='courseName'
        render={({ field }) => (
          <FormItem>
            <div className='flex items-center justify-between'>
              <FormLabel>Course Title*</FormLabel>
              <TranslateButton
                sourceText={courseName}
                sourceLang={courseLanguage as 'vi' | 'en'}
                onTranslated={(text) =>
                  setValue('courseName', text, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <FormControl>
              <Input
                placeholder='e.g. The Complete 2024 Web Development Bootcamp'
                {...field}
                onChange={handleTitleChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='slug'
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Slug</FormLabel>
            <FormControl>
              <Input
                placeholder='auto-generated-from-title'
                {...field}
                disabled
              />
            </FormControl>
            <FormDescription>
              The URL slug is automatically generated from your title.
            </FormDescription>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='shortDescription'
        render={() => (
          <FormItem>
            <div className='flex items-center justify-between mb-2'>
              <FormLabel>Short Description*</FormLabel>
              <TranslateButton
                sourceText={watch('shortDescription')}
                sourceLang={courseLanguage as 'vi' | 'en'}
                onTranslated={(text) => {
                  setValue('shortDescription', text, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });

                  setShortDescriptionKey((prev) => prev + 1);
                }}
              />
            </div>
            <FormControl>
              <Controller
                name='shortDescription'
                control={control}
                render={({ field: controllerField }) => (
                  <TiptapEditor
                    // *** SỬA LỖI: Truyền key ***
                    key={shortDescriptionKey}
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
            <FormDescription>
              This appears on search results and course cards. Keep it
              compelling.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <FormField
          control={form.control}
          name='categoryId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category*</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder='Select a category' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.categoryId}
                      value={cat.categoryId.toString()}
                    >
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='levelId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level*</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder='Select a level' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem
                      key={level.levelId}
                      value={level.levelId.toString()}
                    >
                      {level.levelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='language'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder='Select a language' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.languageCode}
                      value={lang.languageCode}
                    >
                      {lang.languageName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name='isFeatured'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center space-x-3 space-y-0 pt-2'>
            <FormControl>
              <input
                type='checkbox'
                id='isFeatured'
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className='h-4 w-4 accent-primary rounded border-gray-300 focus:ring-primary'
              />
            </FormControl>
            <FormLabel htmlFor='isFeatured' className='mb-0'>
              Featured Course
            </FormLabel>
            <FormDescription>
              Đánh dấu khoá học này là nổi bật để ưu tiên hiển thị trên trang
              chủ.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
export default BasicInfoTab;
