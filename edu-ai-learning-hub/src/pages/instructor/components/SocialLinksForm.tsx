// src/pages/instructor/components/SocialLinksForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TSocialLinksSchema,
  SocialLinksSchema,
} from '@/lib/validators/instructorProfileValidator';
import {
  useMyInstructorProfile,
  useAddOrUpdateMySocialLink,
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

// Đã loại bỏ WEBSITE khỏi danh sách này
const socialPlatforms = [
  {
    id: 'LINKEDIN',
    icon: Icons.linkedin,
    placeholder: 'https://linkedin.com/in/username',
  },
  {
    id: 'GITHUB',
    icon: Icons.github,
    placeholder: 'https://github.com/username',
  },
  {
    id: 'YOUTUBE',
    icon: Icons.youtube,
    placeholder: 'https://youtube.com/c/channel',
  },
  {
    id: 'TWITTER',
    icon: Icons.twitter,
    placeholder: 'https://twitter.com/username',
  },
] as const;

export const SocialLinksForm = () => {
  const { data: profile, isLoading: isLoadingProfile } =
    useMyInstructorProfile();
  const { mutate: updateLink, isPending: isUpdating } =
    useAddOrUpdateMySocialLink();

  // Đã loại bỏ logic xử lý WEBSITE
  const initialValues = useMemo(() => {
    return (
      profile?.socialLinks?.reduce(
        (acc, link) => {
          acc[link.platform] = link.url;
          return acc;
        },
        {} as Record<string, string>
      ) || {}
    );
  }, [profile]);

  const form = useForm<TSocialLinksSchema>({
    resolver: zodResolver(SocialLinksSchema),
    defaultValues: {
      LINKEDIN: '',
      GITHUB: '',
      YOUTUBE: '',
      TWITTER: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset(initialValues);
    }
  }, [profile, initialValues, form]);

  const onSubmit = (data: TSocialLinksSchema) => {
    const promises = Object.entries(data).map(([platform, url]) => {
      if (url !== initialValues[platform]) {
        return new Promise((resolve, reject) => {
          updateLink(
            { platform, url: url || '' },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });
      }
      return Promise.resolve();
    });

    toast.promise(Promise.all(promises), {
      loading: 'Updating links...',
      success: 'Social links updated successfully!',
      error: 'Failed to update some links.',
    });
  };

  if (isLoadingProfile) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Icons.spinner className='mr-2 h-5 w-5 animate-spin text-muted-foreground' />
        <span className='text-muted-foreground text-lg'>
          Loading social links...
        </span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>
              Connect your profiles to broaden your reach.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {socialPlatforms.map((platform) => (
              <FormField
                key={platform.id}
                control={form.control}
                name={platform.id}
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center gap-4'>
                      <platform.icon className='h-6 w-6 text-muted-foreground' />
                      <FormControl>
                        <Input placeholder={platform.placeholder} {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className='pl-10' />
                  </FormItem>
                )}
              />
            ))}
            <div className='flex justify-end'>
              <Button type='submit' disabled={isUpdating}>
                {isUpdating && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                Save Social Links
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
