import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, FileText, Book } from 'lucide-react';

type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ';

interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuizQuestion {
  id: number;
  text: string;
  explanation: string | null;
  order: number;
  options: QuizOption[];
}

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: LessonType;
  isPreview: boolean;
  content: string;
  videoUrl: string;
  thumbnailUrl?: string;
  questions?: QuizQuestion[];
  attachments: Attachment[];
}

interface Section {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface CoursePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  thumbnailPreview: string | null;
  formValues: {
    title: string;
    shortDescription: string;
    category: string;
    level: string;
    language: string;
    price: string;
  };
  sections: Section[];
}

const CoursePreviewDialog: React.FC<CoursePreviewDialogProps> = ({
  open,
  onClose,
  thumbnailPreview,
  formValues,
  sections,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Course Preview</DialogTitle>
          <DialogDescription>
            This is how your course will appear to students.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[60vh]'>
          <div className='space-y-6'>
            {/* Thumbnail */}
            <div className='rounded-md overflow-hidden'>
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt='Course thumbnail'
                  className='w-full aspect-video object-cover'
                />
              ) : (
                <div className='w-full aspect-video bg-muted flex items-center justify-center'>
                  <p className='text-muted-foreground'>No thumbnail uploaded</p>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div>
              <h2 className='text-2xl font-bold'>
                {formValues.title || 'Course Title'}
              </h2>
              <p className='text-muted-foreground mt-2'>
                {formValues.shortDescription || 'No description provided.'}
              </p>

              <div className='flex items-center space-x-4 mt-4'>
                <div>
                  <Badge variant='outline'>
                    {formValues.category || 'Category'}
                  </Badge>
                </div>
                <div className='text-sm text-muted-foreground'>
                  <span>{formValues.level || 'Level'}</span>
                </div>
                <div className='text-sm text-muted-foreground'>
                  <span>{formValues.language || 'Language'}</span>
                </div>
              </div>
            </div>

            {/* Curriculum */}
            <div className='pt-4'>
              <h3 className='text-lg font-semibold mb-2'>Course Curriculum</h3>
              <div className='space-y-2'>
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className='border rounded-md overflow-hidden'
                  >
                    <div className='bg-muted p-3 font-medium'>
                      {section.title}
                    </div>
                    <div className='divide-y'>
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className='p-3 flex justify-between items-center'
                        >
                          <div className='flex items-center space-x-3'>
                            {lesson.type === 'VIDEO' && (
                              <Video className='h-4 w-4 text-muted-foreground' />
                            )}
                            {lesson.type === 'TEXT' && (
                              <FileText className='h-4 w-4 text-muted-foreground' />
                            )}
                            {lesson.type === 'QUIZ' && (
                              <Book className='h-4 w-4 text-muted-foreground' />
                            )}
                            <div>
                              <p className='font-medium'>{lesson.title}</p>
                              <p className='text-xs text-muted-foreground'>
                                {lesson.duration} • {lesson.type}
                              </p>
                            </div>
                          </div>
                          {lesson.isPreview && (
                            <Badge variant='secondary'>Preview</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className='flex items-center space-x-2'>
              <p className='text-xl font-bold'>
                {formValues.discountedPrice ? (
                  <>
                    <span className='line-through text-muted-foreground mr-2'>
                      ${formValues.originalPrice}
                    </span>
                    ${formValues.discountedPrice}
                  </>
                ) : (
                  `$${formValues.originalPrice}`
                )}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreviewDialog;
