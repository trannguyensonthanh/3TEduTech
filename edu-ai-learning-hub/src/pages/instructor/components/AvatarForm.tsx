// src/pages/instructor/components/AvatarForm.tsx
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useMyInstructorProfile } from '@/hooks/queries/instructor.queries';
import { useUpdateMyAvatar } from '@/hooks/queries/user.queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export const AvatarForm = () => {
  const { data: profile, isLoading: isLoadingProfile } =
    useMyInstructorProfile();
  const { mutate: updateAvatar, isPending: isUploading } = useUpdateMyAvatar();

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set avatar ban đầu từ profile
    if (profile?.avatarUrl) {
      setPreview(profile.avatarUrl);
    }
  }, [profile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error('Image size must be less than 2MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = () => {
    if (selectedFile) {
      updateAvatar(selectedFile, {
        onSuccess: () => {
          toast.success('Avatar updated successfully!');
          setSelectedFile(null); // Reset file selection
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update avatar.');
        },
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  if (isLoadingProfile) {
    return (
      <div className='flex items-center justify-center h-48'>
        <Icons.spinner className='h-8 w-8 animate-spin text-muted-foreground mr-2' />
        <span className='text-muted-foreground text-lg'>Loading avatar...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          A professional photo helps you build trust with students.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-6'>
          <Avatar className='h-24 w-24'>
            <AvatarImage src={preview || undefined} alt={profile?.fullName} />
            <AvatarFallback className='text-3xl'>
              {profile?.fullName ? getInitials(profile.fullName) : 'GV'}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-2'>
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileChange}
              className='hidden'
              accept='image/png, image/jpeg, image/gif'
            />
            <Button variant='outline' size='sm' onClick={handleUploadClick}>
              <Icons.upload className='mr-2 h-4 w-4' />
              Choose Image
            </Button>
            {selectedFile && (
              <Button
                size='sm'
                onClick={handleSaveChanges}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icons.save className='mr-2 h-4 w-4' />
                )}
                Save Avatar
              </Button>
            )}
            <p className='text-xs text-muted-foreground'>
              PNG, JPG, GIF up to 2MB. Recommended 400x400px.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
