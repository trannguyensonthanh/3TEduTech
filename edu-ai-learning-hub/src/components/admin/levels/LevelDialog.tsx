import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Level } from '@/services/level.service';
import { useTranslation } from 'react-i18next';

interface LevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: Level | null;
  onSubmit: (data: { name: string }) => void;
}

const LevelDialog: React.FC<LevelDialogProps> = ({
  open,
  onOpenChange,
  level,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const isEditing = !!level;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: level?.levelName || '',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: level?.levelName || '',
      });
    }
  }, [open, level, reset]);

  const onFormSubmit = (data: { name: string }) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-center text-xl text-primary'>
            {isEditing ? t('levelDialog.titleEdit') : t('levelDialog.titleAdd')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-sm font-medium'>
              {t('levelDialog.levelName')}
            </Label>
            <Input
              id='name'
              {...register('name', { required: t('levelDialog.nameRequired') })}
              className='w-full'
            />
            {errors.name && (
              <p className='text-sm text-destructive'>{errors.name.message}</p>
            )}
          </div>
          <DialogFooter className='pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='w-full sm:w-auto'
            >
              {t('levelDialog.cancel')}
            </Button>
            <Button
              type='submit'
              className='w-full sm:w-auto bg-primary hover:bg-primary/90'
            >
              {isEditing ? t('levelDialog.update') : t('levelDialog.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LevelDialog;
