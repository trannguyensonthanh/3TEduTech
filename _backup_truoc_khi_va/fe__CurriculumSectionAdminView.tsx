// src/components/admin/approvals/CurriculumSectionAdminView.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Lesson, LessonType } from '@/types/common.types'; // Import types chuẩn
import {
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  BookOpen as BookIcon,
  Eye,
  Clock,
  File as FileIcon,
  Lock,
} from 'lucide-react'; // Thêm Lock
import { Badge } from '@/components/ui/badge';
import { Section } from '@/services/section.service';
import { useTranslation } from 'react-i18next';

interface CurriculumSectionAdminViewProps {
  section: Section;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPreviewLesson: (lesson: Lesson) => void;
  onViewTextLesson: (lesson: Lesson) => void;
  onViewQuizLesson: (lesson: Lesson) => void;
}

const CurriculumSectionAdminView: React.FC<CurriculumSectionAdminViewProps> = ({
  section,
  isExpanded,
  onToggleExpand,
  onPreviewLesson,
  onViewTextLesson,
  onViewQuizLesson,
}) => {
  const { t } = useTranslation();

  const formatDuration = (seconds?: number | null): string => {
    if (seconds === null || seconds === undefined || seconds <= 0) return '-';
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    let durationString = '';
    if (hours > 0) durationString += `${hours}h `;
    if (remainingMinutes > 0 || hours > 0)
      durationString += `${remainingMinutes}m `;
    if (hours === 0 && totalMinutes < 60)
      durationString += `${
        remainingSeconds < 10 ? '0' : ''
      }${remainingSeconds}s`;
    return durationString.trim() || '-'; // Trả về '-' nếu kết quả rỗng
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Có thể kiểm tra isFreePreview ở đây nếu Admin chỉ xem được bài free?
    // if (!lesson.isFreePreview) {
    //    toast({ title: "Preview Locked", description: "This lesson is not set for free preview.", variant: "default" });
    //    return;
    // }
    if (lesson.lessonType === 'VIDEO') onPreviewLesson(lesson);
    else if (lesson.lessonType === 'TEXT') onViewTextLesson(lesson);
    else if (lesson.lessonType === 'QUIZ') onViewQuizLesson(lesson);
  };

  return (
    <div className='border-b last:border-b-0'>
      {/* Section Header */}
      <button
        className='flex justify-between items-center w-full p-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <div className='flex items-center space-x-2 min-w-0'>
          {isExpanded ? (
            <ChevronUp className='h-5 w-5 text-muted-foreground shrink-0' />
          ) : (
            <ChevronDown className='h-5 w-5 text-muted-foreground shrink-0' />
          )}
          <span
            className='font-semibold text-base truncate'
            title={section.sectionName}
          >
            {t('courseDetail.sectionTitle', {
              index: section.sectionOrder + 1,
              name:
                section.sectionName ||
                t('courseDetail.untitledSection', 'Untitled Section'),
              defaultValue: 'Section {{index}}: {{name}}',
            })}
          </span>
          <Badge variant='outline' className='text-xs shrink-0'>
            {t('courseDetail.sectionItemCount', {
              count: section.lessons?.length || 0,
              defaultValue: '{{count}} items',
            })}
          </Badge>
        </div>
      </button>

      {/* Lessons List (Collapsible) */}
      {isExpanded && (
        <div className='pl-8 pr-3 pb-3 divide-y bg-background/50'>
          {section.lessons && section.lessons.length > 0 ? (
            section.lessons
              .sort((a, b) => a.lessonOrder - b.lessonOrder)
              .map((lesson, index) => (
                <div
                  key={lesson.lessonId}
                  className='py-3 flex justify-between items-center gap-2'
                >
                  <div className='flex items-center space-x-3 flex-grow min-w-0'>
                    {/* Icon */}
                    {lesson.lessonType === 'VIDEO' && (
                      <Video className='h-4 w-4 text-blue-600 shrink-0' />
                    )}
                    {lesson.lessonType === 'TEXT' && (
                      <FileText className='h-4 w-4 text-green-600 shrink-0' />
                    )}
                    {lesson.lessonType === 'QUIZ' && (
                      <BookIcon className='h-4 w-4 text-purple-600 shrink-0' />
                    )}
                    {/* Info */}
                    <div className='flex-grow min-w-0'>
                      <p
                        className='font-medium text-sm truncate'
                        title={lesson.lessonName}
                      >
                        {index + 1}.{' '}
                        {lesson.lessonName ||
                          t('courseDetail.untitledLesson', 'Untitled Lesson')}
                      </p>
                      <p className='text-xs text-muted-foreground flex items-center flex-wrap gap-x-2 gap-y-1'>
                        {lesson.lessonType === 'VIDEO' && (
                          <span className='flex items-center'>
                            <Clock size={12} />{' '}
                            {formatDuration(lesson.videoDurationSeconds)}
                          </span>
                        )}
                        <span>
                          •{' '}
                          {t(
                            `courseDetail.lessonType.${lesson.lessonType.toLowerCase()}`,
                            { defaultValue: lesson.lessonType }
                          )}
                        </span>
                        {lesson.isFreePreview && (
                          <Badge
                            variant='success'
                            className='h-4 px-1.5 text-xs'
                          >
                            {t('courseDetail.previewable', 'Previewable')}
                          </Badge>
                        )}
                        {(lesson.attachments?.length ?? 0) > 0 && (
                          <span className='flex items-center'>
                            <FileIcon size={12} /> {lesson.attachments?.length}{' '}
                            {t('courseDetail.files', {
                              count: lesson.attachments?.length,
                              defaultValue: 'File(s)',
                            })}
                          </span>
                        )}
                        {(lesson.questions?.length ?? 0) > 0 && (
                          <span className='flex items-center'>
                            <BookIcon size={12} /> {lesson.questions?.length}{' '}
                            {t('courseDetail.questions', 'Qs')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Preview Button */}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <Eye className='h-4 w-4 mr-1' />{' '}
                    {t('courseDetail.view', 'View')}
                  </Button>
                </div>
              ))
          ) : (
            <p className='text-sm text-muted-foreground text-center py-3'>
              {t(
                'courseDetail.noLessonsInSection',
                'No lessons in this section.'
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CurriculumSectionAdminView;
