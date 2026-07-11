// src/components/courseLearn/tabs/DiscussionsTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useInView } from 'react-intersection-observer';
import {
  useInfiniteDiscussionThreads,
  useCreateDiscussionThread,
  useInfiniteDiscussionPosts,
  useCreateDiscussionPost,
  useDeleteDiscussionPost,
  useUpdateDiscussionPost,
  discussionKeys,
} from '@/hooks/queries/discussion.queries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/common/Icons';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
import { DiscussionPostForm } from '../discussion/DiscussionPostForm';
import { DiscussionPostItem } from '../discussion/DiscussionPostItem';

// Types & Utils
import { Thread, Post } from '@/services/discussion.service';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';

interface DiscussionsTabProps {
  lessonId: number;
  courseId: number;
  courseInstructorId: number;
}

export const DiscussionsTab: React.FC<DiscussionsTabProps> = ({
  lessonId,
  courseId,
  courseInstructorId,
}) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const queryClient = useQueryClient();

  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadText, setNewThreadText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const { mutate: updatePost, isPending: isUpdatingPost } =
    useUpdateDiscussionPost();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editText, setEditText] = useState('');

  // --- Thread Fetching ---
  const threadQueryParams = useMemo(
    () => ({ courseId, lessonId, limit: 15 }),
    [courseId, lessonId]
  );
  const {
    data: threadsPages,
    fetchNextPage: fetchNextThreads,
    hasNextPage: hasNextThreads,
    isFetchingNextPage: isFetchingNextThreads,
    isLoading: isLoadingThreads,
  } = useInfiniteDiscussionThreads(threadQueryParams, { enabled: !!userData });
  const allThreads = useMemo(
    () => threadsPages?.pages.flatMap((p) => p.threads) || [],
    [threadsPages]
  );

  // --- Post Fetching ---
  const postQueryParams = useMemo(
    () => ({ threadId: selectedThread?.threadId, limit: 20 }),
    [selectedThread]
  );
  const {
    data: postsPages,
    fetchNextPage: fetchNextPosts,
    hasNextPage: hasNextPosts,
    isFetchingNextPage: isFetchingNextPosts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useInfiniteDiscussionPosts(postQueryParams, {
    enabled: !!selectedThread,
  });
  const allPosts = useMemo(
    () => postsPages?.pages.flatMap((p) => p.posts) || [],
    [postsPages]
  );

  // --- Mutations ---
  const { mutate: createThread } = useCreateDiscussionThread();
  const { mutate: createPost, isPending: isSubmittingPost } =
    useCreateDiscussionPost();
  const { mutate: deletePost, isPending: isDeletingPost } =
    useDeleteDiscussionPost();

  // --- Infinite Scroll ---
  const { ref: threadsLoadMoreRef } = useInView({
    onChange: (inView) => inView && hasNextThreads && fetchNextThreads(),
  });
  const { ref: postsLoadMoreRef } = useInView({
    onChange: (inView) => inView && hasNextPosts && fetchNextPosts(),
  });

  // --- Handlers ---
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadText.trim()) return;
    createThread(
      { courseId, lessonId, title: newThreadTitle },
      {
        onSuccess: (newThread) => {
          createPost(
            { threadId: newThread.threadId, data: { text: newThreadText } },
            {
              onSuccess: () => {
                toast.success(t('lessonTabs.toast.discussionStarted'));
                setShowNewThreadForm(false);
                setNewThreadTitle('');
                setNewThreadText('');
                queryClient.invalidateQueries({
                  queryKey: discussionKeys.threads(threadQueryParams),
                });
              },
            }
          );
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  const handleCreatePost = (text: string, parentPostId?: number) => {
    if (!selectedThread) return;
    createPost(
      { threadId: selectedThread.threadId, data: { text, parentPostId } },
      {
        onSuccess: () => {
          toast.success(
            replyingTo
              ? t('lessonTabs.toast.replyPosted')
              : t('lessonTabs.toast.commentPosted')
          );
          setReplyingTo(null);
          refetchPosts(); // Refetch posts for the current thread
          queryClient.invalidateQueries({
            queryKey: discussionKeys.threads(threadQueryParams),
          }); // Invalidate thread list to update post count
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  const handleDeletePost = () => {
    if (!postToDelete || !selectedThread) return;
    deletePost(
      { postId: postToDelete.postId, threadId: selectedThread.threadId },
      {
        onSuccess: () => {
          toast.success(t('lessonTabs.toast.commentDeleted'));
          setPostToDelete(null);
          refetchPosts();
          queryClient.invalidateQueries({
            queryKey: discussionKeys.threads(threadQueryParams),
          });
        },
        onError: (err) => toast.error((err as Error).message),
        onSettled: () => setPostToDelete(null),
      }
    );
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditText(post.postText);
  };

  const handleUpdatePost = () => {
    if (!editingPost || !editText.trim()) return;
    updatePost(
      { postId: editingPost.postId, data: { text: editText } },
      {
        onSuccess: () => {
          toast.success(t('lessonTabs.toast.commentUpdated'));
          setEditingPost(null);
          setEditText('');
          refetchPosts();
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  if (!userData)
    return (
      <p className='p-4 text-center text-muted-foreground'>
        {t('lessonTabs.loginToDiscuss')}
      </p>
    );
  if (isLoadingThreads)
    return (
      <div className='p-4 text-center'>
        <Icons.spinner className='h-6 w-6 animate-spin mx-auto' />
      </div>
    );

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-full'>
      {/* Left: Thread List */}
      <div className='md:col-span-1 lg:col-span-1 border-r pr-4 flex flex-col h-full'>
        <div className='flex justify-between items-center mb-3'>
          <h3 className='font-semibold'>{t('lessonTabs.qna')}</h3>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setShowNewThreadForm(!showNewThreadForm)}
          >
            <Icons.plus className='h-4 w-4 mr-2' />{' '}
            {t('lessonTabs.startNewDiscussion')}
          </Button>
        </div>
        <ScrollArea className='flex-grow'>
          {showNewThreadForm && (
            <form
              onSubmit={handleCreateThread}
              className='p-3 mb-3 bg-muted rounded-md space-y-2'
            >
              <Input
                placeholder={t('lessonTabs.newThreadTitlePlaceholder')}
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                required
              />
              <Textarea
                placeholder={t('lessonTabs.newThreadTextPlaceholder')}
                value={newThreadText}
                onChange={(e) => setNewThreadText(e.target.value)}
                rows={3}
                required
              />
              <div className='flex justify-end'>
                <Button size='default' type='submit'>
                  {t('lessonTabs.postDiscussion')}
                </Button>
              </div>
            </form>
          )}
          {allThreads.map((thread) => (
            <button
              key={thread.threadId}
              onClick={() => setSelectedThread(thread)}
              className={cn(
                'w-full text-left p-3 rounded-md hover:bg-muted',
                selectedThread?.threadId === thread.threadId && 'bg-muted'
              )}
            >
              <p className='font-semibold text-sm line-clamp-2'>
                {thread.title}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                {thread.creatorFullName} •{' '}
                {formatDistanceToNowStrict(new Date(thread.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </button>
          ))}
          <div ref={threadsLoadMoreRef} className='text-center'>
            {isFetchingNextThreads && (
              <Icons.spinner className='h-5 w-5 animate-spin my-3 mx-auto' />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Post List */}
      <div className='md:col-span-2 lg:col-span-3 flex flex-col h-full'>
        {selectedThread ? (
          <>
            <div className='flex-grow overflow-y-auto'>
              <ScrollArea className='h-[calc(100vh-350px)] pr-2'>
                <h3 className='font-bold text-lg mb-4'>
                  {selectedThread.title}
                </h3>
                {isLoadingPosts ? (
                  <div className='p-4 text-center'>
                    <Icons.spinner className='h-6 w-6 animate-spin mx-auto' />
                  </div>
                ) : (
                  allPosts.map((post) =>
                    editingPost && editingPost.postId === post.postId ? (
                      <div key={post.postId} className='mb-4'>
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className='mb-2'
                        />
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={handleUpdatePost}
                            disabled={isUpdatingPost || !editText.trim()}
                          >
                            {isUpdatingPost ? (
                              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                            ) : null}
                            {t('lessonTabs.saveEdit', 'Save')}
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => setEditingPost(null)}
                          >
                            {t('lessonTabs.cancelEdit', 'Cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <DiscussionPostItem
                        key={post.postId}
                        post={post}
                        courseInstructorId={courseInstructorId}
                        currentUserId={Number(userData?.id)}
                        onReply={setReplyingTo}
                        onDeleteRequest={() => setPostToDelete(post)}
                        onEditRequest={handleEditPost}
                      />
                    )
                  )
                )}
                <div ref={postsLoadMoreRef} className='text-center'>
                  {isFetchingNextPosts && (
                    <Icons.spinner className='h-5 w-5 animate-spin my-3 mx-auto' />
                  )}
                </div>
              </ScrollArea>
            </div>
            <DiscussionPostForm
              threadId={selectedThread.threadId}
              replyingTo={replyingTo}
              isSubmitting={isSubmittingPost}
              onSubmit={handleCreatePost}
              onCancelReply={() => setReplyingTo(null)}
            />
          </>
        ) : (
          <div className='flex items-center justify-center h-full text-center text-muted-foreground'>
            Select a discussion to view.
          </div>
        )}
      </div>
      <ConfirmationDialog
        open={!!postToDelete}
        onOpenChange={() => setPostToDelete(null)}
        onConfirm={handleDeletePost}
        isConfirming={isDeletingPost}
        title={t('lessonTabs.deleteCommentTitle')}
        description={t('lessonTabs.deleteConfirmDesc', { type: 'comment' })}
        confirmVariant='destructive'
      />
    </div>
  );
};
