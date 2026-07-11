// src/components/courseLearn/discussion/DiscussionPostItem.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Post } from '@/services/discussion.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';

interface DiscussionPostItemProps {
  post: Post;
  courseInstructorId: number;
  currentUserId?: number;
  onReply: (parentPost: Post) => void;
  onDeleteRequest: (postId: number) => void;
  onEditRequest?: (post: Post) => void;
}

export const DiscussionPostItem: React.FC<DiscussionPostItemProps> = ({
  post,
  courseInstructorId,
  currentUserId,
  onReply,
  onDeleteRequest,
  onEditRequest,
}) => {
  const isAuthor = currentUserId === Number(post.accountId);
  const isInstructorPost = post.accountId === courseInstructorId;
  console.log('DiscussionPostItem', {
    post,
    courseInstructorId,
    currentUserId,
    isAuthor,
    isInstructorPost,
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start space-x-3 py-4',
        post.parentPostId && 'ml-6 sm:ml-10 pl-4 border-l-2'
      )}
    >
      <Avatar className='h-9 w-9 border'>
        <AvatarImage
          src={post.authorAvatar || undefined}
          alt={post.authorFullName || 'User'}
        />
        <AvatarFallback>
          {post.authorFullName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className='flex-1'>
        <div className='flex items-center justify-between mb-1'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold'>{post.authorFullName}</span>
            {isInstructorPost && (
              <Badge variant='secondary' className='text-xs'>
                Instructor
              </Badge>
            )}
          </div>
          <span
            className='text-xs text-muted-foreground'
            title={format(new Date(post.createdAt), 'PPpp')}
          >
            {formatDistanceToNowStrict(new Date(post.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div
          className='prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed'
          dangerouslySetInnerHTML={{ __html: post.postText }}
        />
        <div className='mt-2 flex items-center gap-1'>
          {!post.parentPostId && (
            <Button
              variant='ghost'
              size='sm'
              className='text-xs text-muted-foreground hover:text-primary'
              onClick={() => onReply(post)}
            >
              <Icons.reply size={14} className='mr-1' /> Reply
            </Button>
          )}
          {isAuthor && (
            <>
              <Button
                variant='ghost'
                size='sm'
                className='text-xs text-muted-foreground hover:text-blue-600'
                onClick={() => onEditRequest && onEditRequest(post)}
              >
                <Icons.edit size={14} className='mr-1' /> Edit
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='text-xs text-muted-foreground hover:text-destructive'
                onClick={() => onDeleteRequest(post.postId)}
              >
                <Icons.trash size={14} className='mr-1' /> Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
