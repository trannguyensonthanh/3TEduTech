// src/pages/admin/CourseApprovals.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Sử dụng slug từ URL nếu có
import AdminLayout from '@/components/layout/AdminLayout';
import ApprovalsListContainer from '@/components/admin/approvals/ApprovalsListContainer'; // Component danh sách mới
import CourseDetailView from '@/components/admin/approvals/CourseDetailView'; // Component chi tiết
import {
  VideoPreviewDialog,
  TextContentDialog,
  QuizContentDialog,
} from '@/components/admin/approvals/LessonDialogs'; // Dialog xem trước lesson
import {
  useReviewCourseApproval,
  useCourseDetailBySlug,
  usePendingApprovalRequestByCourseId,
} from '@/hooks/queries/course.queries'; // Import hook query/mutation
import { useToast } from '@/hooks/use-toast';
import FullScreenLoader from '@/components/common/FullScreenLoader';
import { ReviewCourseData, Lesson } from '@/types/common.types'; // Import types
import { Button } from '@/components/ui/button';

const CourseApprovalsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  // State để lưu slug của khóa học đang được chọn để xem chi tiết
  // Hoặc có thể lấy từ URL param nếu bạn muốn URL tường minh: /admin/approvals/{courseSlug}?requestId={id}
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );

  // State cho các dialog xem trước lesson
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [textContentDialogOpen, setTextContentDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [currentLessonForPreview, setCurrentLessonForPreview] =
    useState<Lesson | null>(null);

  // Fetch chi tiết khóa học khi có selectedSlug
  const {
    data: courseDetails,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    error: detailError,
  } = useCourseDetailBySlug(selectedSlug ?? undefined, {
    enabled: !!selectedSlug, // Chỉ fetch khi có slug
  });

  const { data: pendingApproval, isLoading: isApprovalLoading } =
    usePendingApprovalRequestByCourseId(courseDetails?.courseId);

  const chitietCourseId = {
    ...courseDetails,
    requestId: pendingApproval?.requestId,
    requestDate: pendingApproval?.requestDate,
    instructorNotes: pendingApproval?.instructorNotes,
  };

  // Mutation để Approve/Reject
  const { mutate: reviewCourseMutate, isPending: isReviewing } =
    useReviewCourseApproval();

  // State cho ghi chú của admin
  const [adminNotes, setAdminNotes] = useState('');

  // Hàm được gọi khi click nút "Review" trong danh sách
  const handleSelectApproval = (slug: string, requestId: number) => {
    console.log(
      `Selecting approval for slug: ${slug}, requestId: ${requestId}`
    );
    setSelectedSlug(slug);
    setSelectedRequestId(requestId);
    setAdminNotes(''); // Reset notes khi chọn cái mới
  };

  // Hàm quay lại danh sách
  const handleBackToList = () => {
    setSelectedSlug(null);
    setSelectedRequestId(null);
  };

  // Hàm xử lý Approve
  const handleApprove = () => {
    if (!selectedRequestId || isReviewing) return;
    const reviewData: ReviewCourseData = {
      decision: 'APPROVED', // Trạng thái mới
      adminNotes: adminNotes || undefined, // Gửi notes nếu có
    };
    reviewCourseMutate(
      { requestId: selectedRequestId, data: reviewData },
      {
        onSuccess: (data) => {
          console.log('Course approved successfully:', data);
          toast({
            title: 'Success',
            description: data.message || `Course approved successfully.`,
          });
          handleBackToList(); // Quay lại danh sách sau khi thành công
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Failed to approve course: ${error.message}`,
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Hàm xử lý Reject
  const handleReject = () => {
    if (!selectedRequestId || isReviewing) return;
    if (!adminNotes?.trim()) {
      // Bắt buộc nhập notes khi reject
      toast({
        title: 'Notes Required',
        description: 'Please provide feedback notes before rejecting.',
        variant: 'destructive',
      });
      return;
    }
    const reviewData: ReviewCourseData = {
      decision: 'REJECTED',
      adminNotes: adminNotes,
    };
    reviewCourseMutate(
      { requestId: selectedRequestId, data: reviewData },
      {
        onSuccess: () => {
          toast({
            title: 'Course Rejected',
            description: `Course review submitted.`,
          });
          handleBackToList();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Failed to reject course: ${error.message}`,
            variant: 'destructive',
          });
        },
      }
    );
  };

  // --- Handlers mở dialog preview lesson ---
  const handlePreviewLesson = (lesson: Lesson) => {
    if (lesson.lessonType === 'VIDEO') {
      setCurrentLessonForPreview(lesson);
      setPreviewDialogOpen(true);
    }
  };
  const handleViewTextLesson = (lesson: Lesson) => {
    if (lesson.lessonType === 'TEXT') {
      setCurrentLessonForPreview(lesson);
      setTextContentDialogOpen(true);
    }
  };
  const handleViewQuizLesson = (lesson: Lesson) => {
    if (lesson.lessonType === 'QUIZ') {
      setCurrentLessonForPreview(lesson);
      setQuizDialogOpen(true);
    }
  };

  // --- Render ---
  return (
    <AdminLayout>
      <div className='container mx-auto px-4 py-8'>
        {selectedSlug ? (
          // Hiển thị chi tiết khóa học
          isLoadingDetail ? (
            <FullScreenLoader />
          ) : isDetailError ? (
            <div className='text-center text-destructive'>
              Error loading course details:{' '}
              {detailError?.message || 'Unknown error'}
              <Button
                variant='outline'
                onClick={handleBackToList}
                className='ml-4'
              >
                Back to List
              </Button>
            </div>
          ) : courseDetails ? (
            <CourseDetailView
              courseDetails={chitietCourseId} // Dữ liệu chi tiết fetch được
              // expandedSections và toggleSectionExpand cần state riêng nếu muốn giữ trạng thái expand
              // expandedSections={[]}
              // toggleSectionExpand={() => {}}
              onPreviewLesson={handlePreviewLesson}
              onViewTextLesson={handleViewTextLesson}
              onViewQuizLesson={handleViewQuizLesson}
              onBack={handleBackToList}
              onApprove={handleApprove}
              onReject={handleReject}
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
              isProcessing={isReviewing} // Thêm cờ loading cho nút Approve/Reject
            />
          ) : (
            <div className='text-center text-muted-foreground'>
              Course details not found.
            </div>
          )
        ) : (
          // Hiển thị danh sách chờ duyệt
          <ApprovalsListContainer onSelectApproval={handleSelectApproval} />
        )}
      </div>

      {/* Lesson Content Dialogs */}
      <VideoPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        lesson={currentLessonForPreview}
      />
      <TextContentDialog
        open={textContentDialogOpen}
        onOpenChange={setTextContentDialogOpen}
        lesson={currentLessonForPreview}
      />
      <QuizContentDialog
        open={quizDialogOpen}
        onOpenChange={setQuizDialogOpen}
        lesson={currentLessonForPreview}
      />
    </AdminLayout>
  );
};

export default CourseApprovalsPage;
