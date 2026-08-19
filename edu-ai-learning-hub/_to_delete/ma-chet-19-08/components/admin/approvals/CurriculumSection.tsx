/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: string;
  isPreview: boolean;
  videoUrl?: string;
  content?: string;
  questions?: any[];
}

interface Section {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface CurriculumSectionProps {
  section: Section;
  expandedSections: number[];
  toggleSectionExpand: (sectionId: number) => void;
  onPreviewLesson: (lesson: Lesson) => void;
  onViewTextLesson: (lesson: Lesson) => void;
  onViewQuizLesson: (lesson: Lesson) => void;
}

const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  section,
  expandedSections,
  toggleSectionExpand,
  onPreviewLesson,
  onViewTextLesson,
  onViewQuizLesson,
}) => {
  const { t } = useTranslation();
  const isExpanded = expandedSections.includes(section.id);

  // Helper để tính tổng thời lượng video (phút)
  const totalVideoMinutes =
    section.lessons.reduce((total, lesson) => {
      if (lesson.type === 'VIDEO') {
        const [mins, secs] = lesson.duration.split(':').map(Number);
        return total + (isNaN(mins) ? 0 : mins * 60) + (isNaN(secs) ? 0 : secs);
      }
      return total;
    }, 0) / 60;

  return (
    <div key={section.id}>
      <div
        className='p-3 hover:bg-muted cursor-pointer'
        onClick={() => toggleSectionExpand(section.id)}
      >
        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-2'>
            {isExpanded ? (
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            ) : (
              <ChevronRight className='h-4 w-4 text-muted-foreground' />
            )}
            <div>
              <h5 className='font-medium'>{section.title}</h5>
              <p className='text-sm text-muted-foreground'>
                {t('courseDetail.sectionLessonCount', {
                  count: section.lessons.length,
                  defaultValue: '{{count}} lessons',
                })}{' '}
                •{totalVideoMinutes.toFixed(1)} {t('courseDetail.min', 'min')}
              </p>
            </div>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className='pl-6 pr-3 pb-3 space-y-2'>
          {section.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className='border rounded-md p-3 flex justify-between items-center'
            >
              <div className='flex items-center space-x-3'>
                {lesson.type === 'VIDEO' && (
                  <File className='h-4 w-4 text-muted-foreground' />
                )}
                {lesson.type === 'TEXT' && (
                  <FileText className='h-4 w-4 text-blue-500' />
                )}
                {lesson.type === 'QUIZ' && (
                  <FileQuestion className='h-4 w-4 text-green-500' />
                )}
                <div>
                  <p className='font-medium'>{lesson.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    {lesson.duration !== 'N/A' ? `${lesson.duration} • ` : ''}
                    {t(
                      `courseDetail.lessonType.${lesson.type.toLowerCase()}`,
                      lesson.type
                    )}
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                {lesson.isPreview && (
                  <Badge variant='secondary'>
                    {t('courseDetail.preview', 'Preview')}
                  </Badge>
                )}
                {lesson.type === 'VIDEO' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewLesson(lesson);
                    }}
                  >
                    {t('courseDetail.watch', 'Watch')}
                  </Button>
                )}
                {lesson.type === 'TEXT' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTextLesson(lesson);
                    }}
                  >
                    {t('courseDetail.viewContent', 'View Content')}
                  </Button>
                )}
                {lesson.type === 'QUIZ' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuizLesson(lesson);
                    }}
                  >
                    {t('courseDetail.viewQuiz', 'View Quiz')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurriculumSection;
