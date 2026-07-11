// src/pages/Categories.tsx (Hoặc AllCategoriesPage.tsx)
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/common/Icons'; // Cần Icons.search, Icons.alertTriangle, Icons.packageOpen
import CategoryCard from '@/components/categories/CategoryCard'; // Card mới
import { useCategories } from '@/hooks/queries/category.queries';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce'; // Custom hook cho debounce
import PaginationControls from '@/components/admin/PaginationControls'; // Component phân trang
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

// (Nếu chưa có useDebounce, tạo file src/hooks/common/useDebounce.ts)
// export function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);
//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedValue(value), delay);
//     return () => clearTimeout(timer);
//   }, [value, delay]);
//   return debouncedValue;
// }

const ITEMS_PER_PAGE = 12; // Số lượng category mỗi trang

const AllCategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Delay 500ms

  const {
    data: categoriesData,
    isLoading,
    error,
    isFetching,
  } = useCategories({
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const categories = categoriesData?.categories || [];
  const totalPages = categoriesData?.totalPages || 1;
  const totalCategories = categoriesData?.total || 0;

  // Reset về trang 1 khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const containerVariants = {
    hidden: { opacity: 1 }, // Bắt đầu với opacity 1 để tránh FOUC cho skeleton
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07, // Hiệu ứng xuất hiện lần lượt nhanh hơn
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-slate-900/50">
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 pt-12 pb-10 md:pt-16 md:pb-12 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
            Explore Our Course Categories
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Dive into a world of knowledge. Find the perfect learning path
            tailored to your interests and career goals.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {' '}
          {/* Tăng max-width */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 md:mb-10 gap-4">
            <div className="relative w-full sm:max-w-md">
              <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search categories (e.g., Programming, Design)"
                className="pl-11 h-12 text-base rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {totalCategories > 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {categories.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-foreground">
                  {totalCategories}
                </span>{' '}
                categories
              </p>
            )}
          </div>
          {isLoading && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
            >
              {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
                <Card
                  key={index}
                  className="overflow-hidden rounded-xl border dark:border-slate-700"
                >
                  <Skeleton className="w-full aspect-[16/10]" />
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-1/2 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
          {error && (
            <div className="text-center py-16 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-8 rounded-lg">
              <Icons.alertTriangle className="h-16 w-16 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">
                Oops! Something went wrong.
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-6">
                We couldn't load the categories. Please check your connection or
                try again later.
              </p>
              <Button
                variant="destructive"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}
          {!isLoading && !error && categories.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible" // Animate khi data thay đổi (ví dụ khi search)
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
            >
              {categories.map((category) => (
                <CategoryCard key={category.categoryId} category={category} />
              ))}
            </motion.div>
          )}
          {!isLoading && !error && categories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-lg"
            >
              <Icons.packageOpen className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-70" />
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {debouncedSearchTerm
                  ? 'No Categories Found'
                  : 'No Categories Available'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {debouncedSearchTerm
                  ? `We couldn't find any categories matching "${debouncedSearchTerm}". Try a different search term.`
                  : 'It seems there are no categories to display at the moment. Please check back later!'}
              </p>
              {debouncedSearchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search & View All
                </Button>
              )}
            </motion.div>
          )}
          {!isLoading && !error && totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllCategoriesPage;
