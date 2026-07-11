// src/components/instructor/courseCreate/LessonSubtitlesManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';
import { useLanguages } from '@/hooks/queries/language.queries';
import {
  useSubtitles,
  useAddSubtitleByUrl,
  useDeleteSubtitle,
  useSetPrimarySubtitle,
} from '@/hooks/queries/subtitle.queries';
import { Subtitle } from '@/services/subtitle.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LessonSubtitlesManagerProps {
  lessonId: number;
}

export const LessonSubtitlesManager: React.FC<LessonSubtitlesManagerProps> = ({
  lessonId,
}) => {
  const { data: languagesData } = useLanguages({ isActive: true });
  const { data: subtitlesData, isLoading: isLoadingSubtitles } = useSubtitles(
    lessonId,
    { enabled: !!lessonId }
  );
  console.log('LessonSubtitlesManager rendered with lessonId:', subtitlesData);
  const [newSubtitleUrl, setNewSubtitleUrl] = useState('');
  const [newSubtitleLang, setNewSubtitleLang] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const { mutate: addSubtitle, isPending: isAdding } = useAddSubtitleByUrl();
  const { mutate: deleteSubtitle, isPending: isDeleting } = useDeleteSubtitle();
  const { mutate: setPrimary, isPending: isSettingPrimary } =
    useSetPrimarySubtitle();

  const openDeleteDialog = (subtitleId: number) => {
    setPendingDeleteId(subtitleId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const handleAddSubtitle = () => {
    if (!newSubtitleLang || !newSubtitleUrl) {
      toast.error('Language and URL are required.');
      return;
    }
    addSubtitle(
      {
        lessonId,
        data: {
          languageCode: newSubtitleLang,
          subtitleUrl: newSubtitleUrl,
          isDefault,
        },
      },
      {
        onSuccess: () => {
          toast.success('Subtitle added.');
          setNewSubtitleUrl('');
          setNewSubtitleLang('');
          setIsDefault(false);
        },
        onError: (err) => toast.error(err.message || 'Failed to add subtitle.'),
      }
    );
  };

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      deleteSubtitle(
        { lessonId, subtitleId: pendingDeleteId },
        {
          onSuccess: () => {
            toast.success('Subtitle deleted.');
            closeDeleteDialog();
          },
          onError: (err) => {
            toast.error(err.message || 'Failed to delete subtitle.');
            closeDeleteDialog();
          },
        }
      );
    }
  };

  const handleSetPrimary = (subtitleId: number) => {
    setPrimary(
      { lessonId, subtitleId },
      {
        onSuccess: () => toast.success('Default subtitle updated.'),
        onError: (err) => toast.error(err.message || 'Failed to set default.'),
      }
    );
  };

  if (isLoadingSubtitles) {
    return (
      <div className='p-4 text-center'>
        <Icons.spinner className='h-5 w-5 animate-spin mx-auto' />
      </div>
    );
  }

  return (
    <div className='space-y-4 border rounded-md p-4'>
      <h3 className='font-semibold text-base flex items-center'>
        <Icons.captions className='h-5 w-5 mr-2 text-primary' />
        Subtitles
      </h3>
      {/* Add Form */}
      <div className='space-y-3 border-b pb-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Select value={newSubtitleLang} onValueChange={setNewSubtitleLang}>
            <SelectTrigger>
              <SelectValue placeholder='Select language...' />
            </SelectTrigger>
            <SelectContent>
              {languagesData?.languages.map((lang) => (
                <SelectItem key={lang.languageCode} value={lang.languageCode}>
                  {lang.languageName} ({lang.languageCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder='Paste .vtt file URL here...'
            value={newSubtitleUrl}
            onChange={(e) => setNewSubtitleUrl(e.target.value)}
          />
        </div>
        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='is-default-sub'
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(!!checked)}
            />
            <Label
              htmlFor='is-default-sub'
              className='text-sm font-normal cursor-pointer'
            >
              Set as default
            </Label>
          </div>
          <Button
            type='button'
            size='sm'
            onClick={handleAddSubtitle}
            disabled={isAdding}
          >
            {isAdding ? (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Icons.plus className='mr-2 h-4 w-4' />
            )}{' '}
            Add Subtitle
          </Button>
        </div>
      </div>
      {/* List */}
      <div className='space-y-2'>
        {subtitlesData && subtitlesData.subtitles.length > 0 ? (
          subtitlesData.subtitles.map((sub) => (
            <div
              key={sub.subtitleId}
              className='flex items-center justify-between p-2 border rounded bg-background text-sm'
            >
              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant={sub.isDefault ? 'secondary' : 'ghost'}
                  size='sm'
                  className='text-xs'
                  onClick={() => handleSetPrimary(sub.subtitleId!)}
                  disabled={sub.isDefault || isSettingPrimary}
                >
                  {sub.isDefault ? (
                    <Icons.checkCircle className='h-4 w-4 mr-2 text-green-500' />
                  ) : (
                    <div className='h-4 w-4 mr-2' />
                  )}
                  {sub.isDefault ? 'Default' : 'Set Default'}
                </Button>
                <div className='flex flex-col'>
                  <span className='font-medium'>
                    {
                      languagesData?.languages.find(
                        (l) => l.languageCode === sub.languageCode
                      )?.languageName
                    }{' '}
                    ({sub.languageCode})
                  </span>
                  <a
                    href={sub.subtitleUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs text-blue-500 hover:underline truncate max-w-[200px]'
                  >
                    {sub.subtitleUrl}
                  </a>
                </div>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-7 w-7'
                onClick={() => openDeleteDialog(sub.subtitleId!)}
                disabled={isDeleting}
              >
                <Icons.trash className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          ))
        ) : (
          <p className='text-sm text-center text-muted-foreground py-4'>
            No subtitles added.
          </p>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      {/* Dialog state and component */}

      {/* Replace handleDelete in the list with openDeleteDialog(sub.subtitleId!) */}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subtitle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subtitle? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
