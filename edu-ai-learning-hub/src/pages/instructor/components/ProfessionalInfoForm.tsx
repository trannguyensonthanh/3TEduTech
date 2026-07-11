// src/pages/instructor/components/ProfessionalInfoForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TProfessionalInfoSchema,
  ProfessionalInfoSchema,
} from '@/lib/validators/instructorProfileValidator';
import {
  useMyInstructorProfile,
  useUpdateMyInstructorProfile,
} from '@/hooks/queries/instructor.queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const ProfessionalInfoForm = () => {
  const { data: profile, isLoading: isLoadingProfile } =
    useMyInstructorProfile();
  const { mutate: updateProfile, isPending: isUpdating } =
    useUpdateMyInstructorProfile({
      onSuccess: () => {
        toast.success('Professional information updated successfully!');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update information.');
      },
    });

  const form = useForm<TProfessionalInfoSchema>({
    resolver: zodResolver(ProfessionalInfoSchema),
    defaultValues: {
      professionalTitle: '',
      bio: '',
      aboutMe: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        professionalTitle: profile.professionalTitle || '',
        bio: profile.bio || '',
        aboutMe: profile.aboutMe || '',
      });
    }
  }, [profile, form]);

  const onSubmit = (data: TProfessionalInfoSchema) => {
    updateProfile(data);
  };

  if (isLoadingProfile) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Icons.spinner className='mr-2 h-5 w-5 animate-spin text-muted-foreground' />
        <span className='text-muted-foreground text-lg'>
          Loading professional info...
        </span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              Your professional title, bio and a more detailed "About Me"
              section.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <FormField
              control={form.control}
              name='professionalTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. Senior Software Engineer'
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='bio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='A brief introduction about your expertise and teaching style.'
                      className='resize-y'
                      rows={4}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='aboutMe'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Me</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Share more about your background, journey, and what students can expect from your courses.'
                      className='resize-y'
                      rows={8}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end'>
              <Button type='submit' disabled={isUpdating}>
                {isUpdating && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                Save Professional Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
