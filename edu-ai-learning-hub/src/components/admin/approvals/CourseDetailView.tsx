// src/components/admin/approvals/CourseDetailView.tsx
import React, { useState } from 'react'; // Thêm useState
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Check,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CurriculumSectionAdminView from './CurriculumSectionAdminView'; // Component con để hiển thị section
import {
  Lesson,
  CourseStatusId,
  IsoDateTimeString,
} from '@/types/common.types'; // Import types
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { Course } from '@/services/course.service';
import { useSettings } from '@/contexts/SettingsContext';
import he from 'he'; // Import he for HTML decoding

export interface AdminCourseView extends Course {
  // được dùng trong code này
  requestId?: number;
  requestDate?: IsoDateTimeString; // When the course was submitted for review
  instructorNotes?: string | null;
  // Inherits all fields from Course
  // AdminCourseView in the file also had categoryName, levelName, instructorName, etc.
  // These can be derived from the joined objects in Course (category, level, instructor)
  // Or, if the API flattens them, they can be added here directly.
  // For now, relying on Course structure.
}

interface CourseDetailViewProps {
  courseDetails: AdminCourseView; // Sử dụng type AdminCourseView đầy đủ
  // Bỏ expandedSections và toggleSectionExpand, quản lý trong component này
  onPreviewLesson: (lesson: Lesson) => void;
  onViewTextLesson: (lesson: Lesson) => void;
  onViewQuizLesson: (lesson: Lesson) => void;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  isProcessing?: boolean; // Trạng thái loading cho nút Approve/Reject
}

const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseDetails,
  onPreviewLesson,
  onViewTextLesson,
  onViewQuizLesson,
  onBack,
  onApprove,
  onReject,
  adminNotes,
  setAdminNotes,
  isProcessing = false,
}) => {
  // State quản lý section nào đang mở trong component này
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const { t } = useTranslation();
  const { formatPrice } = useSettings();
  const toggleSectionExpand = (sectionId: number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const courseUrl = `/courses/${courseDetails.slug}`; // Tạo URL preview
  console.log('Course URL:', courseUrl); // Debug URL
  console.log('Course Details:', courseDetails); // Debug course details
  return (
    <div className='space-y-6'>
      {/* --- Header Buttons --- */}
      <div className='flex justify-between items-center'>
        <Button variant='outline' onClick={onBack} disabled={isProcessing}>
          ← {t('courseDetail.backToPending', 'Back to Pending List')}
        </Button>
        {courseDetails.requestId !== undefined ? (
          <div className='space-x-2'>
            <Button
              variant='destructive'
              onClick={onReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <X className='mr-2 h-4 w-4' />
              )}
              {t('courseDetail.reject', 'Reject')}
            </Button>
            <Button
              variant='default'
              onClick={onApprove}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Check className='mr-2 h-4 w-4' />
              )}
              {t('courseDetail.approve', 'Approve')}
            </Button>
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>
            Không có yêu cầu phê duyệt
          </div>
        )}
      </div>
      {/* --- Main Content Grid --- */}
      <div
        className={`grid grid-cols-1 ${
          courseDetails.requestId === undefined
            ? 'lg:grid-cols-2'
            : 'lg:grid-cols-3'
        } gap-6 items-start`}
      >
        {/* --- Left Column: Course Info & Curriculum --- */}
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center gap-4'>
                <CardTitle className='text-2xl'>
                  {courseDetails.courseName}
                </CardTitle>
                {/* Sử dụng Link an toàn hơn nếu có router */}
                <a href={courseUrl} target='_blank' rel='noopener noreferrer'>
                  <Button variant='outline' size='sm'>
                    <ExternalLink className='mr-2 h-4 w-4' />{' '}
                    {t('courseDetail.previewCourse', 'Preview Course Page')}
                  </Button>
                </a>
              </div>
              <CardDescription>
                {t('courseDetail.by', {
                  instructor: courseDetails?.instructorName,
                  defaultValue: 'By {{instructor}}',
                })}{' '}
                <span className='mx-1'>|</span>{' '}
                {t('courseDetail.submitted', 'Submitted')}:{' '}
                {new Date(
                  courseDetails.createdAt || Date.now()
                ).toLocaleDateString()}
                <Badge variant='secondary' className='ml-2'>
                  {t(
                    `approvals.status.${courseDetails.statusId.toLowerCase()}`,
                    courseDetails.statusId
                  )}
                </Badge>
                {courseDetails.requestId && (
                  <span className='ml-2 text-xs text-muted-foreground'>
                    (
                    {t('courseDetail.requestId', {
                      id: courseDetails.requestId,
                      defaultValue: 'Request ID: {{id}}',
                    })}
                    )
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Thumbnail */}
              {courseDetails.thumbnailUrl && (
                <div className='rounded-lg overflow-hidden aspect-video bg-muted'>
                  <img
                    src={courseDetails.thumbnailUrl}
                    alt={courseDetails.courseName}
                    className='w-full h-full object-cover'
                  />
                </div>
              )}

              {/* Short Description */}
              {courseDetails.shortDescription && (
                <div>
                  <h4 className='font-semibold mb-1'>
                    {t('courseDetail.shortDescription', 'Short Description')}
                  </h4>
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none'
                    dangerouslySetInnerHTML={{
                      __html: he.decode(courseDetails.shortDescription),
                    }}
                  ></div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t pt-4'>
                <div>
                  <span className='font-medium text-muted-foreground block'>
                    {t('courseDetail.category', 'Category')}:
                  </span>{' '}
                  {courseDetails.categoryName}
                </div>
                <div>
                  <span className='font-medium text-muted-foreground block'>
                    {t('courseDetail.level', 'Level')}:
                  </span>{' '}
                  {courseDetails.levelName}
                </div>
                <div>
                  <span className='font-medium text-muted-foreground block'>
                    {t('courseDetail.language', 'Language')}:
                  </span>{' '}
                  {courseDetails.language}
                </div>
                <div>
                  <span className='font-medium text-muted-foreground block'>
                    {t('courseDetail.price', 'Price')}:
                  </span>{' '}
                  {formatPrice(courseDetails.pricing.display.originalPrice)}
                </div>
                <div>
                  <span className='font-medium text-muted-foreground block'>
                    {t('courseDetail.discount', 'Discount')}:
                  </span>{' '}
                  {courseDetails.pricing.display.discountedPrice
                    ? formatPrice(courseDetails.pricing.display.discountedPrice)
                    : t('courseDetail.none', 'None')}
                </div>
              </div>

              {/* Full Description */}
              {courseDetails.fullDescription && (
                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-2'>
                    {t('courseDetail.fullDescription', 'Full Description')}
                  </h4>
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none'
                    dangerouslySetInnerHTML={{
                      __html: he.decode(courseDetails.fullDescription),
                    }}
                  ></div>
                </div>
              )}

              {/* Requirements */}
              {courseDetails.requirements && (
                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-2'>
                    {t('courseDetail.requirements', 'Requirements')}
                  </h4>
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none'
                    dangerouslySetInnerHTML={{
                      __html: he.decode(courseDetails.requirements),
                    }}
                  ></div>
                </div>
              )}

              {/* Learning Outcomes */}
              {courseDetails.learningOutcomes && (
                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-2'>
                    {t('courseDetail.learningOutcomes', "What You'll Learn")}
                  </h4>
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none'
                    dangerouslySetInnerHTML={{
                      __html: he.decode(courseDetails.learningOutcomes),
                    }}
                  ></div>
                </div>
              )}

              {/* Instructor Notes */}
              {courseDetails.instructorNotes && (
                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-2'>
                    {t('courseDetail.instructorNotes', 'Instructor Notes')}
                  </h4>
                  <p className='text-sm p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md'>
                    {courseDetails.instructorNotes}
                  </p>
                </div>
              )}

              {/* Curriculum */}
              <div className='border-t pt-4'>
                <h4 className='text-lg font-semibold mb-3'>
                  {t('courseDetail.curriculumReview', 'Curriculum Review')}
                </h4>
                <div className='border rounded-md divide-y'>
                  {courseDetails.sections &&
                  courseDetails.sections.length > 0 ? (
                    courseDetails.sections
                      .sort((a, b) => a.sectionOrder - b.sectionOrder) // Sắp xếp section
                      .map((section) => (
                        <CurriculumSectionAdminView // Component con mới
                          key={section.sectionId}
                          section={section}
                          isExpanded={expandedSections.includes(
                            section.sectionId
                          )}
                          onToggleExpand={() =>
                            toggleSectionExpand(section.sectionId)
                          }
                          onPreviewLesson={onPreviewLesson}
                          onViewTextLesson={onViewTextLesson}
                          onViewQuizLesson={onViewQuizLesson}
                        />
                      ))
                  ) : (
                    <p className='p-4 text-center text-muted-foreground'>
                      {t(
                        'courseDetail.noCurriculum',
                        'No curriculum submitted.'
                      )}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Column: Review Decision --- */}
        {courseDetails.requestId !== undefined && (
          <div className='lg:col-span-1 sticky top-4'>
            {/* Sticky để ô review luôn hiển thị */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('courseDetail.reviewDecision', 'Review Decision')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'courseDetail.reviewDesc',
                    'Provide feedback and approve or reject the submission.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='adminNotes' className='font-medium'>
                    {t('courseDetail.adminNotes', 'Admin Notes / Feedback')}
                  </Label>
                  <Textarea
                    id='adminNotes'
                    placeholder={t(
                      'courseDetail.adminNotesPlaceholder',
                      'Enter feedback for the instructor (required if rejecting)...'
                    )}
                    className='min-h-[180px] mt-1'
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    {t(
                      'courseDetail.adminNotesHint',
                      'These notes will be sent to the instructor.'
                    )}
                  </p>
                </div>
                <div className='pt-4 space-y-2 border-t'>
                  <Button
                    variant='default'
                    className='w-full'
                    onClick={onApprove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Check className='mr-2 h-4 w-4' />
                    )}{' '}
                    {t('courseDetail.approveCourse', 'Approve Course')}
                  </Button>
                  <Button
                    variant='destructive'
                    className='w-full'
                    onClick={onReject}
                    disabled={isProcessing || !adminNotes.trim()}
                    title={
                      !adminNotes.trim()
                        ? t(
                            'courseDetail.notesRequired',
                            'Notes are required to reject'
                          )
                        : ''
                    }
                  >
                    {isProcessing ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <X className='mr-2 h-4 w-4' />
                    )}{' '}
                    {t('courseDetail.rejectCourse', 'Reject Course')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailView;
