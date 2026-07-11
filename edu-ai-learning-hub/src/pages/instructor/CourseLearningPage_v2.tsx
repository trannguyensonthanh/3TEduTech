import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/common/Icons";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AvatarCanvas } from "@/components/ai-avatar/AvatarCanvas";

// Interfaces for the course learning page
interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: string;
}

interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  text: string;
  explanation: string;
  options: QuizOption[];
}

interface DiscussionPost {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  parentId?: number;
  replies?: DiscussionPost[];
}

interface DiscussionThread {
  id: number;
  title: string;
  authorId: number;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  isResolved: boolean;
  posts: DiscussionPost[];
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: "video" | "text" | "quiz";
  duration: string;
  completed: boolean;
  content?: string;
  videoUrl?: string;
  lastPosition?: number;
  attachments: Attachment[];
  quiz?: {
    id: number;
    title: string;
    passingScore: number;
    timeLimit?: number;
    questions: QuizQuestion[];
  };
  discussions: DiscussionThread[];
}

interface Section {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  slug: string;
  sections: Section[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

const CourseLearningPage = () => {
  const { courseSlug, lessonId } = useParams<{
    courseSlug: string;
    lessonId?: string;
  }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("content");

  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [questionId: number]: number[];
  }>({});
  const [quizScore, setQuizScore] = useState(0);

  // Discussion states
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newReplyContent, setNewReplyContent] = useState<{
    [threadId: number]: string;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // This would be a real API call in production
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Mock course data
        const mockCourse: Course = {
          id: 1,
          title: "Complete Web Development Bootcamp",
          slug: "web-development-bootcamp",
          progress: {
            completed: 5,
            total: 25,
            percentage: 20,
          },
          sections: [
            {
              id: 1,
              title: "Introduction to Web Development",
              lessons: [
                {
                  id: 101,
                  title: "Welcome to the Course",
                  description:
                    "A brief overview of what you'll learn in this course.",
                  type: "video",
                  duration: "5:22",
                  completed: true,
                  videoUrl:
                    "https://www.youtube.com/embed/Tn6-PIqc4UM?si=AYalstMZBeGzMUXL",
                  lastPosition: 120,
                  attachments: [
                    {
                      id: 1,
                      fileName: "Course Outline.pdf",
                      fileUrl: "#",
                      fileSize: "2.4 MB",
                    },
                  ],
                  discussions: [],
                },
                {
                  id: 102,
                  title: "How the Internet Works",
                  description:
                    "Learn the fundamentals of how the internet actually works.",
                  type: "video",
                  duration: "12:45",
                  completed: true,
                  videoUrl:
                    "https://www.youtube.com/embed/Tn6-PIqc4UM?si=AYalstMZBeGzMUXL",
                  attachments: [],
                  discussions: [],
                },
              ],
            },
            {
              id: 2,
              title: "HTML Fundamentals",
              lessons: [
                {
                  id: 201,
                  title: "HTML Document Structure",
                  description:
                    "Learn how to structure an HTML document properly.",
                  type: "video",
                  duration: "14:20",
                  completed: true,
                  videoUrl:
                    "https://www.youtube.com/embed/Tn6-PIqc4UM?si=AYalstMZBeGzMUXL",
                  attachments: [],
                  discussions: [],
                },
                {
                  id: 202,
                  title: "HTML Basic Elements",
                  description:
                    "Learn the essential HTML elements every web developer should know.",
                  type: "text",
                  duration: "10 min read",
                  completed: false,
                  content:
                    "<h2>HTML Basic Elements</h2><p>HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.</p><p>HTML describes the structure of a web page semantically and originally included cues for the appearance of the document.</p><p>Here are some basic HTML elements:</p><ul><li><strong>Headings</strong>: Use h1 through h6 tags.</li><li><strong>Paragraphs</strong>: Use p tags.</li><li><strong>Links</strong>: Use a (anchor) tags.</li><li><strong>Images</strong>: Use img tags.</li><li><strong>Lists</strong>: Use ul, ol, and li tags.</li></ul>",
                  attachments: [
                    {
                      id: 2,
                      fileName: "HTML Cheat Sheet.pdf",
                      fileUrl: "#",
                      fileSize: "1.2 MB",
                    },
                  ],
                  discussions: [
                    {
                      id: 1,
                      title: "Question about semantic HTML",
                      authorId: 101,
                      authorName: "John Doe",
                      authorAvatar:
                        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyfGVufDB8fDB8fHww",
                      content:
                        "When should I use article vs section tags? I'm confused about their semantic meanings.",
                      createdAt: "2023-11-15T12:30:00Z",
                      isResolved: false,
                      posts: [
                        {
                          id: 101,
                          userId: 201,
                          userName: "Instructor Smith",
                          userAvatar:
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXZhdGFyfGVufDB8fDB8fHww",
                          content:
                            "Great question! The <article> element represents a self-contained composition, which could be distributed and reused independently. The <section> element represents a thematic grouping of content. Think of article as something that could stand alone (like a blog post), while a section is more like a chapter in a book.",
                          createdAt: "2023-11-15T13:45:00Z",
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 203,
                  title: "HTML Quiz",
                  description: "Test your understanding of HTML basics.",
                  type: "quiz",
                  duration: "15 min",
                  completed: false,
                  quiz: {
                    id: 1,
                    title: "HTML Fundamentals Quiz",
                    passingScore: 70,
                    timeLimit: 15,
                    questions: [
                      {
                        id: 1,
                        text: "What does HTML stand for?",
                        explanation:
                          "HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages.",
                        options: [
                          {
                            id: 1,
                            text: "Hyper Transfer Markup Language",
                            isCorrect: false,
                          },
                          {
                            id: 2,
                            text: "HyperText Markup Language",
                            isCorrect: true,
                          },
                          {
                            id: 3,
                            text: "High-level Text Markup Language",
                            isCorrect: false,
                          },
                          {
                            id: 4,
                            text: "Hyperlink and Text Markup Language",
                            isCorrect: false,
                          },
                        ],
                      },
                      {
                        id: 2,
                        text: "Which tag is used to create a hyperlink?",
                        explanation:
                          "The <a> (anchor) tag is used to create hyperlinks in HTML.",
                        options: [
                          { id: 5, text: "<link>", isCorrect: false },
                          { id: 6, text: "<a>", isCorrect: true },
                          { id: 7, text: "<href>", isCorrect: false },
                          { id: 8, text: "<url>", isCorrect: false },
                        ],
                      },
                      {
                        id: 3,
                        text: "Which HTML element is used to define an image?",
                        explanation:
                          "The <img> tag is used to embed images in an HTML document.",
                        options: [
                          { id: 9, text: "<picture>", isCorrect: false },
                          { id: 10, text: "<image>", isCorrect: false },
                          { id: 11, text: "<img>", isCorrect: true },
                          { id: 12, text: "<src>", isCorrect: false },
                        ],
                      },
                    ],
                  },
                  attachments: [],
                  discussions: [],
                },
              ],
            },
          ],
        };

        setCourse(mockCourse);

        // Find the current lesson
        let foundLesson: Lesson | null = null;
        if (lessonId) {
          // Look for specific lesson
          for (const section of mockCourse.sections) {
            const lesson = section.lessons.find(
              (l) => l.id === parseInt(lessonId, 10)
            );
            if (lesson) {
              foundLesson = lesson;
              break;
            }
          }
        } else {
          // Default to first uncompleted lesson or first lesson
          let firstIncompleteFound = false;
          for (const section of mockCourse.sections) {
            for (const lesson of section.lessons) {
              if (!lesson.completed && !firstIncompleteFound) {
                foundLesson = lesson;
                firstIncompleteFound = true;
                break;
              }
            }
            if (firstIncompleteFound) break;
          }

          // If all lessons are completed, show the first one
          if (
            !foundLesson &&
            mockCourse.sections.length > 0 &&
            mockCourse.sections[0].lessons.length > 0
          ) {
            foundLesson = mockCourse.sections[0].lessons[0];
          }
        }

        if (foundLesson) {
          setCurrentLesson(foundLesson);
        } else {
          toast({
            variant: "destructive",
            title: "Lesson not found",
            description: "The requested lesson could not be found.",
          });
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load course content. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseSlug, lessonId, toast]);

  // Navigate to a lesson
  const navigateToLesson = (lesson: Lesson) => {
    // Save current video position if needed
    if (currentLesson?.type === "video" && videoRef.current) {
      // In a real app, save this to user's progress in backend
      console.log(
        `Saved position for lesson ${currentLesson.id}: ${videoRef.current.currentTime}s`
      );
    }

    setCurrentLesson(lesson);
    setActiveTab("content");
    setQuizStarted(false);
    setQuizSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});

    // Update URL without full page reload
    navigate(`/learn/${courseSlug}/lessons/${lesson.id}`, { replace: true });
  };

  // Mark lesson as complete
  const markLessonComplete = () => {
    if (!currentLesson) return;

    // In a real app, this would call an API to update the user's progress
    toast({
      title: "Lesson completed",
      description: "Your progress has been saved",
      variant: "default",
    });

    // Update local state to show completion
    if (course) {
      const updatedCourse = { ...course };
      for (const section of updatedCourse.sections) {
        for (let i = 0; i < section.lessons.length; i++) {
          if (section.lessons[i].id === currentLesson.id) {
            section.lessons[i].completed = true;
            break;
          }
        }
      }

      // Update progress
      let completed = 0;
      let total = 0;
      for (const section of updatedCourse.sections) {
        for (const lesson of section.lessons) {
          total++;
          if (lesson.completed) completed++;
        }
      }

      updatedCourse.progress = {
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
      };

      setCourse(updatedCourse);

      // Also update current lesson
      setCurrentLesson({ ...currentLesson, completed: true });
    }
  };

  // Navigate to next lesson
  const goToNextLesson = () => {
    if (!course || !currentLesson) return;

    let foundCurrent = false;
    let nextLesson: Lesson | null = null;

    // Find the next lesson in sequence
    for (const section of course.sections) {
      for (let i = 0; i < section.lessons.length; i++) {
        if (foundCurrent && !nextLesson) {
          nextLesson = section.lessons[i];
          break;
        }
        if (section.lessons[i].id === currentLesson.id) {
          foundCurrent = true;
          if (i < section.lessons.length - 1) {
            nextLesson = section.lessons[i + 1];
            break;
          }
        }
      }
      if (nextLesson) break;
    }

    if (nextLesson) {
      navigateToLesson(nextLesson);
    } else {
      toast({
        title: "Course completed",
        description: "Congratulations! You've reached the end of the course.",
        variant: "default",
      });
    }
  };

  // Quiz functions
  const startQuiz = () => {
    setQuizStarted(true);
    setQuizSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  const handleAnswerSelect = (
    questionId: number,
    optionId: number,
    isMultiSelect: boolean = false
  ) => {
    setSelectedAnswers((prev) => {
      // For single-select (radio buttons), replace the answer
      if (!isMultiSelect) {
        return { ...prev, [questionId]: [optionId] };
      }

      // For multi-select (checkboxes), toggle the answer
      const currentAnswers = prev[questionId] || [];
      if (currentAnswers.includes(optionId)) {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((id) => id !== optionId),
        };
      } else {
        return { ...prev, [questionId]: [...currentAnswers, optionId] };
      }
    });
  };

  const goToNextQuestion = () => {
    if (!currentLesson?.quiz) return;

    if (currentQuestionIndex < currentLesson.quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const submitQuiz = () => {
    if (!currentLesson?.quiz) return;

    // Calculate score
    let correctAnswers = 0;
    const questions = currentLesson.quiz.questions;

    for (const question of questions) {
      const userAnswers = selectedAnswers[question.id] || [];
      const correctOptions = question.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id);

      // Check if arrays have the same elements (regardless of order)
      const isCorrect =
        userAnswers.length === correctOptions.length &&
        userAnswers.every((id) => correctOptions.includes(id));

      if (isCorrect) correctAnswers++;
    }

    const percentage = Math.round((correctAnswers / questions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    // If passed, mark as complete
    if (percentage >= currentLesson.quiz.passingScore) {
      markLessonComplete();
    }
  };

  // Render current content based on lesson type
  const renderLessonContent = () => {
    if (!currentLesson) return null;

    switch (currentLesson.type) {
      case "video":
        return (
          <div className="aspect-video relative rounded-md overflow-hidden bg-black">
            <iframe
              src={currentLesson.videoUrl}
              title={currentLesson.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );

      case "text":
        return (
          <div
            className="prose prose-slate max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: currentLesson.content || "No content available.",
            }}
          />
        );

      case "quiz": {
        if (!currentLesson.quiz) return <p>Quiz not available.</p>;

        // If quiz is not started yet, show start screen
        if (!quizStarted) {
          return (
            <div className="text-center py-10">
              <Icons.fileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-medium mb-2">
                {currentLesson.quiz.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                This quiz has {currentLesson.quiz.questions.length} questions.
                Passing score: {currentLesson.quiz.passingScore}%
                {currentLesson.quiz.timeLimit &&
                  ` • Time limit: ${currentLesson.quiz.timeLimit} minutes`}
              </p>
              <Button onClick={startQuiz}>Start Quiz</Button>
            </div>
          );
        }

        // If quiz is submitted, show results
        if (quizSubmitted) {
          const isPassed = quizScore >= currentLesson.quiz.passingScore;

          return (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div
                  className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                    isPassed
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {isPassed ? (
                    <Icons.check className="h-8 w-8" />
                  ) : (
                    <Icons.x className="h-8 w-8" />
                  )}
                </div>

                <h3 className="text-xl font-medium mb-2">
                  {isPassed ? "Quiz Passed!" : "Almost There"}
                </h3>

                <div className="flex justify-center items-center mb-4">
                  <div className="text-3xl font-bold mr-2">{quizScore}%</div>
                  <div className="text-muted-foreground">
                    {isPassed ? "Great job!" : "Try again"}
                  </div>
                </div>

                <Progress
                  value={quizScore}
                  className="w-full max-w-md mx-auto mb-4"
                />

                <p className="text-muted-foreground mb-6">
                  {isPassed
                    ? "You've successfully completed this quiz."
                    : `Required passing score: ${currentLesson.quiz.passingScore}%. Keep trying!`}
                </p>

                {!isPassed && (
                  <Button onClick={startQuiz} className="mb-8">
                    Retry Quiz
                  </Button>
                )}
              </div>

              <h4 className="text-lg font-medium mt-6 mb-4">
                Review Questions
              </h4>

              <div className="space-y-6">
                {currentLesson.quiz.questions.map((question, i) => {
                  const userAnswers = selectedAnswers[question.id] || [];
                  const correctOptions = question.options
                    .filter((opt) => opt.isCorrect)
                    .map((opt) => opt.id);

                  const isQuestionCorrect =
                    userAnswers.length === correctOptions.length &&
                    userAnswers.every((id) => correctOptions.includes(id));

                  return (
                    <div key={question.id} className="border rounded-md p-4">
                      <div className="flex">
                        <div
                          className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-2 ${
                            isQuestionCorrect
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isQuestionCorrect ? (
                            <Icons.check className="h-4 w-4" />
                          ) : (
                            <Icons.x className="h-4 w-4" />
                          )}
                        </div>
                        <div className="font-medium">
                          Question {i + 1}: {question.text}
                        </div>
                      </div>

                      <div className="mt-3 ml-8">
                        {question.options.map((option) => {
                          const isSelected = userAnswers.includes(option.id);
                          const isCorrect = option.isCorrect;

                          return (
                            <div
                              key={option.id}
                              className={`flex items-center py-1 ${
                                isSelected && isCorrect
                                  ? "text-green-600 font-medium"
                                  : isSelected && !isCorrect
                                  ? "text-red-600 font-medium"
                                  : !isSelected && isCorrect
                                  ? "text-green-600 font-medium"
                                  : ""
                              }`}
                            >
                              <div className="w-5 h-5 mr-2 flex-shrink-0">
                                {isSelected && isCorrect && (
                                  <Icons.check className="h-5 w-5 text-green-600" />
                                )}
                                {isSelected && !isCorrect && (
                                  <Icons.x className="h-5 w-5 text-red-600" />
                                )}
                                {!isSelected && isCorrect && (
                                  <Icons.check className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              {option.text}
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <div className="mt-3 ml-8 p-3 bg-muted rounded-md">
                          <div className="font-medium mb-1">Explanation:</div>
                          <div className="text-sm text-muted-foreground">
                            {question.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Taking the quiz - show current question
        const question = currentLesson.quiz.questions[currentQuestionIndex];
        const isMultiSelect =
          question.options.filter((opt) => opt.isCorrect).length > 1;

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQuestionIndex + 1} of{" "}
                {currentLesson.quiz.questions.length}
              </span>
              {currentLesson.quiz.timeLimit && (
                <span className="text-sm text-muted-foreground flex items-center">
                  <Icons.clock className="h-4 w-4 mr-1" />
                  Time remaining: {currentLesson.quiz.timeLimit}:00
                </span>
              )}
            </div>

            <Progress
              value={
                ((currentQuestionIndex + 1) /
                  currentLesson.quiz.questions.length) *
                100
              }
              className="mb-6"
            />

            <h3 className="text-xl font-medium mb-4">{question.text}</h3>

            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center border rounded-md p-3 cursor-pointer transition-colors hover:bg-muted",
                    (selectedAnswers[question.id] || []).includes(option.id)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                  onClick={() =>
                    handleAnswerSelect(question.id, option.id, isMultiSelect)
                  }
                >
                  <div className="h-5 w-5 mr-3 flex-shrink-0 rounded-sm border border-primary flex items-center justify-center">
                    {(selectedAnswers[question.id] || []).includes(
                      option.id
                    ) && <Icons.check className="h-4 w-4 text-primary" />}
                  </div>
                  {option.text}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={goToPrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              {currentQuestionIndex <
              currentLesson.quiz.questions.length - 1 ? (
                <Button onClick={goToNextQuestion}>Next</Button>
              ) : (
                <Button onClick={submitQuiz}>Submit Quiz</Button>
              )}
            </div>
          </div>
        );
      }

      default:
        return <p>Unsupported lesson type.</p>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 flex justify-center">
          <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!course || !currentLesson) {
    return (
      <Layout>
        <div className="container mx-auto py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Course Not Found</h1>
            <p className="mt-4 text-muted-foreground">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="mt-6">
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        {/* Course Header */}
        <div className="bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{course.title}</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Icons.bookOpen className="h-4 w-4 mr-1" />
                    <span>
                      Lesson {currentLesson.id}: {currentLesson.title}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 md:mt-0 flex items-center space-x-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {course.progress.percentage}%
                  </span>{" "}
                  complete
                </div>
                <Progress value={course.progress.percentage} className="w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            {/* Curriculum Sidebar */}
            <div className="md:col-span-3 xl:col-span-2">
              <div className="bg-background rounded-lg border sticky top-6">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Course Curriculum</h3>
                </div>

                <ScrollArea className="h-[calc(100vh-250px)]">
                  <div className="p-1">
                    <Accordion
                      type="multiple"
                      defaultValue={course.sections.map(
                        (s) => `section-${s.id}`
                      )}
                    >
                      {course.sections.map((section) => (
                        <AccordionItem
                          key={section.id}
                          value={`section-${section.id}`}
                        >
                          <AccordionTrigger className="px-3 py-2 text-sm">
                            {section.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1 pl-1">
                              {section.lessons.map((lesson) => (
                                <button
                                  key={lesson.id}
                                  className={cn(
                                    "flex items-center w-full text-left text-sm px-3 py-1.5 rounded-md",
                                    currentLesson.id === lesson.id
                                      ? "bg-primary text-primary-foreground font-medium"
                                      : "hover:bg-muted/50 text-foreground"
                                  )}
                                  onClick={() => navigateToLesson(lesson)}
                                >
                                  <div
                                    className={cn(
                                      "h-5 w-5 mr-2 flex-shrink-0 rounded-full flex items-center justify-center text-xs",
                                      currentLesson.id === lesson.id
                                        ? "bg-primary-foreground text-primary"
                                        : lesson.completed
                                        ? "bg-green-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {lesson.completed ? (
                                      <Icons.check className="h-3 w-3" />
                                    ) : (
                                      <span>
                                        {section.lessons.indexOf(lesson) + 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="truncate">{lesson.title}</div>
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-9 xl:col-span-7">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      {currentLesson.title}
                    </h2>
                    {currentLesson.description && (
                      <p className="text-muted-foreground">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>

                  <div className="mb-8">{renderLessonContent()}</div>

                  {currentLesson.type !== "quiz" && (
                    <div className="mt-8 flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigateToLesson(course.sections[0].lessons[0])
                        }
                      >
                        <Icons.arrowLeft className="mr-2 h-4 w-4" />
                        Back to Start
                      </Button>

                      {!currentLesson.completed ? (
                        <Button onClick={markLessonComplete}>
                          <Icons.check className="mr-2 h-4 w-4" />
                          Mark as Complete
                        </Button>
                      ) : (
                        <Button onClick={goToNextLesson}>
                          Next Lesson
                          <Icons.arrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Tabs for additional content */}
                  <div className="mt-12">
                    <Tabs defaultValue="description">
                      <TabsList className="w-full border-b rounded-none justify-start mb-4">
                        <TabsTrigger value="description">
                          Description
                        </TabsTrigger>

                        {currentLesson.attachments.length > 0 && (
                          <TabsTrigger value="resources">Resources</TabsTrigger>
                        )}

                        <TabsTrigger value="discussions">
                          Discussions
                        </TabsTrigger>
                        <TabsTrigger value="3dai">3Tedu AI</TabsTrigger>
                      </TabsList>

                      <TabsContent value="description" className="pt-4">
                        {currentLesson.description ? (
                          <div className="prose prose-slate max-w-none dark:prose-invert">
                            <p>{currentLesson.description}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">
                            No description available for this lesson.
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="resources" className="pt-4">
                        {currentLesson.attachments.length > 0 ? (
                          <div className="space-y-4">
                            {currentLesson.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 border rounded-md"
                              >
                                <div className="flex items-center">
                                  <Icons.fileText className="h-5 w-5 mr-3 text-primary" />
                                  <div>
                                    <div className="font-medium">
                                      {attachment.fileName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {attachment.fileSize}
                                    </div>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={attachment.fileUrl} download>
                                    <Icons.download className="mr-2 h-4 w-4" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">
                            No resources available for this lesson.
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="discussions" className="pt-4">
                        {currentLesson.discussions.length > 0 ? (
                          <div className="space-y-6">
                            {currentLesson.discussions.map((thread) => (
                              <div
                                key={thread.id}
                                className="border rounded-md overflow-hidden"
                              >
                                <div className="p-4 bg-muted/50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                      <div className="h-10 w-10 rounded-full overflow-hidden">
                                        <img
                                          src={thread.authorAvatar}
                                          alt={thread.authorName}
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {thread.authorName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(
                                            thread.createdAt
                                          ).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    {thread.isResolved && (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200"
                                      >
                                        Resolved
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-medium mt-3">
                                    {thread.title}
                                  </h4>
                                  <p className="mt-2">{thread.content}</p>
                                </div>

                                <Separator />

                                {thread.posts.length > 0 && (
                                  <div className="p-4 space-y-4">
                                    {thread.posts.map((post) => (
                                      <div
                                        key={post.id}
                                        className="flex space-x-3"
                                      >
                                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                          <img
                                            src={post.userAvatar}
                                            alt={post.userName}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-muted rounded-md p-3">
                                            <div className="flex justify-between">
                                              <div className="font-medium">
                                                {post.userName}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {new Date(
                                                  post.createdAt
                                                ).toLocaleString()}
                                              </div>
                                            </div>
                                            <p className="mt-2">
                                              {post.content}
                                            </p>
                                          </div>

                                          {post.replies &&
                                            post.replies.length > 0 && (
                                              <div className="mt-3 pl-6 space-y-3">
                                                {post.replies.map((reply) => (
                                                  <div
                                                    key={reply.id}
                                                    className="flex space-x-3"
                                                  >
                                                    <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0">
                                                      <img
                                                        src={reply.userAvatar}
                                                        alt={reply.userName}
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                    <div className="flex-1 bg-muted/50 rounded-md p-2">
                                                      <div className="flex justify-between">
                                                        <div className="font-medium text-sm">
                                                          {reply.userName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                          {new Date(
                                                            reply.createdAt
                                                          ).toLocaleString()}
                                                        </div>
                                                      </div>
                                                      <p className="mt-1 text-sm">
                                                        {reply.content}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Icons.messageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                            <h3 className="mt-4 font-medium text-lg">
                              No discussions yet
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              Be the first to ask a question about this lesson.
                            </p>
                            <Button className="mt-4">Start a Discussion</Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="3dai" className="pt-4">
                        {/* AI 3D Avatar */}
                        <div
                          style={{
                            width: "400px",
                            borderLeft: "1px solid #ccc",
                          }}
                        >
                          <AvatarCanvas />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar (supplementary content, notes, etc) */}
            <div className="hidden xl:block xl:col-span-3">
              <div className="sticky top-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">Your Progress</h3>
                    <Progress
                      value={course.progress.percentage}
                      className="h-2 mb-2"
                    />
                    <div className="text-sm text-muted-foreground">
                      {course.progress.completed} of {course.progress.total}{" "}
                      lessons completed ({course.progress.percentage}%)
                    </div>

                    <Separator className="my-4" />

                    {/* <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Video playback rate</span>
                        <div className="font-medium">1.0x</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Auto-play next lesson</span>
                        <div className="font-medium">Off</div>
                      </div>
                    </div> */}

                    {/* AI 3D Avatar */}
                    {/* <div
                      style={{ width: "300px", borderLeft: "1px solid #ccc" }}
                    >
                      <AvatarCanvas />
                    </div> */}

                    <Separator className="my-4" />

                    <h3 className="font-medium mb-3">Course Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <Icons.clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <div>Duration: 12 hours</div>
                          <div className="text-xs text-muted-foreground">
                            25 Lessons
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Icons.barChart className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <div>Level: Intermediate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
