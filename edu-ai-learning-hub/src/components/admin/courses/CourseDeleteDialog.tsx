import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface CourseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const CourseDeleteDialog: React.FC<CourseDeleteDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('courseDelete.title', 'Delete Course')}</DialogTitle>
          <DialogDescription>
            {t(
              'courseDelete.confirm',
              'Are you sure you want to delete this course? This action cannot be undone.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <Alert variant='destructive'>
            <AlertTitle>{t('courseDelete.warning', 'Warning')}</AlertTitle>
            <AlertDescription>
              {t(
                'courseDelete.description',
                'Deleting this course will remove all associated content, enrollments, and revenue data. Students who have purchased this course will lose access to it.'
              )}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('courseDelete.cancel', 'Cancel')}
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            {t('courseDelete.delete', 'Delete Course')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDeleteDialog;
