// src/pages/CoursesPage.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Import SheetClose
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card'; // Import từ ui/card
import { Icons } from '@/components/common/Icons'; // Search, Loader2, XCircle, PackageOpen, Filter, ChevronDown, ListRestart
import {
  CourseFiltersSidebar,
  CourseFilterKey,
  MAX_COURSE_PRICE,
} from '@/components/courses/CourseFiltersSidebar'; // Import sidebar mới
import CourseCardv2 from '@/components/courses/CourseCardv2'; // Hoặc CourseCard nếu bạn dùng tên đó
import { useCourses } from '@/hooks/queries/course.queries';
import { useCategories } from '@/hooks/queries/category.queries';
import { useLevels } from '@/hooks/queries/level.queries';
import { useLanguages } from '@/hooks/queries/language.queries';
import { useDebounce } from '@/hooks/useDebounce'; // Đảm bảo hook này tồn tại
import PaginationControls from '@/components/admin/PaginationControls'; // Đảm bảo component này tồn tại và đúng props
import {
  CourseQueryParams,
  SortByValue,
  SORT_OPTIONS,
} from '@/types/common.types';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 9; // Giảm số lượng item để grid 3 cột trông đẹp hơn

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- State Quản lý Filters, Search, Sort, Pagination ---
  const queryParamsFromUrl = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [searchTerm, setSearchTerm] = useState(
    queryParamsFromUrl.get('q') || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [sortBy, setSortBy] = useState<SortByValue>(
    (queryParamsFromUrl.get('sort') as SortByValue) || SORT_OPTIONS[0].value
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(queryParamsFromUrl.get('page') || '1', 10)
  );

  const [activeFilters, setActiveFilters] = useState<CourseFilterKey>(() => {
    const levelsStr = queryParamsFromUrl.get('levels');
    const ratingStr = queryParamsFromUrl.get('rating');
    const categoryIdStr = queryParamsFromUrl.get('categoryId');
    const levelIdStr = queryParamsFromUrl.get('levelId');
    const languageStr = queryParamsFromUrl.get('language');
    const minPriceStr = queryParamsFromUrl.get('minPrice');
    const maxPriceStr = queryParamsFromUrl.get('maxPrice');
    const isFreeStr = queryParamsFromUrl.get('isFree');
    const isFeaturedStr = queryParamsFromUrl.get('isFeatured');

    return {
      categoryId: categoryIdStr ? parseInt(categoryIdStr) : undefined,
      levelId: levelIdStr ? parseInt(levelIdStr) : undefined,
      language: languageStr || undefined,
      minPrice: minPriceStr ? parseInt(minPriceStr) : 0, // Mặc định 0
      maxPrice: maxPriceStr ? parseInt(maxPriceStr) : MAX_COURSE_PRICE, // Mặc định MAX_PRICE
      minRating: ratingStr ? parseFloat(ratingStr) : undefined,
      isFree:
        isFreeStr === 'true' ? true : isFreeStr === 'false' ? false : undefined,
      isFeatured:
        isFeaturedStr === '1' ? 1 : isFeaturedStr === '0' ? 0 : undefined,
    };
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // --- Fetch dữ liệu cho Filters ---
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories({ limit: 100 }) || {}; // limit 0 để lấy tất cả
  const { data: levelsData, isLoading: isLoadingLevels } = useLevels() || {};
  const { data: languagesData, isLoading: isLoadingLanguages } =
    useLanguages({ isActive: true }) || {}; // Chỉ lấy ngôn ngữ active

  // --- Fetch Khóa học ---
  const queryParamsForAPI: CourseQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      searchTerm: debouncedSearchTerm || undefined,
      sortBy: sortBy,
      categoryId: activeFilters.categoryId,
      levelId: activeFilters.levelId,
      language: activeFilters.language,
      minPrice:
        activeFilters.minPrice === 0 ? undefined : activeFilters.minPrice, // không gửi nếu là 0
      maxPrice:
        activeFilters.maxPrice === MAX_COURSE_PRICE
          ? undefined
          : activeFilters.maxPrice, // không gửi nếu là max
      minRating: activeFilters.minRating,
      isFree: activeFilters.isFree,
      isFeatured: activeFilters.isFeatured,
      userPage: true, // Nếu bạn cần lấy khóa học của người dùng
    }),
    [currentPage, debouncedSearchTerm, sortBy, activeFilters]
  );

  const {
    data: courseData,
    isLoading: isLoadingCoursesInitial, // Loading ban đầu
    isFetching: isFetchingCourses, // Fetching cho các lần sau (search, filter, page)
    isError,
    error,
  } = useCourses(queryParamsForAPI, {
    placeholderData: (prevData) => prevData, // Giữ data cũ khi fetching
  });

  const courses = courseData?.courses || [];
  const totalItems = courseData?.total || 0;
  const totalPages =
    courseData?.totalPages || Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  // --- Xử lý thay đổi URL khi state thay đổi ---
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== SORT_OPTIONS[0].value) params.set('sort', sortBy);

    if (activeFilters.categoryId)
      params.set('categoryId', activeFilters.categoryId.toString());
    if (activeFilters.levelId)
      params.set('levelId', activeFilters.levelId.toString());
    if (activeFilters.language) params.set('language', activeFilters.language);
    if (activeFilters.minPrice && activeFilters.minPrice > 0)
      params.set('minPrice', activeFilters.minPrice.toString());
    if (activeFilters.maxPrice && activeFilters.maxPrice < MAX_COURSE_PRICE)
      params.set('maxPrice', activeFilters.maxPrice.toString());
    if (activeFilters.minRating)
      params.set('rating', activeFilters.minRating.toString());
    if (activeFilters.isFree !== undefined)
      params.set('isFree', activeFilters.isFree.toString());
    if (activeFilters.isFeatured !== undefined)
      params.set('isFeatured', activeFilters.isFeatured.toString());

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [
    debouncedSearchTerm,
    currentPage,
    sortBy,
    activeFilters,
    location.pathname,
    navigate,
  ]);

  // Reset về trang 1 khi filter, search, sort thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeFilters, sortBy]);

  const handleFilterChange = useCallback(
    <K extends keyof CourseFilterKey>(
      key: K,
      value: CourseFilterKey[K] | null
    ) => {
      setActiveFilters((prev) => {
        const newState = {
          ...prev,
          [key]: value === undefined || value === '' ? null : value,
        };
        // Nếu clear một filter, giá trị có thể là null/undefined
        if (value === null || value === undefined || value === '') {
          delete newState[key]; // Xóa key nếu giá trị là null/undefined/empty string để URL sạch hơn
        }
        return newState;
      });
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setActiveFilters({
      categoryId: undefined,
      levelId: undefined,
      language: undefined,
      minPrice: 0,
      maxPrice: MAX_COURSE_PRICE,
      minRating: undefined,
      isFree: undefined,
      isFeatured: undefined,
    });
    // setSearchTerm(''); // Tùy bạn muốn reset cả search term không
    // setSortBy(SORT_OPTIONS[0].value); // Tùy bạn muốn reset cả sort không
  }, []);

  const isLoadingAllFiltersData =
    isLoadingCategories || isLoadingLevels || isLoadingLanguages;

  // --- Animation Variants ---
  const headerVariants = {
    /* ... giữ nguyên ... */
  };
  const listContainerVariants = {
    hidden: { opacity: 1 }, // Để skeleton không bị FOUC
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className='bg-gradient-to-b from-slate-100 via-slate-50 to-background dark:from-slate-900 dark:via-slate-800/70 dark:to-background border-b dark:border-slate-700/50'>
        <motion.div
          variants={headerVariants}
          initial='hidden'
          animate='visible'
          className='container mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-12 text-center'
        >
          <h1 className='text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-50 mb-4 tracking-tight'>
            Explore Our Courses
          </h1>
          <p className='text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto'>
            Find your next learning adventure. Filter by category, level, price,
            and more to discover the perfect course.
          </p>
        </motion.div>
      </div>

      <div className='container mx-auto px-4 py-8 md:py-10'>
        <div className='flex flex-col lg:flex-row gap-x-8 gap-y-6'>
          {/* Filters Sidebar */}
          <div className='lg:w-1/4 xl:w-1/5 lg:sticky lg:top-24 self-start max-h-[calc(100vh-120px)] lg:overflow-y-auto custom-scrollbar'>
            {' '}
            {/* Sticky và scroll cho sidebar */}
            {/* Mobile Filter Button */}
            <div className='lg:hidden mb-6'>
              <Sheet
                open={showMobileFilters}
                onOpenChange={setShowMobileFilters}
              >
                <SheetTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full h-12 text-base flex items-center justify-center gap-2 shadow-sm'
                  >
                    <Icons.filter className='h-5 w-5' /> Show Filters & Sort
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side='left'
                  className='w-[320px] sm:w-[350px] p-0 flex flex-col'
                >
                  <SheetHeader className='p-5 pb-3 border-b dark:border-slate-700'>
                    <SheetTitle className='text-xl'>Filters & Sort</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className='flex-grow'>
                    <div className='p-5'>
                      <CourseFiltersSidebar
                        filters={activeFilters}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        categories={categoriesData?.categories || []}
                        levels={levelsData?.levels || []}
                        languages={languagesData?.languages || []}
                        isLoadingFilters={isLoadingAllFiltersData}
                      />
                    </div>
                  </ScrollArea>
                  <div className='p-4 border-t dark:border-slate-700'>
                    <SheetClose asChild>
                      <Button
                        className='w-full h-11 text-base'
                        onClick={() => setShowMobileFilters(false)}
                      >
                        Apply & View Courses
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* Desktop Filter Sidebar */}
            <div className='hidden lg:block'>
              <CourseFiltersSidebar
                filters={activeFilters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                categories={categoriesData?.categories || []}
                levels={levelsData?.levels || []}
                languages={languagesData?.languages || []}
                isLoadingFilters={isLoadingAllFiltersData}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className='w-full lg:flex-1 min-w-0'>
            {' '}
            {/* min-w-0 quan trọng cho flex item */}
            {/* Search and Sort Controls */}
            <div className='flex flex-col md:flex-row gap-4 mb-6 md:mb-8 items-center'>
              <div className='relative flex-grow w-full'>
                <Icons.search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none' />
                <Input
                  type='search'
                  placeholder="Search courses, e.g., 'Python', 'Web Design'..."
                  className='pl-11 h-12 text-base rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 focus-visible:ring-primary'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {(isLoadingCoursesInitial || isFetchingCourses) &&
                  debouncedSearchTerm && (
                    <Loader2 className='absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground' />
                  )}
              </div>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortByValue)}
              >
                <SelectTrigger className='w-full md:w-[240px] h-12 text-base rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 focus:ring-primary'>
                  <SelectValue placeholder='Sort by...' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className='px-3 py-1.5'>Sort By</SelectLabel>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className='text-base h-10'
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {/* Results Count and Status */}
            {(isLoadingCoursesInitial || isFetchingCourses) && !courseData && (
              <div className='text-sm text-muted-foreground mb-4 flex items-center'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Loading
                courses...
              </div>
            )}
            {!isLoadingCoursesInitial && !isFetchingCourses && !isError && (
              <div className='mb-5 text-sm text-muted-foreground'>
                Showing{' '}
                <span className='font-semibold text-foreground'>
                  {courses.length}
                </span>{' '}
                of{' '}
                <span className='font-semibold text-foreground'>
                  {totalItems}
                </span>{' '}
                courses.
                {isFetchingCourses && (
                  <Loader2 className='inline ml-2 h-4 w-4 animate-spin' />
                )}
              </div>
            )}
            {/* Course Grid or Skeletons or Error Message */}
            {isLoadingCoursesInitial && !courseData ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6'>
                {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
                  <Card
                    key={`course-skeleton-${index}`}
                    className='flex flex-col rounded-xl overflow-hidden'
                  >
                    <Skeleton className='aspect-video w-full' />
                    <CardHeader className='p-4 pb-2'>
                      <Skeleton className='h-4 w-1/3 mb-1.5' />
                      <Skeleton className='h-5 w-full mb-1' />
                      <Skeleton className='h-3.5 w-3/4' />
                    </CardHeader>
                    <CardContent className='p-4 pt-1 flex-grow'>
                      <Skeleton className='h-3 w-full mb-2' />
                      <Skeleton className='h-3 w-1/2' />
                    </CardContent>
                    <CardFooter className='p-4 pt-2 border-t mt-auto dark:border-slate-700'>
                      <Skeleton className='h-7 w-1/3' />
                      <Skeleton className='h-5 w-1/4 ml-auto' />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='text-center py-16 bg-destructive/10 dark:bg-destructive/20 p-8 rounded-lg border border-destructive/30'
              >
                <Icons.alertTriangle className='mx-auto h-16 w-16 mb-6 text-destructive' />
                <h3 className='text-2xl font-semibold mb-3 text-destructive-foreground dark:text-destructive'>
                  Failed to Load Courses
                </h3>
                <p className='text-destructive/80 dark:text-destructive/90 mb-6'>
                  {error?.message || 'An unexpected error occurred.'}
                </p>
                <Button
                  variant='destructive'
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </motion.div>
            ) : courses.length > 0 ? (
              <motion.div
                variants={listContainerVariants}
                initial='hidden'
                animate='visible'
                className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6'
              >
                {courses.map((course) => (
                  <CourseCardv2 key={course.courseId} course={course} />
                ))}
              </motion.div>
            ) : (
              !isFetchingCourses && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-center py-20 col-span-full bg-slate-50 dark:bg-slate-800/30 p-8 rounded-lg border-2 border-dashed dark:border-slate-700'
                >
                  <Icons.packageOpen className='mx-auto h-20 w-20 text-muted-foreground opacity-60 mb-6' />
                  <h3 className='text-2xl font-semibold text-foreground'>
                    No Courses Found
                  </h3>
                  <p className='mt-2 text-muted-foreground max-w-md mx-auto'>
                    We couldn't find any courses matching your current criteria.
                    Try adjusting your search or filters, or check back later
                    for new additions!
                  </p>
                  {(debouncedSearchTerm ||
                    Object.values(activeFilters).some(
                      (v) =>
                        v !== null &&
                        v !== undefined &&
                        v !== 0 &&
                        v !== MAX_COURSE_PRICE
                    )) && (
                    <Button
                      variant='outline'
                      className='mt-6'
                      onClick={() => {
                        setSearchTerm('');
                        handleResetFilters();
                      }}
                    >
                      <Icons.listRestart className='mr-2 h-4 w-4' /> Clear All
                      Filters & Search
                    </Button>
                  )}
                </motion.div>
              )
            )}
            {/* Pagination */}
            {!isError && totalItems > 0 && totalPages > 1 && (
              <div className='flex justify-center mt-10 md:mt-12'>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={(page) => setCurrentPage(page)} // Sửa lại prop name nếu PaginationControls dùng khác
                  isDisabled={isFetchingCourses}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursesPage;
