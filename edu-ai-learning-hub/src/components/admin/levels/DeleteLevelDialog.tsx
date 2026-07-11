import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  levelName: string;
}

const DeleteLevelDialog: React.FC<DeleteLevelDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  levelName,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader className='space-y-3'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
            <AlertCircle className='h-6 w-6 text-red-600' />
          </div>
          <DialogTitle className='text-center text-xl'>
            {t('deleteLevelDialog.title')}
          </DialogTitle>
          <DialogDescription className='text-center'>
            {t('deleteLevelDialog.desc', { levelName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='sm:justify-center gap-2 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='w-full sm:w-auto'
          >
            {t('deleteLevelDialog.cancel')}
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={onConfirm}
            className='w-full sm:w-auto'
          >
            {t('deleteLevelDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteLevelDialog;
