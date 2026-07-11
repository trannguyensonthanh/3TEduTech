/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/courseLearn/QuizPlayer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge'; // Added Badge
import {
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  Award,
  ListChecks,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from '@/hooks/queries/quiz.queries';
import { useMarkLessonCompletion } from '@/hooks/queries/progress.queries';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QuizAttemptResultResponse,
  QuizOption,
  QuizQuestion,
  SubmitAnswer,
} from '@/services/quiz.service';

// import { ScrollArea } from '@/components/ui/scroll-area'; // Not explicitly used for main scroll, but useful if content inside review is long

interface QuizPlayerProps {
  lessonId: number | string;
  lessonName?: string;

  onQuizComplete: (result: QuizAttemptResultResponse) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({
  lessonId,
  lessonName,
  onQuizComplete,
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentAttemptId, setCurrentAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});
  const [quizResult, setQuizResult] =
    useState<QuizAttemptResultResponse | null>(null);
  const [viewMode, setViewMode] = useState<'playing' | 'results' | 'review'>(
    'playing'
  );

  const {
    mutate: startAttemptMutate,
    isPending: isLoadingQuiz,
    reset: resetStartAttempt,
  } = useStartQuizAttempt();
  const {
    mutate: submitAttemptMutate,
    isPending: isSubmittingQuiz,
    reset: resetSubmitAttempt,
  } = useSubmitQuizAttempt();
  const { mutate: markLessonComplete } = useMarkLessonCompletion();

  useEffect(() => {
    console.log('Checking conditions:', {
      lessonId,
      currentAttemptId,
      quizResult,
      viewMode,
    });
    if (
      lessonId &&
      !currentAttemptId &&
      !quizResult &&
      viewMode === 'playing'
    ) {
      console.log('Starting quiz attempt...');
      startAttemptMutate(Number(lessonId), {
        onSuccess: (data) => {
          setCurrentAttemptId(data.attempt.attemptId);
          const questionsForDisplay = data.questions.map((qAPI) => ({
            questionId: qAPI.questionId,
            questionText: qAPI.questionText,
            questionOrder: qAPI.questionOrder,
            // questionType: qAPI.questionType, // Thêm questionType
            options: qAPI.options.map((optAPI) => ({
              optionId: optAPI.optionId,
              optionText: optAPI.optionText,
              optionOrder: optAPI.optionOrder,
              isCorrectAnswer: undefined,
            })) as QuizOption[],
            explanation: undefined, // Không hiển thị giải thích lúc làm bài
          }));
          setQuestions(questionsForDisplay);
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
        },
        onError: (error: any) => {
          toast({
            title: t('lessonContent.quiz.errorStartTitle'),
            description:
              error.message || t('lessonContent.quiz.errorStartDesc'),
            variant: 'destructive',
          });
        },
      });
    }
  }, [
    lessonId,
    startAttemptMutate,
    currentAttemptId,
    quizResult,
    viewMode,
    toast,
  ]);

  // Memoized current question for different modes
  const currentQuestionForPlaying = useMemo(
    () => questions[currentQuestionIndex],
    [questions, currentQuestionIndex]
  );
  const currentQuestionForReview = useMemo(() => {
    if (viewMode === 'review' && quizResult) {
      // Lấy questionId từ mảng `questions` (đã được sắp xếp theo questionOrder)
      // để đảm bảo thứ tự review giống thứ tự làm bài.
      const currentPlayingQuestionId =
        questions[currentQuestionIndex]?.questionId;
      return quizResult.details.find(
        (q) => q.questionId === currentPlayingQuestionId
      );
    }
    return null;
  }, [viewMode, quizResult, questions, currentQuestionIndex]);

  const handleOptionSelect = (questionId: number, optionId: number) => {
    if (viewMode !== 'playing') return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    const totalQuestions =
      viewMode === 'review' && quizResult
        ? quizResult.details.length
        : questions.length;
    if (direction === 'next' && currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentAttemptId) {
      toast({
        title: t('common.error'),
        description: t('lessonContent.quiz.errorNoActiveAttempt'),
        variant: 'destructive',
      });
      return;
    }
    // Check if all questions are answered
    const unansweredQuestionsCount = questions.filter(
      (q) =>
        selectedAnswers[q.questionId] === undefined ||
        selectedAnswers[q.questionId] === null
    ).length;
    if (unansweredQuestionsCount > 0) {
      toast({
        title: t('lessonContent.quiz.incompleteTitle'),
        description: t('lessonContent.quiz.incompleteDesc', {
          total: questions.length,
          unanswered: unansweredQuestionsCount,
        }),
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }

    const answersPayload: SubmitAnswer[] = questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionId: selectedAnswers[q.questionId] || null,
    }));

    submitAttemptMutate(
      { attemptId: currentAttemptId, answers: answersPayload },
      {
        onSuccess: (result) => {
          setQuizResult(result);
          setViewMode('results');
          onQuizComplete(result); // Notify parent
          // Parent (CourseLearningPage) will handle marking complete based on result from onQuizComplete
        },
        onError: (error: any) => {
          toast({
            title: t('lessonContent.quiz.errorSubmitTitle'),
            description:
              error.message || t('lessonContent.quiz.errorSubmitDesc'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleTryAgain = () => {
    console.log('Resetting quiz attempt...');
    resetStartAttempt();
    resetSubmitAttempt();
    setCurrentAttemptId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
    setViewMode('playing');
    // useEffect will then re-trigger startAttemptMutate
  };

  const handleReviewAnswers = () => {
    setViewMode('review');
    setCurrentQuestionIndex(0); // Start review from the first question
  };

  // --- Render Logic ---
  if (isLoadingQuiz && viewMode === 'playing' && !questions.length) {
    return (
      <div className='flex flex-col items-center justify-center p-8 min-h-[400px] bg-card rounded-xl shadow-lg'>
        <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
        <p className='text-muted-foreground'>
          {t('lessonContent.quiz.loading')}
        </p>
      </div>
    );
  }

  // --- Results View ---
  if (viewMode === 'results' && quizResult) {
    const { attempt } = quizResult;
    console.log('Quiz Result:', quizResult);
    const score = attempt.score ?? 0;
    // isPassed nên được xác định bởi backend và trả về trong attempt object.
    // Nếu không, bạn cần logic tính isPassed ở client, ví dụ:
    // const isPassed = score >= (quizResult.quizDetails?.passingScore || 70);
    const isPassed = attempt.isPassed;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-card p-6 sm:p-10 rounded-xl shadow-2xl text-center'
      >
        <motion.div
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 15,
            delay: 0.1,
          }}
          className='mb-6'
        >
          {isPassed ? (
            <Award className='h-20 w-20 text-green-500 mx-auto p-3 bg-green-100 dark:bg-green-900/30 rounded-full' />
          ) : (
            <XCircle className='h-20 w-20 text-red-500 mx-auto p-3 bg-red-100 dark:bg-red-900/30 rounded-full' />
          )}
        </motion.div>
        <h2 className='text-3xl sm:text-4xl font-bold mb-2 text-foreground'>
          {t('lessonContent.quiz.results.title')}
        </h2>
        <p
          className='text-5xl sm:text-6xl font-extrabold mb-3'
          style={{
            color: isPassed ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
          }}
        >
          {score.toFixed(0)}
          <span className='text-3xl'>%</span>
        </p>
        <p className='text-muted-foreground mb-8 max-w-md mx-auto'>
          {isPassed
            ? t('lessonContent.quiz.results.passedDesc', {
                lessonName:
                  lessonName ||
                  t('lessonContent.quiz.results.defaultLessonName'),
              })
            : t('lessonContent.quiz.results.failedDesc', {
                score: score.toFixed(0),
                passingScore: quizResult.attempt?.score,
              })}
        </p>
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          {quizResult.details && quizResult.details.length > 0 && (
            <Button
              onClick={handleReviewAnswers}
              variant='outline'
              size='lg'
              className='sm:w-auto'
            >
              <ListChecks className='mr-2 h-5 w-5' />{' '}
              {t('lessonContent.quiz.results.reviewBtn')}
            </Button>
          )}
          <Button onClick={handleTryAgain} size='lg' className='sm:w-auto'>
            <RotateCcw className='mr-2 h-5 w-5' />{' '}
            {t('lessonContent.quiz.results.tryAgainBtn')}
          </Button>
        </div>
      </motion.div>
    );
  }

  // --- Review Answers View ---
  if (viewMode === 'review' && quizResult && currentQuestionForReview) {
    const reviewedQuestion = currentQuestionForReview; // Đã được memoized ở trên
    return (
      <Card className='shadow-xl animate-fadeInWipe'>
        <CardHeader className='pb-4'>
          <div className='flex justify-between items-center mb-2'>
            <CardTitle className='text-lg md:text-xl'>
              {t('lessonContent.quiz.review.title')}:{' '}
              <span className='font-normal'>
                {lessonName || t('lessonContent.quiz.review.defaultTitle')}
              </span>
            </CardTitle>
            <Badge variant='outline' className='text-sm font-mono px-2 py-1'>
              {t('lessonContent.quiz.questionProgress', {
                current: currentQuestionIndex + 1,
                total: quizResult.details.length,
              })}
            </Badge>
          </div>
          <Progress
            value={
              ((currentQuestionIndex + 1) / quizResult.details.length) * 100
            }
            className='h-1.5'
          />
        </CardHeader>
        <CardContent className='p-4 sm:p-6 space-y-5'>
          <motion.p
            key={`review-q-${reviewedQuestion.questionId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className='text-base sm:text-lg font-semibold leading-relaxed mb-1'
          >
            {currentQuestionIndex + 1}. {reviewedQuestion.questionText}
          </motion.p>
          <div className='space-y-3'>
            {/* Sắp xếp options theo optionOrder từ API */}
            {reviewedQuestion.options
              .sort((a, b) => a.optionOrder - b.optionOrder)
              .map((option) => {
                const isSelectedByUser =
                  option.optionId === reviewedQuestion.selectedOptionId;
                const isCorrect = option.isCorrectAnswer;
                let variantStyles = 'border-border bg-card';
                let resultIcon = <div className='w-5 h-5 shrink-0'></div>;

                if (isCorrect) {
                  variantStyles =
                    'border-green-600 bg-green-50 dark:bg-green-700/20 text-green-700 dark:text-green-300 font-medium ring-1 ring-green-500';
                  resultIcon = (
                    <CheckCircle
                      size={18}
                      className='text-green-500 shrink-0'
                    />
                  );
                } else if (isSelectedByUser && !isCorrect) {
                  variantStyles =
                    'border-red-600 bg-red-50 dark:bg-red-700/20 text-red-700 dark:text-red-300 ring-1 ring-red-500';
                  resultIcon = (
                    <XCircle size={18} className='text-red-500 shrink-0' />
                  );
                } else {
                  variantStyles =
                    'border-border bg-card opacity-80 dark:opacity-60';
                }

                return (
                  <div
                    key={option.optionId}
                    className={cn(
                      'p-3 sm:p-4 border rounded-lg flex items-center space-x-3 text-left transition-all',
                      variantStyles
                    )}
                  >
                    <div className='shrink-0'>{resultIcon}</div>
                    <span className='text-sm sm:text-base flex-1'>
                      {option.optionText}
                    </span>
                    {isSelectedByUser && !isCorrect && (
                      <Badge
                        variant='destructive'
                        className='text-xs ml-auto shrink-0 px-1.5 py-0.5'
                      >
                        {t('lessonContent.quiz.review.yourAnswer')}
                      </Badge>
                    )}
                    {isSelectedByUser && isCorrect && (
                      <Badge
                        variant='success'
                        className='text-xs ml-auto shrink-0 px-1.5 py-0.5'
                      >
                        {t('lessonContent.quiz.review.yourCorrectAnswer')}
                      </Badge>
                    )}
                    {!isSelectedByUser && isCorrect && (
                      <Badge
                        variant='success'
                        className='text-xs ml-auto shrink-0 px-1.5 py-0.5'
                      >
                        {t('lessonContent.quiz.review.correctAnswer')}
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
          {reviewedQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='mt-6 pt-4 border-t border-dashed'
            >
              <Alert
                variant='default'
                className='bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
              >
                <Lightbulb className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                <AlertTitle className='font-semibold text-blue-700 dark:text-blue-300'>
                  {t('lessonContent.explanation')}
                </AlertTitle>
                <AlertDescription className='text-sm whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none text-blue-600 dark:text-blue-200'>
                  {reviewedQuestion.explanation}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </CardContent>
        <CardFooter className='flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-t'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigateQuestion('prev')}
            disabled={currentQuestionIndex === 0}
          >
            {t('lessonContentWrapper.prev')}
          </Button>
          {currentQuestionIndex === quizResult.details.length - 1 ? (
            <Button
              size='sm'
              onClick={() => setViewMode('results')}
              className='bg-primary hover:bg-primary/90'
            >
              {t('lessonContent.quiz.review.backToSummary')}
            </Button>
          ) : (
            <Button size='sm' onClick={() => navigateQuestion('next')}>
              {t('lessonContent.quiz.review.nextQuestion')}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // --- Playing View ---
  if (viewMode === 'playing' && currentQuestionForPlaying) {
    const currentQ = currentQuestionForPlaying;
    return (
      <Card className='shadow-xl animate-fadeInWipe'>
        {' '}
        {/* Sử dụng animation mới */}
        <CardHeader className='pb-4'>
          <div className='flex justify-between items-center mb-2'>
            <CardTitle className='text-xl md:text-2xl'>
              {lessonName || t('lessonContent.quiz.playing.defaultTitle')}
            </CardTitle>
            <Badge variant='outline' className='text-sm font-mono px-2 py-1'>
              {t('lessonContent.quiz.questionProgress', {
                current: currentQuestionIndex + 1,
                total: questions.length,
              })}
            </Badge>
          </div>
          <Progress
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            className='h-1.5'
          />
        </CardHeader>
        <CardContent className='p-6 space-y-6'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentQ.questionId}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                duration: 0.3,
                type: 'spring',
                stiffness: 200,
                damping: 25,
              }}
              className='min-h-[50px] sm:min-h-[60px]'
            >
              <p className='text-base sm:text-lg font-semibold leading-relaxed mb-1'>
                {currentQuestionIndex + 1}. {currentQ.questionText}
              </p>
            </motion.div>
          </AnimatePresence>

          <RadioGroup
            value={selectedAnswers[currentQ.questionId]?.toString() || ''}
            onValueChange={(value) =>
              handleOptionSelect(currentQ.questionId, parseInt(value))
            }
            className='space-y-3'
          >
            {currentQ.options
              .sort((a, b) => a.optionOrder - b.optionOrder)
              .map((option, index) => (
                <motion.div
                  key={option.optionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 + 0.15 }}
                >
                  <Label
                    htmlFor={`option-${option.optionId}`}
                    className={cn(
                      'flex items-start space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-150 hover:border-primary/70 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary', // Thêm focus-within
                      selectedAnswers[currentQ.questionId] === option.optionId
                        ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-md'
                        : 'bg-card hover:bg-muted/50 dark:hover:bg-muted/20'
                    )}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOptionSelect(
                          currentQ.questionId,
                          option.optionId
                        );
                      }
                    }}
                  >
                    <RadioGroupItem
                      value={option?.optionId?.toString()}
                      id={`option-${option.optionId}`}
                      className='shrink-0 mt-0.5 border-muted-foreground data-[state=checked]:border-primary'
                    />
                    <span className='text-sm sm:text-base flex-1 leading-normal'>
                      {option.optionText}
                    </span>
                  </Label>
                </motion.div>
              ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className='flex flex-col sm:flex-row justify-between items-center p-6 border-t gap-3'>
          <Button
            variant='outline'
            onClick={() => navigateQuestion('prev')}
            disabled={currentQuestionIndex === 0 || isSubmittingQuiz}
          >
            {t('lessonContentWrapper.prev')}
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={
                isSubmittingQuiz ||
                selectedAnswers[currentQ.questionId] === undefined
              }
              size='lg'
              className='bg-green-600 hover:bg-green-700 text-white dark:text-white'
            >
              {isSubmittingQuiz && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {t('lessonContent.quiz.playing.submitBtn')}
            </Button>
          ) : (
            <Button
              onClick={() => navigateQuestion('next')}
              disabled={
                isSubmittingQuiz ||
                selectedAnswers[currentQ.questionId] === undefined
              }
            >
              {t('lessonContent.quiz.playing.nextBtn')}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className='p-8 text-center text-muted-foreground min-h-[400px] flex items-center justify-center bg-card rounded-xl shadow-lg'>
      {t('lessonContent.quiz.unavailable')}
    </div>
  );
};

export default QuizPlayer;
