import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Lesson } from '@/services/lesson.service';
import { useTranslation } from 'react-i18next';

interface LessonContentProps {
  lesson: Lesson;
  selectedAnswers: { [key: number]: number };
  quizSubmitted: boolean;
  onQuizOptionSelect: (questionId: number, optionId: number) => void;
  onQuizSubmit: () => void;
  isQuizOptionCorrect: (
    questionId: number,
    optionId: number
  ) => boolean | undefined;
  calculateQuizScore: () => number;
}

const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  selectedAnswers,
  quizSubmitted,
  onQuizOptionSelect,
  onQuizSubmit,
  isQuizOptionCorrect,
  calculateQuizScore,
}) => {
  const { t } = useTranslation();

  if (lesson.lessonType === 'VIDEO') {
    return (
      <div className='bg-black rounded-lg overflow-hidden aspect-video'>
        <iframe
          className='w-full h-full'
          src={lesson.externalVideoInput}
          title={lesson.lessonName}
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  if (lesson.lessonType === 'TEXT') {
    return (
      <div className='prose max-w-none'>
        <div
          dangerouslySetInnerHTML={{
            __html: lesson.textContent || '',
          }}
        ></div>
      </div>
    );
  }

  if (lesson.lessonType === 'QUIZ' && lesson.questions) {
    return (
      <div className='space-y-6'>
        {lesson.questions.map((question, qIndex) => (
          <div
            key={question.questionId}
            className='border rounded-lg p-4 space-y-3'
          >
            <h3 className='text-lg font-medium'>
              {qIndex + 1}. {question.questionText}
            </h3>
            <div className='space-y-2'>
              {question.options.map((option) => {
                const isSelected =
                  selectedAnswers[question.questionId] === option.optionId;
                const isCorrect = isQuizOptionCorrect(
                  question.questionId,
                  option.optionId
                );
                let optionClass =
                  'border rounded-md p-3 cursor-pointer transition-colors';
                if (quizSubmitted) {
                  if (option.isCorrectAnswer) {
                    optionClass += ' bg-green-50 border-green-200';
                  } else if (isSelected && !option.isCorrectAnswer) {
                    optionClass += ' bg-red-50 border-red-200';
                  }
                } else if (isSelected) {
                  optionClass += ' border-primary bg-primary/5';
                } else {
                  optionClass += ' hover:border-muted-foreground';
                }
                return (
                  <div
                    key={option.optionId}
                    className={optionClass}
                    onClick={() =>
                      onQuizOptionSelect(question.questionId, option.optionId)
                    }
                  >
                    <div className='flex items-start'>
                      <div className='flex-1'>{option.optionText}</div>
                      {quizSubmitted && option.isCorrectAnswer && (
                        <CheckCircle className='h-5 w-5 text-green-500 ml-2' />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {quizSubmitted && question.explanation && (
              <div className='bg-muted p-3 rounded-md text-sm mt-3'>
                <p className='font-medium mb-1'>
                  {t('lessonContent.explanation')}
                </p>
                <p>{question.explanation}</p>
              </div>
            )}
          </div>
        ))}
        {quizSubmitted ? (
          <div className='bg-muted p-4 rounded-lg'>
            <h3 className='text-lg font-medium mb-2'>
              {t('lessonContent.quizResults')}
            </h3>
            <p>
              {t('lessonContent.yourScore', { score: calculateQuizScore() })}
            </p>
            <Button className='mt-4' onClick={() => window.location.reload()}>
              {t('lessonContent.tryAgain')}
            </Button>
          </div>
        ) : (
          <Button onClick={onQuizSubmit}>
            {t('lessonContent.submitAnswers')}
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default LessonContent;
