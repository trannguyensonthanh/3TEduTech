/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import _ from 'lodash';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { toast } from 'sonner';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InstructorLayout from '@/components/layout/InstructorLayout';
import FullScreenLoader from '@/components/common/FullScreenLoader';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
import { Icons } from '@/components/common/Icons';

// Tabs & Child Components
import BasicInfoTab from '@/components/instructor/courseCreate/BasicInfoTab';
import DetailsTab from '@/components/instructor/courseCreate/DetailsTab';
import MediaTab from '@/components/instructor/courseCreate/MediaTab';
import PricingTab from '@/components/instructor/courseCreate/PricingTab';
import CurriculumTab from '@/components/instructor/courseCreate/CurriculumTab';

// Hooks, Services & Types
import {
  useCourseDetailBySlug,
  useUpdateCourse,
  useSubmitCourseForApproval,
  useDeleteCourse,
  useCreateCourseUpdateSession,
  useCancelCourseUpdateSession,
  useUpdateCourseThumbnail,
  courseKeys,
} from '@/hooks/queries/course.queries';
import { useCategories } from '@/hooks/queries/category.queries';
import { useLevels } from '@/hooks/queries/level.queries';
import { useLanguages } from '@/hooks/queries/language.queries';
import {
  courseEditSchema,
  TCourseEditSchema,
} from '@/lib/validators/courseEditValidator';
import { CourseStatusId } from '@/types/common.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CourseEditHeader } from '@/pages/instructor/components/CourseEditHeader';
import { useQueryClient } from '@tanstack/react-query';
import TokenService from '@/services/token.service';
import { LiveNotification } from '@/components/common/LiveNotification';

const CourseEdit: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const queryClient = useQueryClient();
  // Dialog states
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // State cho media files (không thuộc form)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // --- Data Fetching ---
  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourseDetailBySlug(courseSlug);
  const { data: categoriesData, isLoading: catLoading } = useCategories({
    limit: 0,
  });
  const { data: levelsData, isLoading: levelLoading } = useLevels();
  const { data: languagesData, isLoading: langLoading } = useLanguages({
    isActive: true,
  });

  // --- Mutations ---
  const { mutate: updateCourse, isPending: isUpdatingCourse } =
    useUpdateCourse();
  const { mutate: updateThumbnail, isPending: isUploadingThumb } =
    useUpdateCourseThumbnail();
  const { mutate: submitForApproval, isPending: isSubmitting } =
    useSubmitCourseForApproval();
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();
  const { mutate: createUpdateSession, isPending: isCreatingUpdate } =
    useCreateCourseUpdateSession();
  const { mutate: cancelUpdateSession, isPending: isCancellingUpdate } =
    useCancelCourseUpdateSession();
  const isProcessing =
    isUpdatingCourse || isUploadingThumb || isSubmitting || isDeleting;
  const [liveNotification, setLiveNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    actionText?: string;
    onActionClick?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  // --- Form Setup ---
  const form = useForm<TCourseEditSchema>({
    resolver: zodResolver(courseEditSchema),
    mode: 'onChange',
  });
  console.log('CourseEdit component rendered with courseSlug:', course);
  useEffect(() => {
    if (!course?.courseId || !TokenService.getLocalAccessToken()) return;

    const ctrl = new AbortController();
    const API_BASE_URL = 'http://localhost:5000/v1';

    fetchEventSource(`${API_BASE_URL}/events/subscribe`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TokenService.getLocalAccessToken()}`,
        Accept: 'text/event-stream',
      },
      signal: ctrl.signal,
      onopen: async (response) => {
        if (
          response.ok &&
          response.headers.get('content-type') === 'text/event-stream'
        ) {
          console.log('[SSE] Connection to server opened.');
        } else {
          console.error(
            '[SSE] Failed to connect:',
            response.status,
            response.statusText
          );
        }
      },
      onmessage(event) {
        // event.event là tên event, event.data là payload
        if (event.event === 'course_reviewed') {
          console.log("[SSE] Received 'course_reviewed' event:", event.data);
          try {
            const eventData = JSON.parse(event.data);
            if (Number(eventData.courseId) === Number(course.courseId)) {
              toast.success('Your course has been reviewed by an admin!', {
                description: `Status changed to ${eventData.newStatus}. Please review any feedback.`,
                duration: 10000,
              });

              // Invalidate query để React Query tự động fetch lại dữ liệu mới nhất
              queryClient.invalidateQueries({
                queryKey: courseKeys.detailById(course.courseId),
              });
              queryClient.invalidateQueries({
                queryKey: courseKeys.detailBySlug(course.slug),
              });

              // Nếu slug thay đổi, cũng invalidate slug mới để cache
              if (eventData.courseSlug) {
                queryClient.invalidateQueries({
                  queryKey: courseKeys.detailBySlug(eventData.courseSlug),
                });
              }
            }
          } catch (e) {
            console.error('[SSE] Error parsing event data:', e);
          }
        } else if (event.event === 'new_notification') {
          console.log(
            "[SSE] Received 'new_notification' event: ----------------------------------------->",
            event
          );
          try {
            const eventData = JSON.parse(event.data);
            const notification = eventData.notification.message;

            setLiveNotification({
              isOpen: true,
              title: 'New Notification',
              message: notification,
              actionText: 'Chuyển hướng về danh sách khóa học',
              onActionClick: () => navigate('/instructor/courses'),
            });
          } catch (e) {
            console.error('[SSE] Error parsing notification event data:', e);
          }
        } else {
          // Log các event khác nếu cần
          console.log('[SSE] Received event:', event);
        }
      },
      onerror(err) {
        console.error('[SSE] EventSource failed:', err);
        throw err;
      },
    });

    return () => {
      console.log('[SSE] Closing event source connection.');
      ctrl.abort(); // Hủy kết nối khi component unmount
    };
  }, [course?.courseId, course?.slug, queryClient]);

  // -- Khởi tạo Form với dữ liệu từ API --
  useEffect(() => {
    if (course) {
      const formData = {
        courseId: Number(course.courseId),
        slug: course.slug,
        courseName: course.courseName,
        shortDescription: course.shortDescription || '',
        fullDescription: course.fullDescription ?? '',
        requirements: course.requirements ?? '',
        learningOutcomes: course.learningOutcomes ?? '',
        categoryId: course.categoryId || undefined,
        levelId: course.levelId || undefined,
        language:
          course.language === 'vi' || course.language === 'en'
            ? (course.language as 'vi' | 'en')
            : 'en',
        originalPrice:
          course.pricing?.base?.originalPrice !== undefined &&
          course.pricing?.base?.originalPrice !== null
            ? course.pricing.base.originalPrice
            : 0,
        discountedPrice:
          course.pricing?.base?.discountedPrice !== undefined &&
          course.pricing?.base?.discountedPrice !== null
            ? course.pricing.base.discountedPrice
            : null,
        introVideoUrl: course.introVideoUrl || '',
        isFeatured: course.isFeatured ?? false,
      };
      // Nếu là lần đầu load (form chưa dirty), reset toàn bộ form để đồng bộ dữ liệu backend
      if (!form.formState.isDirty) {
        form.reset(formData, { keepDirty: false });
      } else {
        // Nếu đã có thay đổi, chỉ setValue từng trường để không mất dữ liệu đang nhập
        Object.entries(formData).forEach(([key, value]) => {
          form.setValue(key as any, value, { shouldDirty: false });
        });
      }
    }
  }, [course, form]);

  // --- HÀM LƯU THAY ĐỔI CHÍNH ---
  const handleSaveChanges = (formData: TCourseEditSchema) => {
    if (!course) return;

    const promise = new Promise((resolve, reject) => {
      (async () => {
        try {
          // Bước 1: Lưu thông tin khóa học nếu form có thay đổi
          if (form.formState.isDirty) {
            const { courseId, ...payload } = courseEditSchema.parse(formData);
            await updateCourse(
              {
                courseId: Number(course.courseId),
                data: payload, // payload đã có isFeatured
              },
              {
                onSuccess: (data: any) => {
                  console.log('Course updated successfully:', data);
                  // Nếu API trả về slug mới, cập nhật URL
                  if (data?.slug && data?.slug !== course.slug) {
                    navigate(`/instructor/courses/${data?.slug}/edit`, {
                      replace: true,
                    });
                  }
                },
                onError: (err: any) => {
                  toast.error(
                    err?.message ||
                      'An error occurred while updating the course.'
                  );
                },
              }
            );
          }

          // Bước 2: Upload thumbnail nếu có file mới
          if (thumbnailFile) {
            await updateThumbnail({
              courseId: course.courseId,
              file: thumbnailFile,
            });
          }

          resolve('All changes saved successfully!');
        } catch (err) {
          reject(err);
        }
      })();
    });

    toast.promise(promise, {
      loading: 'Saving changes...',
      success: (message) => {
        setThumbnailFile(null); // Reset file sau khi thành công
        refetch(); // Fetch lại dữ liệu mới nhất để reset form state và isDirty
        return message as string;
      },
      error: (err: any) => err.message || 'An error occurred while saving.',
    });
  };
  const handleEditPublishedCourse = () => {
    if (course && course.statusId === 'PUBLISHED') {
      createUpdateSession(course.courseId, {
        onSuccess: (data) => {
          toast.success(data.message);
          navigate(`/instructor/courses/${data.updateCourse.slug}/edit`);
        },
        onError: (err) =>
          toast.error(
            (err as Error).message || 'Could not create update session.'
          ),
      });
    }
  };

  // --- Action Handlers ---
  const confirmSubmit = () => {
    if (!course) return;
    submitForApproval(
      { courseId: course.courseId },
      {
        onSuccess: () => {
          toast.success('Course submitted for approval successfully!');
          refetch();
          setIsSubmitConfirmOpen(false);
        },
        onError: (err) =>
          toast.error((err as Error).message || 'Submission failed.'),
      }
    );
  };

  const confirmDelete = () => {
    if (!course) return;
    deleteCourse(course.courseId, {
      onSuccess: () => {
        toast.success(`Course "${course.courseName}" has been deleted.`);
        navigate('/instructor/courses');
      },
      onError: (err) =>
        toast.error((err as Error).message || 'Could not delete course.'),
    });
  };
  const confirmCancelUpdate = () => {
    if (course?.courseId) {
      cancelUpdateSession(course.courseId, {
        onSuccess: (data) => {
          toast.success(data.message);
          navigate(`/instructor/courses/${data.originalCourseSlug}/edit`);
          setIsCancelConfirmOpen(false);
        },
        onError: (err) =>
          toast.error((err as Error).message || 'Could not cancel update.'),
      });
    }
  };
  const isProcessingAction =
    isSubmitting || isDeleting || isCreatingUpdate || isCancellingUpdate;
  // --- Render Logic ---
  const isLoadingPage = isLoading || catLoading || levelLoading || langLoading;
  if (isLoadingPage && !course) {
    return (
      <InstructorLayout>
        <FullScreenLoader text='Loading Course Editor...' />
      </InstructorLayout>
    );
  }
  if (isError) {
    return (
      <InstructorLayout>
        <div className='p-8 text-center text-destructive'>
          Error: {error.message}
        </div>
      </InstructorLayout>
    );
  }
  if (!course) {
    return (
      <InstructorLayout>
        <div className='p-8 text-center'>Course not found.</div>
      </InstructorLayout>
    );
  }

  const currentStatus = course.statusId as CourseStatusId;
  // Nếu là PUBLISHED thì không cho edit
  const canEdit =
    currentStatus !== CourseStatusId.PUBLISHED &&
    ![CourseStatusId.PENDING].includes(currentStatus);
  const canSubmit = [CourseStatusId.DRAFT, CourseStatusId.REJECTED].includes(
    currentStatus
  );
  const hasUnsavedChanges = form.formState.isDirty || !!thumbnailFile;

  return (
    <InstructorLayout>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleSaveChanges)}
          className='p-4 md:p-8 space-y-6'
        >
          <CourseEditHeader
            course={course}
            isDirty={hasUnsavedChanges}
            saveStatus={hasUnsavedChanges ? 'idle' : 'saved'}
            onSaveChanges={() => form.handleSubmit(handleSaveChanges)()}
            onSubmitForApproval={() => setIsSubmitConfirmOpen(true)}
            onCancelUpdate={() => setIsCancelConfirmOpen(true)}
            onDelete={() => setIsDeleteConfirmOpen(true)}
            isProcessingAction={isProcessing}
          />

          {hasUnsavedChanges && (
            <Alert
              variant='default'
              className='bg-yellow-50 border-yellow-200 text-yellow-800'
            >
              <Icons.alertCircle className='h-4 w-4 !text-yellow-600' />
              <AlertTitle>You have unsaved changes!</AlertTitle>
              <AlertDescription>
                Don't forget to save your work before submitting for approval or
                leaving the page.
              </AlertDescription>
            </Alert>
          )}
          {course.statusId === 'PUBLISHED' && (
            <Alert>
              <Icons.lock className='h-4 w-4' />
              <AlertTitle>This course is live!</AlertTitle>
              <AlertDescription className='flex justify-between items-center'>
                To prevent disruption for enrolled students, you need to create
                a new version to make major changes.
                <Button
                  onClick={handleEditPublishedCourse}
                  disabled={isCreatingUpdate}
                >
                  {isCreatingUpdate ? <Icons.spinner /> : <Icons.edit />} Create
                  New Version to Edit
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <fieldset
            disabled={!canEdit || isProcessing}
            className='disabled:opacity-75'
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5'>
                <TabsTrigger value='basic'>Basic Info</TabsTrigger>
                <TabsTrigger value='details'>Details</TabsTrigger>
                <TabsTrigger value='media'>Media</TabsTrigger>
                <TabsTrigger value='curriculum'>Curriculum</TabsTrigger>
                <TabsTrigger value='pricing'>Pricing</TabsTrigger>
              </TabsList>
              <div className='mt-6'>
                {/* Các TabsContent không cần thay đổi, chúng chỉ tương tác với form context */}
                <TabsContent
                  value='basic'
                  forceMount
                  className={activeTab !== 'basic' ? 'hidden' : ''}
                >
                  <BasicInfoTab
                    categories={categoriesData?.categories || []}
                    levels={levelsData?.levels || []}
                    languages={languagesData?.languages || []}
                    isLoading={false}
                  />
                </TabsContent>
                <TabsContent
                  value='details'
                  forceMount
                  className={activeTab !== 'details' ? 'hidden' : ''}
                >
                  <DetailsTab />
                </TabsContent>
                <TabsContent
                  value='media'
                  forceMount
                  className={activeTab !== 'media' ? 'hidden' : ''}
                >
                  {/* Cập nhật MediaTab để nhận file và preview, không tự gọi API */}
                  <MediaTab
                    onThumbnailChange={setThumbnailFile}
                    initialThumbnail={course.thumbnailUrl}
                    initialIntroVideo={course.introVideoUrl}
                  />
                </TabsContent>
                <TabsContent
                  value='curriculum'
                  forceMount
                  className={activeTab !== 'curriculum' ? 'hidden' : ''}
                >
                  <CurriculumTab
                    courseId={course.courseId}
                    initialSections={(course.sections || []).map(
                      (section: any) => ({
                        ...section,
                        sectionId: Number(section.sectionId),
                      })
                    )}
                  />
                </TabsContent>
                <TabsContent
                  value='pricing'
                  forceMount
                  className={activeTab !== 'pricing' ? 'hidden' : ''}
                >
                  <PricingTab />
                </TabsContent>
              </div>
            </Tabs>
          </fieldset>

          <div className='flex justify-start pt-6 border-t mt-6'>
            <Button
              type='button'
              variant='destructive'
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isDeleting || course.statusId === 'PUBLISHED'}
            >
              {isDeleting ? <Icons.spinner /> : <Icons.trash />} Delete Course
            </Button>
          </div>
        </form>
      </FormProvider>

      {/* Dialogs */}
      <ConfirmationDialog
        open={isSubmitConfirmOpen}
        onOpenChange={setIsSubmitConfirmOpen}
        onConfirm={confirmSubmit}
        isConfirming={isSubmitting}
        title='Submit Course for Approval?'
        description='Please ensure your course is complete and meets all quality standards. You will not be able to edit the course while it is under review.'
        confirmText='Yes, Submit for Approval'
      />
      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDelete}
        isConfirming={isDeleting}
        title='Delete This Course Permanently?'
        description={`This will permanently delete "${course.courseName}" and all of its content, including enrollments and data. This action cannot be undone.`}
        confirmText='Yes, Delete This Course'
        confirmVariant='destructive'
      />
      <ConfirmationDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        onConfirm={confirmCancelUpdate}
        isConfirming={isCancellingUpdate}
        title='Cancel Update?'
        description='All changes in this update session will be discarded. The live version of your course will remain unchanged.'
        confirmText='Yes, Cancel'
      />
      <LiveNotification
        isOpen={liveNotification.isOpen}
        onClose={() =>
          setLiveNotification((prev) => ({ ...prev, isOpen: false }))
        }
        title={liveNotification.title}
        message={liveNotification.message}
        actionText={liveNotification.actionText}
        onActionClick={liveNotification.onActionClick}
      />
    </InstructorLayout>
  );
};

export default CourseEdit;
