/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/instructor/CourseCreation.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCreateCourse } from '@/hooks/queries/course.queries';
import { useCategories } from '@/hooks/queries/category.queries';
import { useLanguages } from '@/hooks/queries/language.queries';
import {
  courseCreationSchema,
  TCourseCreationSchema,
} from '@/lib/validators/courseCreationValidator';

// UI Components
import InstructorLayout from '@/components/layout/InstructorLayout';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';

const CourseCreation: React.FC = () => {
  const navigate = useNavigate();
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories({ limit: 100 });
  const { data: languagesData, isLoading: isLoadingLanguages } = useLanguages();
  const { mutateAsync: createCourse, isPending: isCreating } =
    useCreateCourse();

  const form = useForm<TCourseCreationSchema>({
    resolver: zodResolver(courseCreationSchema),
    defaultValues: {
      courseName: '',
      categoryId: undefined,
      language: 'vi', // Mặc định là Tiếng Việt
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: TCourseCreationSchema) => {
    // Ensure all required fields are present and not undefined
    const payload = {
      courseName: data.courseName ?? '',
      categoryId: data.categoryId as number,
      language: data.language,
    };
    toast.promise(createCourse(payload), {
      loading: 'Creating your new course...',
      success: (createdCourse) => {
        // Chuyển hướng đến trang edit với slug của khóa học vừa tạo
        navigate(`/instructor/courses/${createdCourse.slug}/edit`);
        return `Course "${createdCourse.courseName}" created! You can now build its content.`;
      },
      error: (err: any) => err.message || 'Failed to create course.',
    });
  };

  const isLoading = isLoadingCategories || isLoadingLanguages;

  return (
    <InstructorLayout>
      <div className='container mx-auto max-w-5xl py-2'>
        <div className='flex flex-col items-center text-center mb-8'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <Icons.bookPlus className='h-8 w-8 text-primary' />
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Let's Create a New Course
          </h1>
          <p className='mt-2 text-muted-foreground'>
            Just a few details to get started. You can add lessons, pricing, and
            more in the next step.
          </p>
        </div>

        <Card className='shadow-lg'>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>What is your course about?</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <FormField
                  control={form.control}
                  name='courseName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., The Complete 2024 Web Development Bootcamp'
                          {...field}
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='categoryId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue
                                placeholder={
                                  isLoading ? 'Loading...' : 'Select a category'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesData?.categories.map((cat) => (
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
                    name='language'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue
                                placeholder={
                                  isLoading ? 'Loading...' : 'Select a language'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languagesData?.languages
                              .filter((l) => l.isActive)
                              .map((lang) => (
                                <SelectItem
                                  key={lang.languageCode}
                                  value={lang.languageCode}
                                >
                                  {lang.nativeName} ({lang.languageName})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='pt-4 flex justify-end'>
                  <Button type='submit' disabled={isCreating}>
                    {isCreating && (
                      <Icons.loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Save and Continue
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </InstructorLayout>
  );
};

export default CourseCreation;
