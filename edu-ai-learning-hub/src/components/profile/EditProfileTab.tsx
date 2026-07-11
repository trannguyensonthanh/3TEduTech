/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/profile/EditProfileTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/common/Icons';
import { useUpdateMyProfile } from '@/hooks/queries/user.queries';
import { useUpdateMyAvatar } from '@/hooks/queries/user.queries';
import { useToast } from '@/components/ui/use-toast';
import { UpdateUserProfileData, UserProfile } from '@/services/user.service';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';

// Validation Schema với Zod
const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: 'Full name must be at least 3 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' }),
  headline: z
    .string()
    .max(150, { message: 'Headline can be up to 150 characters.' })
    .optional()
    .or(z.literal('')), // Cho phép rỗng
  phoneNumber: z
    .string()
    .refine((value) => value === '' || /^[+]?[0-9\s-()]{7,20}$/.test(value), {
      message: 'Please enter a valid phone number format.',
    })
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, { message: 'Location can be up to 100 characters.' })
    .optional()
    .or(z.literal('')),
  birthDate: z
    .string() // Input date trả về string 'yyyy-MM-dd'
    .refine(
      (value) => {
        if (value === '') return true; // Cho phép rỗng
        const date = parseISO(value);
        return isValid(date) && date <= new Date(); // Ngày hợp lệ và không ở tương lai
      },
      { message: 'Please enter a valid birth date (past or present).' }
    )
    .optional()
    .or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  coverImageUrl: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .max(500)
    .optional()
    .or(z.literal('')), // Thêm
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileTabProps {
  userProfile: UserProfile | null;
  onUpdateSuccess?: () => void; // Callback để refetch profile ở component cha
}

export const EditProfileTab: React.FC<EditProfileTabProps> = ({
  userProfile,
  onUpdateSuccess,
}) => {
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userProfile?.avatarUrl || null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    userProfile?.coverImageUrl || null
  );
  const [addresses, setAddresses] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      // Sẽ được override bởi useEffect bên dưới nếu userProfile có giá trị
      fullName: '',
      headline: '',
      phoneNumber: '',
      location: '',
      birthDate: '',
      gender: '',
      coverImageUrl: '', // Thêm default value
    },
  });

  // Theo dõi giá trị của coverImageUrl input để cập nhật preview
  const coverUrlInputValue = watch('coverImageUrl');
  useEffect(() => {
    if (
      coverUrlInputValue &&
      profileFormSchema.shape.coverImageUrl.safeParse(coverUrlInputValue)
        .success
    ) {
      setCoverPreview(coverUrlInputValue);
    } else if (!coverUrlInputValue && userProfile?.coverImageUrl) {
      setCoverPreview(userProfile.coverImageUrl); // Quay lại ảnh gốc nếu input rỗng
    } else if (!coverUrlInputValue) {
      setCoverPreview(null);
    }
    // Không reset về ảnh gốc nếu URL không hợp lệ, để user thấy lỗi
  }, [coverUrlInputValue, userProfile?.coverImageUrl]);
  // Effect để reset form khi userProfile prop thay đổi (ví dụ: sau khi fetch hoặc update)
  useEffect(() => {
    if (userProfile) {
      reset({
        fullName: userProfile.fullName || '',
        headline: userProfile.headline || '',
        phoneNumber: userProfile.phoneNumber || '',
        location: userProfile.location || '',
        birthDate: userProfile.birthDate
          ? format(parseISO(userProfile.birthDate), 'yyyy-MM-dd')
          : '',
        gender: userProfile.gender || '',
        coverImageUrl: userProfile.coverImageUrl || '',
      });
      setAvatarPreview(userProfile.avatarUrl || null);
      setAvatarFile(null); // Reset file đã chọn
      setCoverPreview(userProfile.coverImageUrl || null);
    }
  }, [userProfile, reset]);

  const updateProfileMutation = useUpdateMyProfile({
    onSuccess: (updatedData) => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully saved.',
      });
      // Ưu tiên setValue từng trường với dữ liệu mới nhất (tránh mất dữ liệu do backend trả về cũ)
      setValue('fullName', updatedData.fullName || '', { shouldDirty: false });
      setValue('headline', updatedData.headline || '', { shouldDirty: false });
      setValue('phoneNumber', updatedData.phoneNumber || '', {
        shouldDirty: false,
      });
      setValue('location', updatedData.location || '', { shouldDirty: false });
      setValue(
        'birthDate',
        updatedData.birthDate
          ? format(parseISO(updatedData.birthDate), 'yyyy-MM-dd')
          : '',
        { shouldDirty: false }
      );
      setValue(
        'gender',
        updatedData.gender === 'MALE'
          ? 'MALE'
          : updatedData.gender === 'FEMALE'
            ? 'FEMALE'
            : updatedData.gender === 'OTHER'
              ? 'OTHER'
              : '',
        { shouldDirty: false }
      );
      setValue('coverImageUrl', updatedData.coverImageUrl || '', {
        shouldDirty: false,
      });
      setCoverPreview(updatedData.coverImageUrl || null);
      setAvatarPreview(updatedData.avatarUrl || null);
      setAvatarFile(null);
      onUpdateSuccess?.(); // Gọi callback để refetch profile ở UserProfilePage
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description:
          error.message || 'Could not save your profile information.',
      });
    },
  });

  const updateAvatarMutation = useUpdateMyAvatar({
    onSuccess: (updatedData) => {
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been successfully changed.',
      });
      setAvatarPreview(updatedData.avatarUrl || null);
      setAvatarFile(null);
      onUpdateSuccess?.(); // Gọi callback để refetch profile
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Avatar Upload Failed',
        description: error.message || 'Could not upload your new avatar.',
      });
    },
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    const changedProfileData: Partial<UpdateUserProfileData> = {};
    let profileHasChanges = false;

    (Object.keys(data) as Array<keyof ProfileFormValues>).forEach((key) => {
      if (dirtyFields[key]) {
        // Nếu field là coverImageUrl và giá trị rỗng, gửi null để xóa
        if (key === 'coverImageUrl' && data[key] === '') {
          (changedProfileData as any)[key] = null;
        } else {
          (changedProfileData as any)[key] =
            data[key] === '' ? null : data[key];
        }
        profileHasChanges = true;
      }
    });

    // Nếu birthDate không thay đổi nhưng giá trị là rỗng, đảm bảo gửi null nếu API yêu cầu
    if (
      data.birthDate === '' &&
      userProfile?.birthDate &&
      !dirtyFields.birthDate
    ) {
      // Trường hợp này không nên xảy ra nếu reset đúng, nhưng để an toàn
    } else if (data.birthDate === '' && dirtyFields.birthDate) {
      changedProfileData.birthDate = null;
    }

    if (profileHasChanges) {
      // API của bạn cần xử lý `birthDate` dạng string "yyyy-MM-dd" hoặc null
      updateProfileMutation.mutate(changedProfileData as UpdateUserProfileData);
    }

    if (avatarFile) {
      updateAvatarMutation.mutate(avatarFile);
    }

    if (!profileHasChanges && !avatarFile) {
      toast({
        title: 'No Changes Detected',
        description: "You haven't made any changes to save.",
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // Giới hạn 2MB
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Avatar image must be less than 2MB.',
        });
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PNG, JPG, or GIF image.',
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (
      words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')
    ).toUpperCase();
  };

  const isLoading =
    updateProfileMutation.isPending || updateAvatarMutation.isPending;

  // Hàm gọi API Goong Map để gợi ý địa chỉ
  const onAddressSearch = async (value: string) => {
    const YOUR_API_KEY = 'EAddPu1fx9SFE8rAE7Ogdp1rheIPEfrhiAB65nif';
    const apiUrl = `https://rsapi.goong.io/Place/AutoComplete?api_key=${YOUR_API_KEY}&input=${encodeURIComponent(value)}&more_compound=true`;
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.json();
      })
      .then((data) => {
        const namesArray = data.predictions.map(
          (item: any) => item.description
        );
        setAddresses(namesArray);
        setShowSuggestions(true);
      })
      .catch((error) => {
        setAddresses([]);
        setShowSuggestions(false);
        console.error('Error fetching data:', error);
      });
  };

  if (!userProfile) {
    // Xử lý trường hợp userProfile chưa có (ví dụ, khi đang fetch lần đầu ở component cha)
    return (
      <Card className='dark:bg-slate-800/30 shadow-md'>
        <CardHeader>
          <Skeleton className='h-8 w-48' />
        </CardHeader>
        <CardContent className='space-y-6'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className='h-12 w-32' />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='dark:bg-slate-800/30 shadow-lg border dark:border-slate-700/60'>
      <CardHeader className='border-b dark:border-slate-700/60 pb-4'>
        <CardTitle className='text-2xl font-semibold'>
          Edit Profile Information
        </CardTitle>
        <CardDescription className='text-sm'>
          Keep your personal details up to date. This information may be
          displayed publicly.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className='p-6 space-y-6 pt-5'>
          {' '}
          {/* Giảm pt chút */}
          {/* Cover Image Section */}
          <div className='space-y-2'>
            <Label htmlFor='coverImageUrl' className='text-base font-medium'>
              Cover Photo
            </Label>
            <AspectRatio
              ratio={16 / 5}
              className='bg-muted dark:bg-slate-700/30 rounded-lg overflow-hidden border dark:border-slate-600'
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt='Cover preview'
                  className='w-full h-full object-cover'
                  onError={() => {
                    // Nếu URL lỗi, có thể hiển thị placeholder hoặc thông báo
                    // setCoverPreview(null); // Hoặc một ảnh placeholder
                    // toast({variant: "warning", title:"Invalid Cover URL"})
                  }}
                />
              ) : (
                <div className='w-full h-full flex flex-col items-center justify-center text-muted-foreground'>
                  <Icons.image className='h-12 w-12 mb-2 opacity-50' />{' '}
                  {/* Giả sử có Icons.image */}
                  <p className='text-sm'>No cover image set</p>
                </div>
              )}
            </AspectRatio>
            <Input
              id='coverImageUrl'
              {...register('coverImageUrl')}
              placeholder='https://example.com/your-cover-image.jpg (Optional)'
              className={cn(
                'h-11 mt-2',
                errors.coverImageUrl &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            {errors.coverImageUrl && (
              <p className='text-xs text-destructive mt-1'>
                {errors.coverImageUrl.message}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>
              Enter a URL for your cover image. Recommended size: 1600x400px.
            </p>
          </div>
          <Separator className='my-6 dark:bg-slate-700/60' />
          <div className='space-y-2 flex-grow'>
            <Label
              htmlFor='avatar-upload-input'
              className='text-base font-medium'
            >
              Profile Picture
            </Label>
            <p className='text-xs text-muted-foreground mb-2'>
              Recommended: Square image (e.g., 400x400px). Max 2MB (PNG, JPG,
              GIF).
            </p>
            <input
              type='file'
              id='avatar-upload-input'
              accept='image/png, image/jpeg, image/gif'
              onChange={handleAvatarChange}
              ref={fileInputRef}
              className='hidden'
            />
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className='h-9'
              >
                <Icons.imageUp className='h-4 w-4 mr-2' /> Upload New
              </Button>
              {avatarPreview && avatarPreview !== userProfile.avatarUrl && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='text-xs text-muted-foreground hover:text-destructive h-9'
                  onClick={() => {
                    setAvatarPreview(userProfile.avatarUrl || null);
                    setAvatarFile(null);
                  }}
                >
                  Cancel Upload
                </Button>
              )}
            </div>
          </div>
          {/* Personal Details Form Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5'>
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
              <Label htmlFor='headline'>Professional Headline</Label>
              <Input
                id='headline'
                {...register('headline')}
                placeholder='e.g., Software Engineer | AI Enthusiast'
                className={cn(
                  'h-11',
                  errors.headline &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {errors.headline && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.headline.message}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='phoneNumber'>Phone Number</Label>
              <Input
                id='phoneNumber'
                {...register('phoneNumber')}
                placeholder='(Optional)'
                className={cn(
                  'h-11',
                  errors.phoneNumber &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {errors.phoneNumber && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='location'>Location</Label>
              <Input
                id='location'
                {...register('location')}
                placeholder='e.g., San Francisco, CA (Optional)'
                className={cn(
                  'h-11',
                  errors.location &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete='off'
                onChange={(e) => {
                  register('location').onChange(e);
                  const value = e.target.value;
                  if (value && value.length > 2) {
                    onAddressSearch(value);
                  } else {
                    setAddresses([]);
                    setShowSuggestions(false);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={(e) => {
                  if (addresses.length > 0) setShowSuggestions(true);
                }}
              />
              {/* Hiển thị gợi ý địa chỉ */}
              {showSuggestions && addresses.length > 0 && (
                <div className='absolute z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow w-[32%] mt-1 max-h-56 overflow-auto'>
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className='px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 text-sm'
                      onMouseDown={() => {
                        setValue('location', addr, { shouldDirty: true });
                        setAddresses([]);
                        setShowSuggestions(false);
                      }}
                    >
                      {addr}
                    </div>
                  ))}
                </div>
              )}
              {errors.location && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.location.message}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='birthDate'>Birth Date</Label>
              <Input
                id='birthDate'
                type='date'
                {...register('birthDate')}
                className={cn(
                  'h-11 block w-full',
                  errors.birthDate &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {errors.birthDate && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.birthDate.message}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='gender'>Gender</Label>
              <Controller
                name='gender'
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <SelectTrigger
                      id='gender'
                      className={cn(
                        'h-11',
                        errors.gender &&
                          'border-destructive focus-visible:ring-destructive'
                      )}
                    >
                      <SelectValue placeholder='Select gender (Optional)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='MALE'>Male</SelectItem>{' '}
                      {/* Value changed to uppercase */}
                      <SelectItem value='FEMALE'>Female</SelectItem>{' '}
                      {/* Value changed to uppercase */}
                      <SelectItem value='OTHER'>Other</SelectItem>{' '}
                      {/* Value changed to uppercase */}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>
          {/* <div className="space-y-1.5">
            <Label htmlFor="bio">About Me / Bio</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Share a bit about yourself, your interests, or your professional background. This may be displayed on your public profile if you are an instructor."
              rows={5}
              className={cn(
                errors.bio &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            <p className="text-xs text-muted-foreground">
              Brief description for your profile. URLs are hyperlinked.
            </p>
            {errors.bio && (
              <p className="text-xs text-destructive mt-1">
                {errors.bio.message}
              </p>
            )}
          </div> */}
          {/* TODO: Add Social Links inputs if they are part of UserProfile and editable by user */}
          {/* Ví dụ:
           <div className="space-y-1.5 pt-4 border-t dark:border-slate-700/50">
             <Label className="text-base font-medium">Social Profiles</Label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                // Input cho LinkedIn, Twitter, GitHub...
             </div>
           </div>
          */}
        </CardContent>
        <CardFooter className='border-t dark:border-slate-700/60 pt-6'>
          <Button
            type='submit'
            disabled={isLoading || (!isDirty && !avatarFile)}
            size='lg'
            className='h-11 px-6 text-base'
          >
            {isLoading ? (
              <Icons.spinner className='mr-2 h-5 w-5 animate-spin' />
            ) : (
              <Icons.save className='mr-2 h-5 w-5' />
            )}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
