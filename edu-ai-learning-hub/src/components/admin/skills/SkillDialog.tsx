import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skill } from '@/services/skill.service';
import { useTranslation } from 'react-i18next';

const skillFormSchema = z.object({
  skillName: z
    .string()
    .min(2, {
      message: 'Skill name must be at least 2 characters.',
    })
    .max(100, {
      message: 'Skill name must not exceed 100 characters.',
    }),
  description: z
    .string()
    .max(500, {
      message: 'Description must not exceed 500 characters.',
    })
    .nullable()
    .optional(),
});

type SkillFormValues = z.infer<typeof skillFormSchema>;

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: Skill | null;
  onSubmit: (data: SkillFormValues) => void;
}

const SkillDialog: React.FC<SkillDialogProps> = ({
  open,
  onOpenChange,
  skill,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      skillName: skill?.skillName || '',
      description: skill?.description || '',
    },
  });

  React.useEffect(() => {
    if (skill) {
      form.reset({
        skillName: skill.skillName,
        description: skill.description,
      });
    } else {
      form.reset({
        skillName: '',
        description: '',
      });
    }
  }, [skill, form]);

  const handleSubmit = (data: SkillFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {skill ? t('skillDialog.titleEdit') : t('skillDialog.titleAdd')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='skillName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('skillDialog.skillName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('skillDialog.placeholderName')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('skillDialog.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('skillDialog.placeholderDesc')}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit'>
                {skill ? t('skillDialog.update') : t('skillDialog.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SkillDialog;
