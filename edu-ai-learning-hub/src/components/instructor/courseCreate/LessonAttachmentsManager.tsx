// src/components/instructor/courseCreate/LessonAttachmentsManager.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';
import {
  useAddLessonAttachment,
  useDeleteLessonAttachment,
} from '@/hooks/queries/lesson.queries';
import { Attachment } from '@/services/lesson.service';

interface LessonAttachmentsManagerProps {
  lessonId: number;
  initialAttachments?: Attachment[];
}

export const LessonAttachmentsManager: React.FC<
  LessonAttachmentsManagerProps
> = ({ lessonId, initialAttachments = [] }) => {
  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments);
  const attachmentFileRef = useRef<HTMLInputElement>(null);
  const { mutate: addAttachment, isPending: isUploading } =
    useAddLessonAttachment();
  const { mutate: deleteAttachment, isPending: isDeleting } =
    useDeleteLessonAttachment();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      addAttachment(
        { lessonId, file },
        {
          onSuccess: (newAttachment) => {
            setAttachments((prev) => [...prev, newAttachment]);
            toast.success('Attachment uploaded successfully!');
          },
          onError: (error) =>
            toast.error(error.message || 'Failed to upload attachment.'),
        }
      );
    }
  };

  const handleDelete = (attachmentId: number) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      deleteAttachment(
        { lessonId, attachmentId },
        {
          onSuccess: () => {
            setAttachments((prev) =>
              prev.filter((att) => att.attachmentId !== attachmentId)
            );
            toast.success('Attachment deleted.');
          },
          onError: (error) =>
            toast.error(error.message || 'Failed to delete attachment.'),
        }
      );
    }
  };

  return (
    <div className='space-y-4 border rounded-md p-4'>
      <div className='flex justify-between items-center'>
        <h3 className='font-semibold text-base flex items-center'>
          <Icons.file className='h-5 w-5 mr-2 text-primary' />
          Attachments
        </h3>
        <input
          type='file'
          ref={attachmentFileRef}
          onChange={handleFileSelect}
          className='hidden'
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => attachmentFileRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Icons.plus className='mr-2 h-4 w-4' />
          )}
          Add File
        </Button>
      </div>
      <div className='space-y-2'>
        {attachments.length > 0 ? (
          attachments.map((att) => (
            <div
              key={att.attachmentId}
              className='flex items-center justify-between p-2 border rounded bg-background text-sm'
            >
              <a
                href={att.fileUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 hover:text-primary truncate'
              >
                <Icons.paperclip className='h-4 w-4' />
                <span className='truncate'>{att.fileName}</span>
              </a>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-7 w-7'
                onClick={() => handleDelete(att.attachmentId!)}
                disabled={isDeleting}
              >
                <Icons.trash className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          ))
        ) : (
          <p className='text-sm text-center text-muted-foreground py-4'>
            No attachments for this lesson.
          </p>
        )}
      </div>
    </div>
  );
};
