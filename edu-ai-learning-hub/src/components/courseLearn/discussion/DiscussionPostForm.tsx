// src/components/courseLearn/discussion/DiscussionPostForm.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/common/Icons';
import { Post } from '@/services/discussion.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface DiscussionPostFormProps {
  threadId: number;
  replyingTo: Post | null;
  isSubmitting: boolean;
  onSubmit: (text: string, parentPostId?: number) => void;
  onCancelReply?: () => void;
}

export const DiscussionPostForm: React.FC<DiscussionPostFormProps> = ({
  threadId,
  replyingTo,
  isSubmitting,
  onSubmit,
  onCancelReply,
}) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo) {
      setText(`@${replyingTo.authorFullName} `);
      textareaRef.current?.focus();
    } else {
      setText('');
    }
  }, [replyingTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text, replyingTo?.postId);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex items-start gap-3 pt-4 border-t'
    >
      <Avatar className='h-9 w-9 border'>
        <AvatarImage src={userData?.avatarUrl || undefined} />
        <AvatarFallback>
          {userData?.fullName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className='flex-1'>
        {replyingTo && (
          <div className='text-xs text-muted-foreground bg-muted p-2 rounded-t-md border-b'>
            <span className='font-semibold'>
              {t('lessonTabs.replyingTo', { name: replyingTo.authorFullName })}
            </span>
            <p className='line-clamp-2 italic'>"{replyingTo.postText}"</p>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            replyingTo
              ? t('lessonTabs.writeYourReply')
              : t('lessonTabs.shareYourThoughts')
          }
          rows={replyingTo ? 3 : 2}
          className={`text-sm ${replyingTo ? 'rounded-t-none' : ''}`}
        />
        <div className='flex justify-end gap-2 mt-2'>
          {replyingTo && onCancelReply && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onCancelReply}
            >
              {t('lessonTabs.cancelReply')}
            </Button>
          )}
          <Button
            type='submit'
            size='sm'
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {replyingTo ? t('lessonTabs.postReply') : 'Post Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
};
