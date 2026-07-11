import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/common/Icons'; // Cần Search, AlertTriangle, PackageOpen, ChevronRight, Filter
import CourseCard from '@/components/courses/CourseCard';
import { useCategoryBySlug } from '@/hooks/queries/category.queries'; // Giả sử có hook lấy theo slug
import { useCoursesByCategorySlug } from '@/hooks/queries/course.queries';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import PaginationControls from '@/components/admin/PaginationControls';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'; // Cho filter trên mobile
import { motion, AnimatePresence } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  CourseFilterKey,
  CourseFiltersSidebar,
  MAX_COURSE_PRICE,
} from '@/components/courses/CourseFiltersSidebar';
import {
  CourseQueryParams,
  SORT_OPTIONS,
  SortByValue,
} from '@/types/common.types';
import { useLanguages } from '@/hooks/queries/language.queries';
import { useLevels } from '@/hooks/queries/level.queries';

const ITEMS_PER_PAGE_CATEGORY_DETAIL = 9; // Số khóa học mỗi trang

const CategoryDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParamsFromUrl = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // States cho search, page, và filters (level, price, rating, etc. KHÔNG BAO GỒM categoryId)
  const [searchTerm, setSearchTerm] = useState(
    queryParamsFromUrl.get('q') || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(
    parseInt(queryParamsFromUrl.get('page') || '1', 10)
  );

  const [activeSubFilters, setActiveSubFilters] = useState<
    Omit<CourseFilterKey, 'categoryId'>
  >(() => {
    // Khởi tạo các sub-filters từ URL, loại bỏ categoryId
    const levelIdStr = queryParamsFromUrl.get('levels');
    const ratingStr = queryParamsFromUrl.get('rating');
    const languageStr = queryParamsFromUrl.get('language');
    const minPriceStr = queryParamsFromUrl.get('minPrice');
    const maxPriceStr = queryParamsFromUrl.get('maxPrice');
    const isFreeStr = queryParamsFromUrl.get('isFree');
    const isFeaturedStr = queryParamsFromUrl.get('isFeatured');

    return {
      levelId: levelIdStr ? parseInt(levelIdStr) : undefined,
      language: languageStr || undefined,
      minPrice: minPriceStr ? parseInt(minPriceStr) : 0,
      maxPrice: maxPriceStr ? parseInt(maxPriceStr) : MAX_COURSE_PRICE,
      minRating: ratingStr ? parseFloat(ratingStr) : undefined,
      isFree:
        isFreeStr === 'true'
          ? true
          : isFreeStr === 'false'
            ? undefined
            : undefined,
      isFeatured:
        isFeaturedStr === '1' ? 1 : isFeaturedStr === '0' ? 0 : undefined,
    };
  });
  const [sortBy, setSortBy] = useState<SortByValue>(
    (queryParamsFromUrl.get('sort') as SortByValue) || SORT_OPTIONS[0].value
  );

  // Fetch category detail
  const {
    data: category,
    isLoading: isLoadingCategory,
    error: categoryError,
  } = useCategoryBySlug(slug);

  // Fetch data cho filters
  const { data: levelsData, isLoading: isLoadingLevels } = useLevels() || {};
  const { data: languagesData, isLoading: isLoadingLanguages } =
    useLanguages({ isActive: true }) || {};
  const isLoadingAllFiltersData = isLoadingLevels || isLoadingLanguages;

  // Fetch courses, truyền categoryId từ category detail vào
  const queryParamsForAPI: CourseQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE_CATEGORY_DETAIL,
      searchTerm: debouncedSearchTerm || undefined,
      sortBy: sortBy,
      categoryId: category?.categoryId, // Luôn filter theo categoryId của trang này
      levelId: activeSubFilters.levelId,
      language: activeSubFilters.language,
      minPrice:
        activeSubFilters.minPrice === 0 ? undefined : activeSubFilters.minPrice,
      maxPrice:
        activeSubFilters.maxPrice === MAX_COURSE_PRICE
          ? undefined
          : activeSubFilters.maxPrice,
      minRating: activeSubFilters.minRating,
      isFree: activeSubFilters.isFree,
      isFeatured: activeSubFilters.isFeatured,
    }),
    [
      currentPage,
      debouncedSearchTerm,
      sortBy,
      activeSubFilters,
      category?.categoryId,
    ]
  );

  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    isFetching: isFetchingCourses,
    error: coursesError,
  } = useCoursesByCategorySlug(slug as string, queryParamsForAPI, {
    enabled: !!slug && !!category?.categoryId, // Chỉ fetch courses khi đã có slug VÀ categoryId
    placeholderData: (prev) => prev,
  });

  const courses = coursesData?.courses || [];
  const totalPages = coursesData?.totalPages || 1;
  const totalCoursesInCategory = coursesData?.total || 0;

  // Cập nhật URL khi state thay đổi
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== SORT_OPTIONS[0].value) params.set('sort', sortBy);

    // Chỉ thêm các sub-filters vào URL
    if (activeSubFilters.levelId)
      params.set('levelId', activeSubFilters.levelId.toString());
    if (activeSubFilters.language)
      params.set('language', activeSubFilters.language);
    if (activeSubFilters.minPrice && activeSubFilters.minPrice > 0)
      params.set('minPrice', activeSubFilters.minPrice.toString());
    if (
      activeSubFilters.maxPrice &&
      activeSubFilters.maxPrice < MAX_COURSE_PRICE
    )
      params.set('maxPrice', activeSubFilters.maxPrice.toString());
    if (activeSubFilters.minRating)
      params.set('rating', activeSubFilters.minRating.toString());
    if (activeSubFilters.isFree !== undefined)
      params.set('isFree', activeSubFilters.isFree.toString());
    if (activeSubFilters.isFeatured !== undefined)
      params.set('isFeatured', activeSubFilters.isFeatured.toString());

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [
    debouncedSearchTerm,
    currentPage,
    sortBy,
    activeSubFilters,
    location.pathname,
    navigate,
  ]);

  // Reset trang khi filter hoặc search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeSubFilters, sortBy]);

  const handleSubFilterChange = useCallback(
    <K extends keyof CourseFilterKey>(
      key: K,
      value: CourseFilterKey[K] | null
    ) => {
      setActiveSubFilters((prev) => {
        const newState = {
          ...prev,
          [key]: value === undefined || value === '' ? null : value,
        };
        if (value === null || value === undefined || value === '') {
          delete newState[key as keyof typeof prev];
        }
        return newState;
      });
    },
    []
  );

  const handleResetSubFilters = useCallback(() => {
    setActiveSubFilters({
      levelId: undefined,
      language: undefined,
      minPrice: 0,
      maxPrice: MAX_COURSE_PRICE,
      minRating: undefined,
      isFree: undefined,
      isFeatured: undefined,
    });
  }, []);

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Các item con sẽ xuất hiện lần lượt
        delayChildren: 0.2,
      },
    },
  };

  if (isLoadingCategory) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-10 min-h-[calc(100vh-200px)] flex items-center justify-center'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
        </div>
      </Layout>
    );
  }

  if (categoryError || !category) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-10'>
          <div className='text-center py-16 bg-destructive/10 p-8 rounded-lg'>
            <Icons.alertTriangle className='h-16 w-16 mx-auto mb-6 text-destructive' />
            <h3 className='text-2xl font-semibold mb-3 text-destructive'>
              Category Not Found
            </h3>
            <p className='text-muted-foreground mb-6'>
              The category "{slug}" you're looking for doesn't exist or has been
              removed.
            </p>
            <Button variant='outline' asChild>
              <Link to='/categories'>Browse All Categories</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryImage =
    category.iconUrl ||
    `https://source.unsplash.com/random/1200x400/?${category?.categoryName
      ?.toLowerCase()
      .replace(/\s+/g, ',')}&abstract`;

  return (
    <Layout>
      {/* Category Header Section */}
      {category && (
        <>
          <div className='relative pt-10 pb-8 md:pt-16 md:pb-12 bg-gradient-to-b from-slate-100 to-background dark:from-slate-900 dark:to-background'>
            <div className='absolute inset-0 opacity-30 dark:opacity-20 overflow-hidden'>
              <img
                src={categoryImage}
                alt={`${category.categoryName} background`}
                className='w-full h-full object-cover blur-md scale-110'
              />
            </div>
            <div className='container mx-auto px-4 relative z-10'>
              <Breadcrumb className='mb-6'>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to='/'>Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to='/categories'>Categories</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className='font-semibold'>
                      {category.categoryName}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <motion.h1
                variants={headerVariants}
                initial='hidden'
                animate='visible'
                className='text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 tracking-tight'
              >
                {category.categoryName} Courses
              </motion.h1>
              {category.description && (
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { delay: 0.2, duration: 0.5 },
                    },
                  }}
                  initial='hidden'
                  animate='visible'
                  className='text-lg text-slate-600 dark:text-slate-400 max-w-3xl mb-1'
                >
                  {category.description}
                </motion.p>
              )}
              <p className='text-sm text-muted-foreground'>
                {totalCoursesInCategory > 0
                  ? `${totalCoursesInCategory} courses available`
                  : 'No courses yet in this category.'}
              </p>
            </div>
          </div>

          <div className='container mx-auto px-4 py-8 md:py-10'>
            <div className='max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10'>
              {/* Filter Sidebar - Desktop */}
              <div className='hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-4 -mr-4'>
                {' '}
                {/* top-24 là chiều cao navbar + padding */}
                <CourseFiltersSidebar
                  filters={activeSubFilters} // Truyền sub-filters
                  onFilterChange={handleSubFilterChange} // Dùng hàm cho sub-filters
                  onResetFilters={handleResetSubFilters}
                  levels={levelsData?.levels || []}
                  languages={languagesData?.languages || []}
                  isLoadingFilters={isLoadingAllFiltersData}
                  currentContextCategoryId={category.categoryId} // **QUAN TRỌNG**
                />
              </div>

              {/* Main Content: Search, Courses Grid, Pagination */}
              <div className='flex-1 min-w-0'>
                {' '}
                {/* min-w-0 để grid không bị tràn */}
                <div className='flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 gap-4'>
                  <div className='relative w-full sm:flex-grow'>
                    <Icons.search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
                    <Input
                      type='search'
                      placeholder={`Search within ${category.categoryName}...`}
                      className='pl-11 h-12 text-base rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {/* Filter Button - Mobile */}
                  <div className='lg:hidden w-full sm:w-auto'>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant='outline'
                          className='w-full sm:w-auto h-12 text-base flex items-center justify-center gap-2'
                        >
                          <Icons.filter className='h-5 w-5' /> Filters & Sort
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side='left'
                        className='w-[320px] sm:w-[360px] p-0 flex flex-col'
                      >
                        <SheetHeader className='p-6 pb-4 border-b'>
                          <SheetTitle className='text-xl'>
                            Filters & Sort
                          </SheetTitle>
                        </SheetHeader>
                        <ScrollArea className='flex-grow'>
                          <div className='p-5'>
                            <CourseFiltersSidebar
                              filters={activeSubFilters} // Truyền sub-filters
                              onFilterChange={handleSubFilterChange} // Dùng hàm cho sub-filters
                              onResetFilters={handleResetSubFilters}
                              // categories prop không cần thiết ở đây vì đã filter theo category hiện tại
                              levels={levelsData?.levels || []}
                              languages={languagesData?.languages || []}
                              isLoadingFilters={isLoadingAllFiltersData}
                              currentContextCategoryId={category.categoryId} // **QUAN TRỌNG**
                            />
                          </div>
                        </ScrollArea>
                        <div className='p-4 border-t'>
                          <SheetClose asChild>
                            <Button className='w-full'>Apply Filters</Button>
                          </SheetClose>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
                {/* Course Grid & Status Messages */}
                {isLoadingCourses && (
                  <motion.div
                    variants={containerVariants}
                    initial='hidden'
                    animate='visible'
                    className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8'
                  >
                    {[...Array(ITEMS_PER_PAGE_CATEGORY_DETAIL)].map(
                      (_, index) => (
                        <Card
                          key={index}
                          className='overflow-hidden rounded-xl border dark:border-slate-700'
                        >
                          <Skeleton className='w-full aspect-[16/10]' />
                          <CardContent className='p-5 space-y-3'>
                            <Skeleton className='h-5 w-2/3 mb-1' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-3/4' />
                            <div className='flex justify-between items-center mt-2'>
                              <Skeleton className='h-4 w-1/4' />
                              <Skeleton className='h-8 w-1/3' />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </motion.div>
                )}
                {coursesError && (
                  <div className='text-center py-16 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-8 rounded-lg'>
                    <Icons.alertTriangle className='h-16 w-16 mx-auto mb-6' />
                    <h3 className='text-2xl font-semibold mb-3 text-destructive'>
                      Failed to Load Courses
                    </h3>
                    <p className='text-red-700 dark:text-red-300'>
                      There was an issue fetching courses for this category.
                      Please try again.
                    </p>
                  </div>
                )}
                {!isLoadingCourses && !coursesError && courses.length > 0 && (
                  <motion.div
                    variants={containerVariants}
                    initial='hidden'
                    animate='visible'
                    className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8'
                  >
                    {courses.map((course) => (
                      <CourseCard key={course.courseId} course={course} />
                    ))}
                  </motion.div>
                )}
                {!isLoadingCourses && !coursesError && courses.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-center py-16 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-lg'
                  >
                    <Icons.packageOpen className='h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-70' />
                    <h3 className='text-2xl font-semibold text-foreground mb-3'>
                      {debouncedSearchTerm ||
                      Object.keys(activeSubFilters).length > 0
                        ? 'No Matching Courses Found'
                        : 'No Courses Yet'}
                    </h3>
                    <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
                      {debouncedSearchTerm ||
                      Object.keys(activeSubFilters).length > 0
                        ? `We couldn't find any courses matching your criteria in "${category.categoryName}". Try adjusting your search or filters.`
                        : `There are currently no courses available in the "${category.categoryName}" category. Please check back later!`}
                    </p>
                    {(debouncedSearchTerm ||
                      Object.keys(activeSubFilters).length > 0) && (
                      <Button
                        variant='outline'
                        onClick={() => {
                          setSearchTerm('');
                          setActiveSubFilters({
                            levelId: undefined,
                            language: undefined,
                            minPrice: 0,
                            maxPrice: MAX_COURSE_PRICE,
                            minRating: undefined,
                            isFree: undefined,
                            isFeatured: undefined,
                          });
                          // setCurrentPage(1); // Đã có useEffect xử lý
                        }}
                      >
                        Clear Search & Filters
                      </Button>
                    )}
                  </motion.div>
                )}
                {!isLoadingCourses && !coursesError && totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={(page) => setCurrentPage(page)}
                    isDisabled={isFetchingCourses}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Footer */}
    </Layout>
  );
};

export default CategoryDetailPage;
