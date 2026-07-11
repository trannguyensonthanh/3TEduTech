/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLearningPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Bỏ CardDescription nếu không dùng
import { Progress } from '@/components/ui/progress';

import { Badge } from '@/components/ui/badge';
import { useMyEnrollments } from '@/hooks/queries/enrollment.queries'; // Import type EnrollmentQueryParams
import {
  BookOpenText,
  PlayCircle,
  Search,
  CheckCircle,
  RotateCcw,
  Loader2,
  Filter as FilterIcon,
  ChevronDown,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import PaginationControls from '@/components/admin/PaginationControls'; // Component phân trang
import { Skeleton } from '@/components/ui/skeleton'; // Skeleton
import { useDebounce } from '@/hooks/useDebounce'; // Hook debounce
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'; // For mobile filters
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Enrollment,
  EnrollmentQueryParams,
} from '@/services/enrollment.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: 'enrolledAt_desc', label: 'Recently Enrolled' },
  { value: 'courseName_asc', label: 'Course Name (A-Z)' },
  { value: 'courseName_desc', label: 'Course Name (Z-A)' },
  { value: 'progress_desc', label: 'Progress (High to Low)' },
  { value: 'progress_asc', label: 'Progress (Low to High)' },
];
type SortByValue = (typeof SORT_OPTIONS)[number]['value'];

const MyCourse: React.FC = () => {
  const navigate = useNavigate();

  // --- States for Filters & Sorting & Pagination ---
  const [activeTab, setActiveTab] = useState<
    'all' | 'inProgress' | 'completed'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortByValue>(SORT_OPTIONS[0].value);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- Query Params ---
  const queryParams: EnrollmentQueryParams = useMemo(() => {
    let statusFilter: 'IN_PROGRESS' | 'COMPLETED' | undefined = undefined;
    if (activeTab === 'inProgress') statusFilter = 'IN_PROGRESS';
    if (activeTab === 'completed') statusFilter = 'COMPLETED';

    return {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      searchTerm: debouncedSearchTerm || undefined,
      sortBy: sortBy,
      status: statusFilter, // Thêm filter status vào API nếu backend hỗ trợ
    };
  }, [currentPage, debouncedSearchTerm, sortBy, activeTab]);

  // --- Fetch Enrollments ---
  const {
    data: enrollmentData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMyEnrollments(queryParams, {
    placeholderData: (prev) => prev,
  });

  const enrollments = enrollmentData?.enrollments || [];
  const totalItems = enrollmentData?.total || 0;
  const totalPages =
    enrollmentData?.totalPages || Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeTab, sortBy]);

  // --- Helper Functions ---
  const calculateProgress = (completed?: number, total?: number): number => {
    if (
      typeof completed !== 'number' ||
      typeof total !== 'number' ||
      total === 0
    ) {
      return 0;
    }
    return Math.min(100, Math.max(0, (completed / total) * 100));
  };

  const getStatusBadge = (progress: number): React.ReactNode => {
    if (progress >= 100) {
      // >= 100 để tránh lỗi float
      return (
        <Badge variant='success' className='text-xs'>
          <CheckCircle size={12} className='mr-1' />
          Completed
        </Badge>
      );
    } else if (progress > 0) {
      return (
        <Badge variant='destructive' className='text-xs'>
          <RotateCcw size={12} className='mr-1 animate-spin-slow' />
          In Progress
        </Badge>
      );
    } else {
      return (
        <Badge variant='secondary' className='text-xs'>
          Not Started
        </Badge>
      );
    }
  };

  // --- Render Skeletons ---
  const renderSkeletons = (count = ITEMS_PER_PAGE) => (
    <div className='grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`skeleton-enroll-${i}`} className='overflow-hidden'>
          <Skeleton className='aspect-video w-full' />
          <CardHeader className='p-4 pb-2'>
            <Skeleton className='h-5 w-3/4 mb-1' />
            <Skeleton className='h-3 w-1/2' />
          </CardHeader>
          <CardContent className='p-4 pt-1 pb-3'>
            <Skeleton className='h-2 w-full mb-1.5 rounded' />
            <div className='flex justify-between mt-2'>
              <Skeleton className='h-3 w-1/4' />
              <Skeleton className='h-4 w-1/4' />
            </div>
          </CardContent>
          <CardFooter className='p-4 pt-0'>
            <Skeleton className='h-9 w-full' />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // --- Main Render ---
  return (
    <Layout>
      <div className='container mx-auto px-4 py-8 md:py-12'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4'>
          <h1 className='text-3xl lg:text-4xl font-bold tracking-tight'>
            My Learning
          </h1>
          {/* Nút Filter cho Mobile */}
          <div className='sm:hidden w-full'>
            <Sheet
              open={isMobileFiltersOpen}
              onOpenChange={setIsMobileFiltersOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full flex items-center justify-center'
                >
                  <SlidersHorizontal className='mr-2 h-4 w-4' /> Filters & Sort
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-[300px] p-0'>
                <SheetHeader className='p-4 border-b'>
                  <SheetTitle>Filter & Sort</SheetTitle>
                </SheetHeader>
                <ScrollArea className='h-[calc(100vh-60px)]'>
                  <div className='p-4 space-y-6'>
                    {/* Search */}
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        type='search'
                        placeholder='Search my courses...'
                        className='pl-9 h-9'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {/* Sort By */}
                    <div>
                      <Label className='text-sm font-medium mb-1.5 block'>
                        Sort by
                      </Label>
                      <Select
                        value={sortBy}
                        onValueChange={(val) => setSortBy(val as SortByValue)}
                      >
                        <SelectTrigger className='h-9'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Tab Filters (hiển thị dạng Select trên mobile) */}
                    <div>
                      <Label className='text-sm font-medium mb-1.5 block'>
                        Status
                      </Label>
                      <Select
                        value={activeTab}
                        onValueChange={(val) => setActiveTab(val as any)}
                      >
                        <SelectTrigger className='h-9'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Courses</SelectItem>
                          <SelectItem value='inProgress'>
                            In Progress
                          </SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Search & Sort */}
        <div className='hidden sm:flex items-center justify-between mb-6 gap-4'>
          <div className='relative flex-grow max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search my courses...'
              className='pl-9 h-9'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isFetching && debouncedSearchTerm && (
              <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin' />
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-9 min-w-[180px] justify-between'
              >
                Sort by:{' '}
                {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
                <ChevronDown className='ml-2 h-4 w-4 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-[220px] p-0'>
              {SORT_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sortBy === opt.value ? 'secondary' : 'ghost'}
                  className='w-full justify-start px-3 py-2 rounded-none text-sm'
                  onClick={() => {
                    setSortBy(opt.value as SortByValue);
                    const RopoverTrigger = document.querySelector(
                      '[data-state="open"][aria-controls^="radix-"]'
                    );
                    if (RopoverTrigger) (RopoverTrigger as HTMLElement).click();
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className='w-full hidden sm:block'
        >
          <TabsList className='mb-8 grid w-full grid-cols-3 sm:w-auto sm:inline-grid'>
            <TabsTrigger value='all'>All Courses ({totalItems})</TabsTrigger>
            <TabsTrigger value='inProgress'>In Progress</TabsTrigger>
            <TabsTrigger value='completed'>Completed</TabsTrigger>
          </TabsList>

          <TabsContent value='all'>
            {/* Content sẽ được render một lần bên dưới */}
          </TabsContent>
          <TabsContent value='inProgress'>
            {/* Content sẽ được render một lần bên dưới */}
          </TabsContent>
          <TabsContent value='completed'>
            {/* Content sẽ được render một lần bên dưới */}
          </TabsContent>
        </Tabs>

        {/* Course Grid - Hiển thị dựa trên state và dữ liệu fetch */}
        {isLoading && !enrollmentData ? ( // Chỉ loading lần đầu
          renderSkeletons()
        ) : isError ? (
          <div className='text-center py-12 text-destructive bg-destructive/10 border border-destructive/30 rounded-md'>
            <AlertTriangle className='h-10 w-10 mx-auto mb-2' />
            <p className='font-semibold'>Failed to load your courses</p>
            <p className='text-sm mt-1'>
              {error?.message || 'Please try again later.'}
            </p>
            <Button
              variant='outline'
              onClick={() => refetch()}
              className='mt-4'
            >
              Retry
            </Button>
          </div>
        ) : enrollments.length === 0 ? (
          <div className='text-center py-16 space-y-4 border border-dashed rounded-lg'>
            <BookOpenText className='h-16 w-16 mx-auto text-muted-foreground opacity-50' />
            <h2 className='text-2xl font-semibold'>No Courses Found</h2>
            <p className='text-muted-foreground'>
              {activeTab === 'all' && !searchTerm
                ? "You haven't enrolled in any courses yet."
                : 'No courses match your current filters.'}
            </p>
            <Button asChild className='mt-4'>
              <Link to='/courses'>Explore Courses</Link>
            </Button>
          </div>
        ) : (
          <div className='grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {enrollments.map((enrollment: Enrollment) => {
              const progress = calculateProgress(
                enrollment.completedLessons,
                enrollment.totalLessons
              );
              return (
                <Card
                  key={enrollment.enrollmentId}
                  className='overflow-hidden flex flex-col group'
                >
                  <Link to={`/courses/${enrollment.slug}`} className='block'>
                    <AspectRatio ratio={16 / 9} className='bg-muted'>
                      <img
                        src={
                          enrollment.thumbnailUrl ||
                          `https://via.placeholder.com/640x360?text=${encodeURIComponent(
                            enrollment.courseName || 'Course'
                          )}`
                        }
                        alt={enrollment.courseName}
                        className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-300'
                        loading='lazy'
                      />
                    </AspectRatio>
                  </Link>
                  <CardHeader className='p-4 pb-2'>
                    <div className='flex justify-between items-start mb-1'>
                      <Link
                        to={`/courses/${enrollment.slug}`}
                        className='hover:text-primary'
                      >
                        <CardTitle
                          className='text-base font-semibold leading-snug line-clamp-2 h-[3em]'
                          title={enrollment.courseName}
                        >
                          {enrollment.courseName}
                        </CardTitle>
                      </Link>
                      {/* Status Badge (nếu cần) */}
                      {getStatusBadge(progress)}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      By {enrollment.instructorName}
                    </p>
                  </CardHeader>
                  <CardContent className='p-4 pt-0 pb-3 flex-grow'>
                    <div className='space-y-1.5'>
                      <div className='flex justify-between items-center text-xs text-muted-foreground'>
                        <span>Progress</span>
                        <span className='font-medium text-foreground'>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className='h-1.5' />
                      <p className='text-xs text-muted-foreground'>
                        {enrollment.completedLessons || 0} of{' '}
                        {enrollment.totalLessons || 0} lessons
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className='p-4 pt-0 border-t mt-auto'>
                    <Button asChild size='sm' className='w-full mt-3'>
                      <Link to={`/courses/${enrollment.slug}`}>
                        {progress > 0 && progress < 100
                          ? 'Continue Learning'
                          : progress >= 100
                            ? 'Review Course'
                            : 'Start Learning'}
                        <PlayCircle className='ml-2 h-4 w-4' />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isError && (
          <div className='flex justify-center mt-8 md:mt-10'>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              isDisabled={isFetching}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyCourse;
