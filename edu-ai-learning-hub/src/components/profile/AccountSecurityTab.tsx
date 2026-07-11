// src/components/profile/AccountSecurityTab.tsx
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { useChangePasswordMutation } from '@/hooks/queries/auth.queries'; // Import hook và type
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { ChangePasswordData } from '@/services/auth.service';

// Validation Schema với Zod
const passwordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required.' }),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters long.' })
      .max(100, { message: 'New password cannot exceed 100 characters.' }),
    // .regex(/[a-z]/, {
    //   message: 'Must contain at least one lowercase letter.',
    // })
    // .regex(/[A-Z]/, {
    //   message: 'Must contain at least one uppercase letter.',
    // })
    // .regex(/[0-9]/, { message: 'Must contain at least one number.' })
    // .regex(/[^a-zA-Z0-9]/, {
    //   message: 'Must contain at least one special character.',
    // }),
    confirmNewPassword: z
      .string()
      .min(1, { message: 'Please confirm your new password.' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match. Please try again.',
    path: ['confirmNewPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const AccountSecurityTab: React.FC = () => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid }, // Thêm isValid để kiểm tra form hợp lệ
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: 'onChange', // Validate khi thay đổi để user thấy lỗi sớm
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const changePasswordMutation = useChangePasswordMutation({
    onSuccess: (data) => {
      toast({
        title: 'Password Updated',
        description:
          data.message ||
          'Your password has been successfully changed. Please use your new password for the next login.',
        duration: 5000,
      });
      reset(); // Reset form sau khi thành công
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Password Update Failed',
        description:
          error.message ||
          'Could not update your password. Please check your current password and try again.',
      });
    },
  });

  const onSubmitPassword: SubmitHandler<PasswordFormValues> = async (data) => {
    const payload: ChangePasswordData = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmNewPassword: data.confirmNewPassword,
    };
    // API backend của bạn có thể không cần confirmNewPassword nếu Zod đã xử lý
    changePasswordMutation.mutate(payload);
  };

  return (
    <div className='space-y-8'>
      {/* Change Password Section */}
      <Card className='dark:bg-slate-800/30 shadow-lg border dark:border-slate-700/60'>
        <CardHeader className='border-b dark:border-slate-700/60 pb-4'>
          <CardTitle className='text-2xl font-semibold flex items-center'>
            <Icons.keyRound className='mr-3 h-6 w-6 text-primary dark:text-primary/90 opacity-90' />
            Change Your Password
          </CardTitle>
          <CardDescription className='text-sm'>
            Choose a strong, unique password to enhance your account security.
            We recommend using a password manager for optimal safety.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmitPassword)}>
          <CardContent className='p-6 space-y-5'>
            <div className='space-y-1.5'>
              <Label htmlFor='currentPassword'>
                Current Password <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='currentPassword'
                type='password'
                {...register('currentPassword')}
                className={cn(
                  'h-11 text-base',
                  errors.currentPassword &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete='current-password'
                placeholder='Enter your current password'
              />
              {errors.currentPassword && (
                <p className='text-xs text-destructive mt-1.5'>
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <Separator className='my-6 dark:bg-slate-700/60' />

            <div className='space-y-1.5'>
              <Label htmlFor='newPassword'>
                New Password <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='newPassword'
                type='password'
                {...register('newPassword')}
                className={cn(
                  'h-11 text-base',
                  errors.newPassword &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete='new-password'
                placeholder='Enter your new password'
              />
              {errors.newPassword && (
                <p className='text-xs text-destructive mt-1.5'>
                  {errors.newPassword.message}
                </p>
              )}
              <p className='text-xs text-muted-foreground mt-1'>
                Must be at least 8 characters and include uppercase, lowercase,
                number, and special character.
              </p>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='confirmNewPassword'>
                Confirm New Password <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='confirmNewPassword'
                type='password'
                {...register('confirmNewPassword')}
                className={cn(
                  'h-11 text-base',
                  errors.confirmNewPassword &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete='new-password'
                placeholder='Confirm your new password'
              />
              {errors.confirmNewPassword && (
                <p className='text-xs text-destructive mt-1.5'>
                  {errors.confirmNewPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className='border-t dark:border-slate-700/60 pt-6'>
            <Button
              type='submit'
              disabled={
                changePasswordMutation.isPending || !isDirty || !isValid
              }
              size='lg'
              className='h-11 px-6 text-base'
            >
              {changePasswordMutation.isPending ? (
                <Icons.spinner className='mr-2 h-5 w-5 animate-spin' />
              ) : (
                <Icons.save className='mr-2 h-5 w-5' /> // Hoặc Icons.keyRound
              )}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Two-Factor Authentication Section (Future Enhancement) */}
      <Card className='dark:bg-slate-800/30 shadow-lg border dark:border-slate-700/60 opacity-60 cursor-not-allowed'>
        {' '}
        {/* Làm mờ và không cho click */}
        <CardHeader className='pb-4'>
          <CardTitle className='text-2xl font-semibold flex items-center'>
            <Icons.shieldCheck className='mr-3 h-6 w-6 text-green-500 dark:text-green-400' />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription className='text-sm'>
            Add an extra layer of security to protect your account from
            unauthorized access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Two-Factor Authentication adds an additional login step. You'll need
            your password and a code from an authenticator app.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant='outline' disabled className='h-11 text-base'>
            Enable 2FA (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
