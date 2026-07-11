import React from 'react';
import { useTranslation } from 'react-i18next';
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

interface DeleteSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  skillName: string;
}

const DeleteSkillDialog: React.FC<DeleteSkillDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  skillName,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteSkillDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deleteSkillDialog.desc', { skillName })}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <Alert variant='destructive'>
            <AlertTitle>{t('deleteSkillDialog.warning')}</AlertTitle>
            <AlertDescription>
              {t('deleteSkillDialog.warningDesc')}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('deleteSkillDialog.cancel')}
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            {t('deleteSkillDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSkillDialog;
