import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '../common/Icons';
import { useToast } from '@/hooks/use-toast';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompleteFacebookRegistrationMutation } from '@/hooks/queries/auth.queries';
import { useTranslation } from 'react-i18next';

interface CompleteRegistrationModalProps {
  open: boolean; // Trạng thái mở modal
  facebookAccessToken: string; // Token lấy từ callback Facebook
  onClose: () => void; // Hàm đóng modal
  onSuccess: () => void; // Hàm xử lý sau khi gửi yêu cầu thành công (ví dụ: hiển thị thông báo check mail)
}

const EmailCollectionModal = ({
  open,
  facebookAccessToken,
  onClose,
  onSuccess,
}: CompleteRegistrationModalProps) => {
  const { t } = useTranslation();
  // Schema cho form nhập email
  const emailSchema = z.object({
    email: z
      .string()
      .email(t('emailModal.error.invalid'))
      .min(1, t('emailModal.error.required')),
  });
  type EmailFormData = z.infer<typeof emailSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const { toast } = useToast();

  const completeMutation = useCompleteFacebookRegistrationMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: t('emailModal.toast.errorTitle'),
        description: error.message || t('emailModal.toast.errorDesc'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit: SubmitHandler<EmailFormData> = (data) => {
    completeMutation.mutate({
      accessToken: facebookAccessToken,
      email: data.email,
    });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('emailModal.title')}</DialogTitle>
          <DialogDescription>{t('emailModal.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('emailModal.label.email')}</Label>
              <Input
                id='email'
                type='email'
                placeholder={t('emailModal.placeholder.email')}
                {...register('email')}
              />
              {errors.email && (
                <p style={{ color: 'red' }}>{errors.email.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              {t('emailModal.cancel')}
            </Button>
            <Button type='submit' disabled={completeMutation.isPending}>
              {completeMutation.isPending ? (
                <>
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                  {t('emailModal.processing')}
                </>
              ) : (
                t('emailModal.continue')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailCollectionModal;
