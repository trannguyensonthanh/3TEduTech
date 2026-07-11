/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '../common/Icons';
import { useRegisterMutation } from '@/hooks/queries/auth.queries';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Define schema using zod
const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(3, 'Full Name must be at least 3 characters')
      .max(150, 'Full Name must not exceed 150 characters'),
    roleId: z.string().default('NU'), // Default roleId is "NU"
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess: () => void;
}

const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      roleId: 'NU', // Default roleId
    },
  });

  // Use React Query's useRegisterMutation
  const registerMutation = useRegisterMutation({
    onSuccess: (data) => {
      toast({
        title: t('signupForm.successTitle'),
        description: data.message || t('signupForm.successDesc'),
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('signupForm.errorTitle'),
        description: error.message || t('signupForm.errorDesc'),
      });
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    setIsLoading(true);
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      roleId: data.roleId,
    });
    setIsLoading(false);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-1.5'>
        <Label htmlFor='signup-fullName'>{t('signupForm.fullName')}</Label>
        <div className='relative'>
          <Icons.user className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
          <Controller
            name='fullName'
            control={control}
            render={({ field }) => (
              <Input
                id='signup-fullName'
                placeholder={t('signupForm.fullNamePlaceholder')}
                {...field}
                disabled={registerMutation.isPending}
                className={cn(
                  'pl-10 h-11',
                  errors.fullName &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
            )}
          />
        </div>
        {errors.fullName && (
          <p className='text-xs text-destructive'>
            {t(errors.fullName.message as string)}
          </p>
        )}
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='signup-email'>{t('signupForm.email')}</Label>
        <div className='relative'>
          <Icons.mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
          <Controller
            name='email'
            control={control}
            render={({ field }) => (
              <Input
                id='signup-email'
                type='email'
                placeholder={t('signupForm.emailPlaceholder')}
                {...field}
                disabled={registerMutation.isPending}
                className={cn(
                  'pl-10 h-11',
                  errors.email &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
            )}
          />
        </div>
        {errors.email && (
          <p className='text-xs text-destructive'>
            {t(errors.email.message as string)}
          </p>
        )}
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='signup-password'>{t('signupForm.password')}</Label>
        <div className='relative'>
          <Icons.lockKeyhole className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <Input
                id='signup-password'
                type={showPassword ? 'text' : 'password'}
                placeholder={t('signupForm.passwordPlaceholder')}
                {...field}
                disabled={registerMutation.isPending}
                className={cn(
                  'pl-10 pr-10 h-11',
                  errors.password &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
            )}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground'
            onClick={() => setShowPassword(!showPassword)}
            aria-label={t('signupForm.togglePassword')}
          >
            {showPassword ? (
              <Icons.eyeOff className='h-4 w-4' />
            ) : (
              <Icons.eye className='h-4 w-4' />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className='text-xs text-destructive'>
            {t(errors.password.message as string)}
          </p>
        )}
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='signup-confirmPassword'>
          {t('signupForm.confirmPassword')}
        </Label>
        <div className='relative'>
          <Icons.lockKeyhole className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
          <Controller
            name='confirmPassword'
            control={control}
            render={({ field }) => (
              <Input
                id='signup-confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('signupForm.confirmPasswordPlaceholder')}
                {...field}
                disabled={registerMutation.isPending}
                className={cn(
                  'pl-10 pr-10 h-11',
                  errors.confirmPassword &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
            )}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={t('signupForm.toggleConfirmPassword')}
          >
            {showConfirmPassword ? (
              <Icons.eyeOff className='h-4 w-4' />
            ) : (
              <Icons.eye className='h-4 w-4' />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-destructive'>
            {t(errors.confirmPassword.message as string)}
          </p>
        )}
      </div>
      <Button
        type='submit'
        className='w-full h-11 text-base font-semibold'
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <Icons.spinner className='mr-2 h-5 w-5 animate-spin' />
        ) : (
          <Icons.userPlus className='mr-2 h-5 w-5' />
        )}{' '}
        {t('signupForm.createAccount')}
      </Button>
    </form>
  );
};
export default SignupForm;
