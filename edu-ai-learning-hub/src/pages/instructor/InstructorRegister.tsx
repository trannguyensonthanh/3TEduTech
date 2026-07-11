/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/common/Icons';
import { useToast } from '@/components/ui/use-toast';
import {
  useForm,
  Controller,
  SubmitHandler,
  useFieldArray,
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterInstructorData } from '@/services/auth.service';
import { useRegisterInstructorMutation } from '@/hooks/queries/auth.queries';
import { useSkills } from '@/hooks/queries/skill.queries';
import { Skill } from '@/services/skill.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
const socialPlatforms = [
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Snapchat',
  'Pinterest',
  'Reddit',
  'WhatsApp',
  'Telegram',
  'WeChat',
  'Discord',
  'GitHub',
  'Threads',
  'LINE',
  'Messenger',
];
// Zod schema definition
const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required').max(50),
  url: z.string().url('Invalid URL').max(500),
});

const registerInstructorSchema = z
  .object({
    email: z.string().email('Invalid email').min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters'),
    fullName: z.string().min(1, 'Full name is required').max(150),
    professionalTitle: z.string().max(255).optional().nullable(),
    bio: z.string().max(4000).optional().nullable(),
    skills: z.array(z.string()).optional().nullable(), // Định nghĩa `skills` là một mảng chuỗi
    socialLinks: z.array(socialLinkSchema).optional().nullable(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type RegisterInstructorFormData = z.infer<typeof registerInstructorSchema>;
// Step definitions
const stepsConfig = [
  {
    id: 1,
    name: 'Account Setup',
    icon: <Icons.userCircle className='h-5 w-5' />,
    fields: ['fullName', 'email', 'password', 'confirmPassword'] as const,
  },
  {
    id: 2,
    name: 'Professional Profile',
    icon: <Icons.fileText className='h-5 w-5' />,
    fields: ['professionalTitle', 'bio', 'skills'] as const,
  },
  {
    id: 3,
    name: 'Online Presence',
    icon: <Icons.link2 className='h-5 w-5' />,
    fields: ['socialLinks'] as const,
  }, // Thay đổi step 3 thành Social Links
  {
    id: 4,
    name: 'Agreement & Submit',
    icon: <Icons.shieldCheck className='h-5 w-5' />,
    fields: ['agreedToTerms'] as const,
  }, // Thay đổi step 4
];
const InstructorRegisterPage = () => {
  // Đổi tên component cho rõ ràng
  const { toast } = useToast();
  const navigate = useNavigate(); // Sử dụng navigate để chuyển trang sau khi thành công
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields, dirtyFields },
    trigger,
    setValue,
    watch,
    reset,
    getValues, // Thêm getValues
  } = useForm<RegisterInstructorFormData>({
    resolver: zodResolver(registerInstructorSchema),
    mode: 'onTouched', // Validate khi blur khỏi field
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      professionalTitle: '',
      bio: '',
      skills: [],
      socialLinks: [{ platform: '', url: '' }],
      agreedToTerms: false,
    },
  });
  // useFieldArray cho socialLinks
  const {
    fields: socialLinkFields,
    append: appendSocialLink,
    remove: removeSocialLink,
  } = useFieldArray({
    control,
    name: 'socialLinks',
  });

  const { data: skillsData, isLoading: isSkillsLoading } = useSkills({
    limit: 100,
  }); // Lấy tất cả skills

  const validateCurrentStep = async (): Promise<boolean> => {
    const currentStepConfig = stepsConfig.find((s) => s.id === currentStep);
    if (!currentStepConfig) return false;

    const result = await trigger(currentStepConfig.fields);
    if (!result) {
      // Tìm lỗi đầu tiên và focus vào đó (tùy chọn)
      const firstErrorField = currentStepConfig.fields.find(
        (field) => errors[field]
      );
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please correct the highlighted fields before proceeding.',
      });
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < stepsConfig.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const registerInstructorMutation = useRegisterInstructorMutation({
    onSuccess: (data) => {
      toast({
        variant: 'default',
        title: 'Application Submitted Successfully!',
        description:
          data.message ||
          'We will review your application and get back to you soon.',
        duration: 5000,
      });
      reset(); // Reset form
      // Chuyển hướng đến trang thành công hoặc dashboard
      navigate('/instructor/register/success'); // Giả sử có trang này
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description:
          error?.message ||
          'An error occurred while submitting your application.',
      });
    },
  });

  const onSubmit: SubmitHandler<RegisterInstructorFormData> = (data) => {
    console.log('Form Data:', data);
    // Lọc bỏ social links rỗng
    const validSocialLinks = data.socialLinks?.filter(
      (link) => link.platform && link.url
    );

    // Chuẩn bị dữ liệu gửi đi (loại bỏ confirmPassword)
    const apiData: RegisterInstructorData = {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      professionalTitle: data.professionalTitle || undefined, // Gửi undefined nếu rỗng
      bio: data.bio || undefined,
      skills: data.skills || [], // Gửi mảng rỗng nếu không có kỹ năng nào được chọn
      socialLinks:
        validSocialLinks && validSocialLinks.length > 0
          ? validSocialLinks.map((link) => ({
              platform: link.platform!,
              url: link.url!,
            }))
          : undefined,
    };

    registerInstructorMutation.mutate(apiData);
  };

  const selectedSkills = watch('skills') || [];
  const handleSkillToggle = (skillName: string) => {
    const newSkills = selectedSkills.includes(skillName)
      ? selectedSkills.filter((s) => s !== skillName)
      : [...selectedSkills, skillName];
    setValue('skills', newSkills, { shouldValidate: true, shouldDirty: true });
  };

  // Animation variants
  const stepVariants = {
    hidden: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 100 : -100,
    }),
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction < 0 ? 100 : -100,
      transition: { duration: 0.3, ease: 'easeInOut' },
    }),
  };
  const [direction, setDirection] = useState(0); // Cho hướng animation
  return (
    <Layout>
      <div className='bg-slate-50 dark:bg-slate-900/30 border-b dark:border-slate-700/60'>
        <div className='container mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-10 text-center'>
          <Icons.userPlus className='h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 text-primary dark:text-primary/90' />
          <h1 className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-slate-50 mb-3 tracking-tight'>
            Become an Instructor
          </h1>
          <p className='text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto'>
            Share your expertise, inspire learners, and earn revenue by creating
            courses on 3TEduTech.
          </p>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8 md:py-12'>
        <div className='max-w-3xl mx-auto'>
          {/* Stepper UI */}
          <div className='mb-10 md:mb-12 px-2'>
            <div className='flex items-center justify-center sm:justify-start'>
              {' '}
              {/* justify-start trên sm */}
              {stepsConfig.map((stepInfo, index) => (
                <React.Fragment key={stepInfo.id}>
                  <div className='flex flex-col items-center text-center'>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        transition: {
                          delay: index * 0.1,
                          type: 'spring',
                          stiffness: 300,
                          damping: 15,
                        },
                      }}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 font-semibold text-sm transition-all duration-300 cursor-default',
                        currentStep === stepInfo.id
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                          : currentStep > stepInfo.id
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-background dark:bg-slate-700 border-border dark:border-slate-600 text-muted-foreground'
                      )}
                    >
                      {currentStep > stepInfo.id ? (
                        <Icons.check className='h-5 w-5 sm:h-6 sm:w-6' />
                      ) : (
                        stepInfo.id
                      )}
                    </motion.div>
                    <p
                      className={cn(
                        'mt-2 text-xs sm:text-sm font-medium transition-colors',
                        currentStep >= stepInfo.id
                          ? 'text-primary dark:text-primary/90'
                          : 'text-muted-foreground'
                      )}
                    >
                      {stepInfo.name}
                    </p>
                  </div>
                  {index < stepsConfig.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: currentStep > stepInfo.id ? 1 : 0.5,
                        transition: {
                          delay: index * 0.1 + 0.1,
                          duration: 0.4,
                          ease: 'circOut',
                        },
                      }}
                      style={{ transformOrigin: 'left' }}
                      className={cn(
                        'h-1 flex-1 mx-2 sm:mx-3 rounded-full self-start mt-5 sm:mt-6', // self-start và mt-6 để align với circle
                        currentStep > stepInfo.id
                          ? 'bg-primary'
                          : 'bg-border dark:bg-slate-600'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card className='shadow-xl dark:bg-slate-800/40 border dark:border-slate-700/60'>
            <form onSubmit={handleSubmit(onSubmit)} className='overflow-hidden'>
              {' '}
              {/* overflow-hidden cho animation */}
              <AnimatePresence mode='wait' custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                >
                  {/* Các CardHeader, CardContent, CardFooter sẽ nằm trong từng step */}
                  {currentStep === 1 && (
                    /* Step 1 Content */ <Step1Content
                      control={control}
                      errors={errors}
                      register={register}
                    />
                  )}
                  {currentStep === 2 && (
                    /* Step 2 Content */ <Step2Content
                      control={control}
                      errors={errors}
                      register={register}
                      skillsData={skillsData?.skills || []}
                      isSkillsLoading={isSkillsLoading}
                      selectedSkills={selectedSkills}
                      onSkillToggle={handleSkillToggle}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3Content
                      control={control}
                      errors={errors}
                      fields={socialLinkFields}
                      append={appendSocialLink}
                      remove={removeSocialLink}
                      register={register}
                    />
                  )}
                  {currentStep === 4 && (
                    /* Step 4 Content */ <Step4Content
                      control={control}
                      errors={errors}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              {/* Navigation Buttons */}
              <CardFooter className='mt-2 p-6 border-t dark:border-slate-700/60 flex justify-between'>
                {currentStep > 1 ? (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setDirection(-1);
                      prevStep();
                    }}
                    className='h-11 px-6 text-base'
                  >
                    <Icons.arrowLeft className='mr-2 h-4 w-4' /> Back
                  </Button>
                ) : (
                  <Link to='/'>
                    <Button
                      type='button'
                      variant='ghost'
                      className='h-11 px-6 text-base text-muted-foreground hover:text-foreground'
                    >
                      Cancel Application
                    </Button>
                  </Link>
                )}

                {currentStep < stepsConfig.length ? (
                  <Button
                    type='button'
                    onClick={() => {
                      setDirection(1);
                      nextStep();
                    }}
                    className='h-11 px-6 text-base'
                  >
                    Continue <Icons.arrowRight className='ml-2 h-4 w-4' />
                  </Button>
                ) : (
                  <Button
                    type='submit'
                    disabled={registerInstructorMutation.isPending}
                    className='h-11 px-6 text-base'
                  >
                    {registerInstructorMutation.isPending ? (
                      <Icons.spinner className='mr-2 h-5 w-5 animate-spin' />
                    ) : (
                      <Icons.send className='mr-2 h-5 w-5' />
                    )}
                    Submit Application
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

// Tách các step thành component con để code chính đỡ dài
// STEP 1: Account Information
const Step1Content: React.FC<{ control: any; errors: any; register: any }> = ({
  control,
  errors,
  register,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center mb-1'>
          {stepsConfig[0].icon}
          <CardTitle className='text-2xl ml-2'>{stepsConfig[0].name}</CardTitle>
        </div>
        <CardDescription>
          Provide your basic account details to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5 pt-2'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5'>
          <div className='space-y-1.5'>
            <Label htmlFor='fullName'>
              Full Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='fullName'
              {...register('fullName')}
              placeholder='e.g., Jane Doe'
              className={cn(
                'h-11',
                errors.fullName &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            {errors.fullName && (
              <p className='text-xs text-destructive mt-1'>
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='email'>
              Email Address <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='email'
              type='email'
              {...register('email')}
              placeholder='you@example.com'
              className={cn(
                'h-11',
                errors.email &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            {errors.email && (
              <p className='text-xs text-destructive mt-1'>
                {errors.email.message}
              </p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='password'>
              Password <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder='Min. 8 characters'
                className={cn(
                  'h-11 pr-10',
                  errors.password &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground'
                onClick={() => setShowPassword(!showPassword)}
              >
                <Icons.eyeOff
                  className={cn('h-4 w-4', !showPassword && 'hidden')}
                />
                <Icons.eye
                  className={cn('h-4 w-4', showPassword && 'hidden')}
                />
              </Button>
            </div>
            {errors.password && (
              <p className='text-xs text-destructive mt-1'>
                {errors.password.message}
              </p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='confirmPassword'>
              Confirm Password <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder='Re-enter password'
                className={cn(
                  'h-11 pr-10',
                  errors.confirmPassword &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icons.eyeOff
                  className={cn('h-4 w-4', !showConfirmPassword && 'hidden')}
                />
                <Icons.eye
                  className={cn('h-4 w-4', showConfirmPassword && 'hidden')}
                />
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className='text-xs text-destructive mt-1'>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
};
// STEP 2: Profile Information
const Step2Content: React.FC<{
  control: any;
  errors: any;
  register: any;
  skillsData: Skill[];
  isSkillsLoading: boolean;
  selectedSkills: string[];
  onSkillToggle: (skillName: string) => void;
}> = ({
  control,
  errors,
  register,
  skillsData,
  isSkillsLoading,
  selectedSkills,
  onSkillToggle,
}) => {
  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center mb-1'>
          {stepsConfig[1].icon}
          <CardTitle className='text-2xl ml-2'>{stepsConfig[1].name}</CardTitle>
        </div>
        <CardDescription>
          Share your professional background and areas of expertise.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5 pt-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='professionalTitle'>
            Professional Title <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='professionalTitle'
            {...register('professionalTitle')}
            placeholder='e.g., Senior Software Engineer, Lead Designer'
            className={cn(
              'h-11',
              errors.professionalTitle && 'border-destructive'
            )}
          />
          {errors.professionalTitle && (
            <p className='text-xs text-destructive mt-1'>
              {errors.professionalTitle.message}
            </p>
          )}
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='bio'>Biography / About You</Label>
          <Textarea
            id='bio'
            {...register('bio')}
            placeholder='Tell us about your experience, teaching philosophy, and what makes you passionate...'
            rows={6}
            className={cn(errors.bio && 'border-destructive')}
          />
          <p className='text-xs text-muted-foreground'>
            This will be displayed on your instructor profile. (Max 4000
            characters)
          </p>
          {errors.bio && (
            <p className='text-xs text-destructive mt-1'>
              {errors.bio.message}
            </p>
          )}
        </div>
        <div className='space-y-1.5'>
          <Label>Your Skills (Select up to 5-7 relevant skills)</Label>
          {isSkillsLoading ? (
            <div className='flex flex-wrap gap-2 mt-2'>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className='h-9 w-24 rounded-full' />
              ))}
            </div>
          ) : skillsData && skillsData.length > 0 ? (
            <ScrollArea className='h-40 border rounded-md p-3 dark:border-slate-700'>
              <div className='flex flex-wrap gap-2.5'>
                {skillsData.map((skill) => (
                  <Button
                    key={skill.skillId}
                    type='button'
                    variant={
                      selectedSkills.includes(skill.skillName)
                        ? 'default'
                        : 'outline'
                    }
                    size='sm'
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm transition-all',
                      selectedSkills.includes(skill.skillName) &&
                        'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    onClick={() => onSkillToggle(skill.skillName)}
                  >
                    {skill.skillName}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className='text-sm text-muted-foreground'>
              No skills available to select.
            </p>
          )}
          {errors.skills && (
            <p className='text-xs text-destructive mt-1'>
              {errors.skills.message}
            </p>
          )}
        </div>
      </CardContent>
    </>
  );
};
// STEP 3: Social Links (Mới)
const Step3Content: React.FC<{
  control: any;
  errors: any;
  fields: any[]; // Kiểu của fields từ useFieldArray (thường là { id: string, ... })
  append: (value: { platform: string; url: string }) => void;
  remove: (index: number) => void;
  register: any; // THÊM PROP REGISTER
}> = ({ control, errors, fields, append, remove, register }) => {
  // NHẬN PROP REGISTER
  // `socialPlatforms` array đã được định nghĩa ở trên cùng (trong InstructorRegisterPage)
  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center mb-1'>
          {stepsConfig[2].icon}{' '}
          {/* Giả sử stepsConfig được truy cập từ scope cha hoặc import */}
          <CardTitle className='text-2xl ml-2'>{stepsConfig[2].name}</CardTitle>
        </div>
        <CardDescription>
          Share your social media profiles to help students connect with you
          (optional).
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5 pt-2'>
        {fields.map(
          (
            fieldItem,
            index // Đổi tên 'field' thành 'fieldItem' để tránh trùng với prop của Controller
          ) => (
            <div
              key={fieldItem.id} // useFieldArray cung cấp 'id'
              className='flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 border dark:border-slate-700 rounded-lg bg-background dark:bg-slate-800/30'
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow w-full sm:w-auto'>
                <div className='space-y-1.5'>
                  <Label htmlFor={`socialLinks.${index}.platform`}>
                    Platform
                  </Label>
                  <Controller
                    name={`socialLinks.${index}.platform`}
                    control={control}
                    render={(
                      { field: controllerField } // field ở đây là của Controller
                    ) => (
                      <Select
                        onValueChange={controllerField.onChange}
                        value={controllerField.value || ''}
                      >
                        <SelectTrigger
                          id={`socialLinks.${index}.platform`}
                          className='h-11'
                        >
                          <SelectValue placeholder='Select Platform' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Social Media</SelectLabel>
                            {socialPlatforms.map(
                              (
                                p // socialPlatforms cần được truy cập từ scope cha hoặc import
                              ) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              )
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.socialLinks?.[index]?.platform && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.socialLinks[index]?.platform?.message}
                    </p>
                  )}
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor={`socialLinks.${index}.url`}>
                    Profile URL
                  </Label>
                  <Input
                    id={`socialLinks.${index}.url`}
                    // SỬ DỤNG REGISTER ĐÃ ĐƯỢC TRUYỀN VÀO
                    {...register(`socialLinks.${index}.url` as const)}
                    placeholder='https://...'
                    className='h-11'
                  />
                  {errors.socialLinks?.[index]?.url && (
                    <p className='text-xs text-destructive mt-1'>
                      {errors.socialLinks[index]?.url?.message}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='text-muted-foreground hover:text-destructive h-11 w-11 sm:ml-auto mt-2 sm:mt-0 flex-shrink-0'
                aria-label='Remove social link'
              >
                <Icons.trash className='h-5 w-5' />
              </Button>
            </div>
          )
        )}
        <Button
          type='button'
          variant='outline'
          onClick={() => append({ platform: '', url: '' })}
          className='mt-3 h-10 text-sm border-dashed hover:border-solid hover:bg-accent'
        >
          <Icons.plusCircle className='mr-2 h-4 w-4' /> Add Another Link
        </Button>
      </CardContent>
    </>
  );
};

// STEP 4: Agreement & Submit
const Step4Content: React.FC<{ control: any; errors: any }> = ({
  control,
  errors,
}) => {
  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center mb-1'>
          {stepsConfig[3].icon}
          <CardTitle className='text-2xl ml-2'>{stepsConfig[3].name}</CardTitle>
        </div>
        <CardDescription>
          Please review and agree to our terms to complete your application.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5 pt-2'>
        <div className='bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg border dark:border-slate-600/50'>
          <h3 className='font-semibold text-lg text-foreground mb-3'>
            Instructor Agreement Summary
          </h3>
          <ScrollArea className='h-48 custom-scrollbar pr-3'>
            <div className='text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed'>
              <p>
                By applying to become an instructor on 3TEduTech, you
                acknowledge and agree to our full Instructor Terms of Service
                and Privacy Policy. Key responsibilities and terms include:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li>
                  You confirm that you own or have the necessary licenses,
                  rights, consents, and permissions to authorize 3TEduTech to
                  use your submitted content.
                </li>
                <li>
                  You will not submit content that is copyrighted, protected by
                  trade secret or otherwise subject to third party proprietary
                  rights, including privacy and publicity rights, unless you are
                  the owner of such rights or have permission from their
                  rightful owner.
                </li>
                <li>
                  You are responsible for the accuracy, quality, and legality of
                  your course content.
                </li>
                <li>
                  Revenue sharing is based on the current Instructor Revenue
                  Share model outlined in our terms.
                </li>
                <li>
                  Payouts are processed according to the schedule and minimum
                  thresholds specified in our terms.
                </li>
                <li>
                  3TEduTech reserves the right to remove content or instructors
                  that violate our policies.
                </li>
              </ul>
              <p className='mt-3'>
                Please read the full{' '}
                <Link
                  to='/terms-instructor'
                  target='_blank'
                  className='text-primary hover:underline font-medium'
                >
                  Instructor Terms
                </Link>{' '}
                and{' '}
                <Link
                  to='/privacy'
                  target='_blank'
                  className='text-primary hover:underline font-medium'
                >
                  Privacy Policy
                </Link>{' '}
                carefully.
              </p>
            </div>
          </ScrollArea>
        </div>
        <div className='flex items-start space-x-3 pt-3'>
          <Controller
            name='agreedToTerms'
            control={control}
            render={({ field }) => (
              <Checkbox
                id='agreedToTerms-cb' // ID phải là duy nhất
                checked={field.value}
                onCheckedChange={field.onChange}
                className='mt-0.5'
                aria-labelledby='agreedToTerms-label'
              />
            )}
          />
          <div className='grid gap-1.5 leading-none'>
            <Label
              htmlFor='agreedToTerms-cb'
              id='agreedToTerms-label'
              className='text-sm font-medium text-foreground cursor-pointer'
            >
              I have read, understood, and agree to the 3TEduTech Instructor
              Terms and Privacy Policy.{' '}
              <span className='text-destructive'>*</span>
            </Label>
            {errors.agreedToTerms && (
              <p className='text-xs text-destructive'>
                {errors.agreedToTerms.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default InstructorRegisterPage;
