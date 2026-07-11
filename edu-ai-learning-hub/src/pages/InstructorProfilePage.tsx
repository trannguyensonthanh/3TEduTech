import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseCard from '@/components/courses/CourseCard'; // Hoặc CourseCardv2
import ReviewCard from '@/components/reviews/ReviewCard'; // Component mới
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useInstructorPublicProfile } from '@/hooks/queries/instructor.queries';

import { Skeleton } from '@/components/ui/skeleton';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Cho tab reviews
import { Card } from '@/components/ui/card';
import { CourseQueryParams } from '@/services/course.service';
import { InstructorReviewQueryParams } from '@/services/review.service';
import { useCourseReviewsByInstructor } from '@/hooks/queries/review.queries';
import { useMyInstructorCourses } from '@/hooks/queries/course.queries';
import { Badge } from '@/components/ui/badge';
import PaginationControls from '@/components/admin/PaginationControls';

const ITEMS_PER_PAGE_COURSES = 6;
const ITEMS_PER_PAGE_REVIEWS = 5;

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const InstructorProfilePage = () => {
  const { idOrSlug } = useParams(); // idOrSlug will be string | undefined
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  console.log('idOrSlug', idOrSlug);
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'about');
  const [coursesPage, setCoursesPage] = useState(
    parseInt(queryParams.get('coursesPage') || '1', 10)
  );
  const [reviewsPage, setReviewsPage] = useState(
    parseInt(queryParams.get('reviewsPage') || '1', 10)
  );

  // Fetch instructor profile
  // Giả sử hook useInstructorPublicProfile có thể nhận id hoặc slug
  const instructorIdNum =
    idOrSlug && !isNaN(Number(idOrSlug)) ? Number(idOrSlug) : undefined;
  const {
    data: instructor,
    isLoading: isLoadingInstructor,
    error: instructorError,
  } = useInstructorPublicProfile(instructorIdNum);

  const instructorId = instructor?.accountId; // Lấy instructorId sau khi profile được fetch

  // Fetch courses by this instructor
  const courseQueryParams: CourseQueryParams = {
    page: coursesPage,
    limit: ITEMS_PER_PAGE_COURSES,
    sortBy: 'popularity', // Ví dụ
  };
  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    isFetching: isFetchingCourses,
  } = useMyInstructorCourses(courseQueryParams, {
    enabled: !!instructorId,
  });

  const instructorCourses = coursesData?.courses || [];
  const totalCoursesPages = coursesData?.totalPages || 1;

  // Fetch reviews for this instructor
  const reviewQueryParams: InstructorReviewQueryParams = {
    page: reviewsPage,
    limit: ITEMS_PER_PAGE_REVIEWS,
    sortBy: 'reviewedAt:desc',
  };
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isFetching: isFetchingReviews,
  } = useCourseReviewsByInstructor(instructorId, reviewQueryParams, {
    enabled: !!instructorId && activeTab === 'reviews',
  });

  const instructorReviews = reviewsData?.reviews || [];
  const totalReviewsPages = reviewsData?.totalPages || 1;

  // Update URL when tab or pagination changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'about') params.set('tab', activeTab);
    if (activeTab === 'courses' && coursesPage > 1)
      params.set('coursesPage', coursesPage.toString());
    if (activeTab === 'reviews' && reviewsPage > 1)
      params.set('reviewsPage', reviewsPage.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, coursesPage, reviewsPage, location.pathname, navigate]);

  if (isLoadingInstructor) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-10 min-h-[70vh] flex items-center justify-center'>
          <Icons.spinner className='h-16 w-16 animate-spin text-primary' />
        </div>
      </Layout>
    );
  }

  if (instructorError || !instructor) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-10'>
          <div className='text-center py-20 bg-destructive/10 p-8 rounded-lg'>
            <Icons.alertTriangle className='h-16 w-16 mx-auto mb-6 text-destructive' />
            <h3 className='text-2xl font-semibold mb-3 text-destructive-foreground'>
              Instructor Not Found
            </h3>
            <p className='text-muted-foreground mb-6'>
              The instructor you're looking for (ID/Slug: {idOrSlug}) doesn't
              exist or has been removed.
            </p>
            <Button variant='outline' asChild>
              <Link to='/instructors'>Browse All Instructors</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const instructorInitials = instructor.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const coverImage =
    instructor.coverImageUrl ||
    `https://i.pinimg.com/1200x/e6/e0/21/e6e02162b1a8f92f24eb37ac696dc6f1.jpg`; // Placeholder đẹp hơn

  return (
    <Layout>
      <motion.div variants={pageVariants} initial='hidden' animate='visible'>
        {/* Instructor Header Section */}
        <motion.div
          variants={itemVariants}
          className='relative min-h-[300px] md:min-h-[400px] bg-slate-700 '
        >
          <img
            src={coverImage}
            alt={`${instructor.fullName} cover`}
            className='absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-20'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent'></div>

          <div className='container mx-auto px-4 relative flex flex-col items-center justify-end h-full pb-8 md:pb-12 text-center'>
            <Avatar className=' !z-50 w-32 h-32 md:w-40 md:h-40 mb-5 border-4 border-background shadow-xl -mt-12 md:-mt-10'>
              <AvatarImage
                src={instructor.avatarUrl || undefined}
                alt={instructor.fullName}
              />
              <AvatarFallback className='text-4xl md:text-5xl font-semibold bg-slate-200 dark:bg-slate-700'>
                {instructorInitials}
              </AvatarFallback>
            </Avatar>
            <h1 className='text-3xl md:text-4xl font-extrabold text-foreground mb-1.5 tracking-tight'>
              {instructor.fullName}
            </h1>
            <p className='text-lg text-primary dark:text-primary/90 font-medium mb-2'>
              {instructor.professionalTitle || 'Expert Educator'}
            </p>
            {instructor.headline && (
              <p className='text-md text-muted-foreground max-w-2xl mb-4'>
                {instructor.headline}
              </p>
            )}

            <div className='flex items-center justify-center space-x-5 text-sm text-muted-foreground mb-5'>
              {instructor.averageRating != null &&
                instructor.averageRating > 0 && (
                  <div className='flex items-center'>
                    <Icons.star className='w-4 h-4 text-yellow-400 fill-yellow-400 mr-1.5' />
                    <span className='font-semibold text-foreground'>
                      {instructor.averageRating.toFixed(1)}
                    </span>
                    Rating
                  </div>
                )}
              {instructor.totalStudents != null && (
                <div className='flex items-center'>
                  <Icons.users className='w-4 h-4 mr-1.5' />
                  <span className='font-semibold text-foreground'>
                    {instructor.totalStudents.toLocaleString()}
                  </span>
                  <span className='mx-1'>·</span>
                  Students
                </div>
              )}
              {instructor.totalCourses != null && (
                <div className='flex items-center'>
                  <Icons.courses className='w-4 h-4 mr-1.5' />
                  <span className='font-semibold text-foreground'>
                    {instructor.totalCourses}
                  </span>
                  <span className='mx-1'>·</span>
                  Courses
                </div>
              )}
            </div>

            {instructor.socialLinks && instructor.socialLinks.length > 0 && (
              <div className='flex justify-center space-x-4'>
                {instructor.socialLinks.map((link) => {
                  const IconComponent =
                    Icons[link.platform.toLowerCase() as keyof typeof Icons] ||
                    Icons.globe;
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      title={link.platform}
                      className='text-muted-foreground hover:text-primary transition-colors'
                    >
                      <IconComponent className='w-5 h-5' />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs for About, Courses, Reviews */}
        <div className='container mx-auto px-4 py-8 md:py-10'>
          <div className='max-w-5xl mx-auto'>
            {' '}
            {/* Tăng max-width cho content */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full '
            >
              <TabsList className='grid w-full grid-cols-3 md:w-[400px] mx-auto mb-8 shadow-sm bg-muted text-muted-foreground p-1 rounded-md !h-16'>
                <TabsTrigger
                  value='about'
                  className='py-2.5 text-sm sm:text-base rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground '
                >
                  About Me
                </TabsTrigger>
                <TabsTrigger
                  value='courses'
                  className='py-2.5 text-sm sm:text-base rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                >
                  My Courses ({instructor.totalCourses || 0})
                </TabsTrigger>
                <TabsTrigger
                  value='reviews'
                  className='py-2.5 text-sm sm:text-base rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                >
                  Reviews ({reviewsData?.total || 0})
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value='about' forceMount={activeTab === 'about'}>
                    <Card className='p-6 md:p-8 dark:bg-slate-800/30'>
                      {instructor.bio && (
                        <h3 className='text-2xl font-semibold text-foreground mb-4'>
                          Biography
                        </h3>
                      )}
                      <div className='prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed'>
                        {/* Nếu bio là HTML, dùng dangerouslySetInnerHTML. Nếu là plain text, dùng <p> */}
                        {instructor.bio ? (
                          <p>{instructor.bio}</p> // Giả sử bio là plain text
                        ) : (
                          // <div dangerouslySetInnerHTML={{ __html: instructor.bio }} /> // Nếu bio là HTML
                          <p>No biography provided yet.</p>
                        )}
                      </div>

                      {instructor.skills && instructor.skills.length > 0 && (
                        <>
                          <h3 className='text-2xl font-semibold text-foreground mt-8 mb-4'>
                            Skills & Expertise
                          </h3>
                          <div className='flex flex-wrap gap-2'>
                            {instructor.skills.map((skill) => (
                              <Badge
                                key={skill.skillId}
                                variant='secondary'
                                className='text-sm px-3 py-1'
                              >
                                {skill.skillName}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                      {/* TODO: Thêm section Experience nếu API có */}
                    </Card>
                  </TabsContent>

                  <TabsContent
                    value='courses'
                    forceMount={activeTab === 'courses'}
                  >
                    {isLoadingCourses && !instructorCourses ? (
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {[...Array(ITEMS_PER_PAGE_COURSES)].map((_, i) => (
                          <Skeleton key={i} className='h-80 rounded-lg' />
                        ))}
                      </div>
                    ) : instructorCourses.length > 0 ? (
                      <>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                          {instructorCourses.map((course) => (
                            <CourseCard key={course.courseId} course={course} /> // Hoặc CourseCardv2
                          ))}
                        </div>
                        {totalCoursesPages > 1 && (
                          <PaginationControls
                            currentPage={coursesPage}
                            totalPages={totalCoursesPages}
                            setCurrentPage={setCoursesPage}
                            isDisabled={isFetchingCourses}
                            className='mt-8'
                          />
                        )}
                      </>
                    ) : (
                      <div className='text-center py-12 text-muted-foreground'>
                        <Icons.packageOpen className='h-16 w-16 mx-auto mb-4 opacity-50' />
                        This instructor has not published any courses yet.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value='reviews'
                    forceMount={activeTab === 'reviews'}
                  >
                    {isLoadingReviews && !instructorReviews ? (
                      <div className='space-y-6'>
                        {[...Array(ITEMS_PER_PAGE_REVIEWS)].map((_, i) => (
                          <Skeleton
                            key={i}
                            className='h-32 rounded-lg w-full'
                          />
                        ))}
                      </div>
                    ) : instructorReviews.length > 0 ? (
                      <>
                        <div className='space-y-6'>
                          {instructorReviews.map((review) => (
                            <ReviewCard key={review.reviewId} review={review} />
                          ))}
                        </div>
                        {totalReviewsPages > 1 && (
                          <PaginationControls
                            currentPage={reviewsPage}
                            totalPages={totalReviewsPages}
                            setCurrentPage={setReviewsPage}
                            isDisabled={isFetchingReviews}
                            className='mt-8'
                          />
                        )}
                      </>
                    ) : (
                      <div className='text-center py-12 text-muted-foreground'>
                        <Icons.packageOpen className='h-16 w-16 mx-auto mb-4 opacity-50' />
                        No reviews available for this instructor yet.
                      </div>
                    )}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default InstructorProfilePage;
