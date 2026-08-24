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
  useArchiveCourse,
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
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // State cho media files (không thuộc form)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [introVideoFile, setIntroVideoFile] = useState<File | null>(null);

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
  const { mutateAsync: updateCourse, isPending: isUpdatingCourse } =
    useUpdateCourse();
  const { mutateAsync: updateThumbnail, isPending: isUploadingThumb } =
    useUpdateCourseThumbnail();
  const { mutate: submitForApproval, isPending: isSubmitting } =
    useSubmitCourseForApproval();
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();
  const { mutate: archiveCourse, isPending: isArchiving } = useArchiveCourse();
  const { mutate: createUpdateSession, isPending: isCreatingUpdate } =
    useCreateCourseUpdateSession();
  const { mutate: cancelUpdateSession, isPending: isCancellingUpdate } =
    useCancelCourseUpdateSession();
  const isProcessing =
    isUpdatingCourse || isUploadingThumb || isSubmitting || isDeleting || isArchiving;
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
    const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;

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
              toast.success('Khóa học của bạn đã được quản trị viên duyệt.', {
                description: `Trạng thái chuyển sang ${eventData.newStatus}. Bạn xem lại phản hồi nhé.`,
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
              title: 'Thông báo mới',
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
                      'Đã xảy ra lỗi khi cập nhật khóa học.'
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

          resolve('Đã lưu toàn bộ thay đổi.');
        } catch (err) {
          reject(err);
        }
      })();
    });

    toast.promise(promise, {
      loading: 'Đang lưu thay đổi…',
      success: (message) => {
        setThumbnailFile(null); // Reset file sau khi thành công
        setIntroVideoFile(null); // Bỏ qua file video nếu đang nháp (như yêu cầu của user)
        form.reset(form.getValues()); // Cập nhật defaultValues thành giá trị hiện tại để reset isDirty về false
        refetch(); // Fetch lại dữ liệu mới nhất
        return message as string;
      },
      error: (err: any) => err.message || 'Đã xảy ra lỗi khi lưu.',
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
            (err as Error).message || 'Không tạo được phiên cập nhật.'
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
          toast.success('Đã gửi khóa học đi duyệt.');
          refetch();
          setIsSubmitConfirmOpen(false);
        },
        onError: (err) =>
          toast.error((err as Error).message || 'Gửi duyệt không thành công.'),
      }
    );
  };

  const confirmDelete = () => {
    if (!course) return;
    deleteCourse(course.courseId, {
      onSuccess: () => {
        toast.success(`Đã xóa khóa học "${course.courseName}".`);
        navigate('/instructor/courses');
      },
      onError: (err) =>
        toast.error((err as Error).message || 'Không xóa được khóa học.'),
    });
  };
  const confirmArchive = () => {
    if (!course) return;
    archiveCourse(
      { courseId: course.courseId },
      {
        onSuccess: (data) => {
          toast.success(data.message, { duration: 5000 });
          setIsArchiveConfirmOpen(false);
          if (!data.requiresApproval) {
            navigate('/instructor/courses');
          }
        },
        onError: (err) =>
          toast.error(err.message || 'Không lưu trữ được khóa học.'),
      }
    );
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
          toast.error((err as Error).message || 'Không hủy được bản cập nhật.'),
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
        <FullScreenLoader text='Đang mở trình soạn khóa học…' />
      </InstructorLayout>
    );
  }
  if (isError) {
    return (
      <InstructorLayout>
        <div className='p-8 text-center text-destructive'>
          Lỗi: {error.message}
        </div>
      </InstructorLayout>
    );
  }
  if (!course) {
    return (
      <InstructorLayout>
        <div className='p-8 text-center'>Không tìm thấy khóa học.</div>
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
  const hasUnsavedChanges = form.formState.isDirty || !!thumbnailFile || !!introVideoFile;

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
              className='rounded-xl border-border bg-warning-soft text-warning'
            >
              <Icons.alertCircle className='h-4 w-4 !text-warning' />
              <AlertTitle>Bạn có thay đổi chưa lưu</AlertTitle>
              <AlertDescription>
                Nhớ lưu công việc trước khi gửi duyệt hoặc rời khỏi trang.
              </AlertDescription>
            </Alert>
          )}
          {course.statusId === 'PUBLISHED' && (
            <Alert>
              <Icons.lock className='h-4 w-4' />
              <AlertTitle>Khóa học đang phát hành</AlertTitle>
              <AlertDescription className='flex justify-between items-center'>
                Để không làm gián đoạn học viên đang học, bạn cần tạo một phiên
                bản mới nếu muốn sửa đổi lớn.
                <Button
                  onClick={handleEditPublishedCourse}
                  disabled={isCreatingUpdate}
                >
                  {isCreatingUpdate ? <Icons.spinner /> : <Icons.edit />} Tạo
                  phiên bản mới để sửa
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
                <TabsTrigger value='basic'>Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value='details'>Chi tiết</TabsTrigger>
                <TabsTrigger value='media'>Hình ảnh, video</TabsTrigger>
                <TabsTrigger value='curriculum'>Chương trình học</TabsTrigger>
                <TabsTrigger value='pricing'>Giá bán</TabsTrigger>
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
                  <DetailsTab courseId={course.courseId} />
                </TabsContent>
                <TabsContent
                  value='media'
                  forceMount
                  className={activeTab !== 'media' ? 'hidden' : ''}
                >
                  {/* Cập nhật MediaTab để nhận file và preview, không tự gọi API */}
                  <MediaTab
                    initialThumbnail={course?.thumbnailUrl || null}
                    onThumbnailChange={setThumbnailFile}
                    initialIntroVideo={course?.introVideoUrl || null}
                    onIntroVideoChange={setIntroVideoFile}
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

          <div className='flex items-center gap-4 pt-6 border-t mt-6 flex-wrap'>
            <Button
              type='button'
              variant='destructive'
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isDeleting || (course.statusId === 'PUBLISHED' && (course.studentCount || 0) > 0)}
              title={course.statusId === 'PUBLISHED' && (course.studentCount || 0) > 0 ? 'Không thể xóa khóa học đang phát hành khi vẫn còn học viên' : 'Xóa vĩnh viễn khóa học'}
            >
              {isDeleting ? <Icons.spinner /> : <Icons.trash className='mr-2 h-4 w-4' />} Xóa khóa học
            </Button>
            {course.statusId === 'PUBLISHED' && (
              <Button
                type='button'
                variant='outline'
                className='border-warning text-warning hover:bg-warning-soft'
                onClick={() => setIsArchiveConfirmOpen(true)}
                disabled={isArchiving || isDeleting}
              >
                {isArchiving ? <Icons.spinner /> : <Icons.archive className='mr-2 h-4 w-4' />} Gỡ phát hành / Lưu trữ khóa học
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      {/* Dialogs */}
      <ConfirmationDialog
        open={isSubmitConfirmOpen}
        onOpenChange={setIsSubmitConfirmOpen}
        onConfirm={confirmSubmit}
        isConfirming={isSubmitting}
        title='Gửi khóa học đi duyệt?'
        description='Hãy chắc chắn khóa học đã hoàn chỉnh và đạt các tiêu chuẩn chất lượng. Bạn sẽ không sửa được khóa học trong lúc chờ duyệt.'
        confirmText='Gửi duyệt'
      />
      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDelete}
        isConfirming={isDeleting}
        title='Xóa vĩnh viễn khóa học này?'
        description={`Thao tác này xóa vĩnh viễn "${course.courseName}" cùng toàn bộ nội dung, gồm cả lượt ghi danh và dữ liệu. Không thể hoàn tác.`}
        confirmText='Xóa khóa học'
        confirmVariant='destructive'
      />
      <ConfirmationDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        onConfirm={confirmCancelUpdate}
        isConfirming={isCancellingUpdate}
        title='Hủy bản cập nhật?'
        description='Mọi thay đổi trong phiên cập nhật này sẽ bị bỏ. Bản đang phát hành của khóa học giữ nguyên.'
        confirmText='Hủy cập nhật'
      />
      <ConfirmationDialog
        open={isArchiveConfirmOpen}
        onOpenChange={setIsArchiveConfirmOpen}
        onConfirm={confirmArchive}
        isConfirming={isArchiving}
        title={(course.studentCount || 0) === 0 ? 'Gỡ phát hành khóa học này?' : 'Gửi yêu cầu gỡ phát hành (lưu trữ)?'}
        description={(course.studentCount || 0) === 0 
          ? `Hiện chưa có học viên nào ghi danh "${course.courseName}", nên khóa học sẽ được gỡ phát hành ngay và rời khỏi gian hàng.`
          : `Vì "${course.courseName}" đang có ${course.studentCount} học viên ghi danh, yêu cầu gỡ phát hành sẽ được gửi tới quản trị viên hệ thống để duyệt, nhằm bảo đảm các chiến dịch quảng bá đang chạy và quyền truy cập của học viên được chuyển tiếp đúng cách.`}
        confirmText={(course.studentCount || 0) === 0 ? 'Gỡ phát hành ngay' : 'Gửi yêu cầu lưu trữ'}
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
