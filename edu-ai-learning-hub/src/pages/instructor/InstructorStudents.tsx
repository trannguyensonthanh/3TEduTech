/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/common/Icons'; // Search, Loader2, AlertTriangle, PackageOpen, UsersRound, Filter, ListRestart, MoreHorizontal, ChevronDown, BarChart2, CalendarDays, Mail
import { useMyStudents } from '@/hooks/queries/instructor.queries';
import { useCourses } from '@/hooks/queries/course.queries'; // Để lấy danh sách khóa học của GV cho filter
import { useDebounce } from '@/hooks/useDebounce';
import PaginationControls from '@/components/admin/PaginationControls'; // Component phân trang
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress'; // Progress bar
import { InstructorStudentQueryParams } from '@/services/instructor.service';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

export const INSTRUCTOR_STUDENTS_SORT_OPTIONS: {
  value: InstructorStudentQueryParams['sortBy'];
  label: string;
}[] = [
  {
    value: 'lastLearningActivityTimestamp:desc',
    label: 'Last Learning (Newest)',
  },
  {
    value: 'lastLearningActivityTimestamp:asc',
    label: 'Last Learning (Oldest)',
  },
  { value: 'fullName:asc', label: 'Name (A-Z)' },
  { value: 'fullName:desc', label: 'Name (Z-A)' },
  { value: 'averageCompletionRate:desc', label: 'Avg. Completion (High-Low)' },
  { value: 'averageCompletionRate:asc', label: 'Avg. Completion (Low-High)' },
  { value: 'enrolledCoursesCount:desc', label: 'Courses Enrolled (Most)' },
];
type StudentSortByValue =
  (typeof INSTRUCTOR_STUDENTS_SORT_OPTIONS)[number]['value'];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active Students' },
  { value: 'INACTIVE', label: 'Inactive Students' },
];

const InstructorStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParamsFromUrl = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [searchTerm, setSearchTerm] = useState(
    queryParamsFromUrl.get('q') || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState<StudentSortByValue>(
    (queryParamsFromUrl.get('sort') as StudentSortByValue) ||
      INSTRUCTOR_STUDENTS_SORT_OPTIONS[0].value
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(queryParamsFromUrl.get('page') || '1', 10)
  );

  const [activeFilters, setActiveFilters] = useState<{
    status?: 'ACTIVE' | 'INACTIVE';
    courseId?: number | null;
  }>(() => ({
    status: queryParamsFromUrl.get('status') as
      | 'ACTIVE'
      | 'INACTIVE'
      | undefined,
    courseId: queryParamsFromUrl.get('courseId')
      ? parseInt(queryParamsFromUrl.get('courseId')!)
      : undefined,
  }));

  const { userData: user } = useAuth();
  const instructorId = Number(user?.id); // Ví dụ

  const { data: instructorCoursesData, isLoading: isLoadingInstructorCourses } =
    useCourses(
      { instructorId: instructorId, limit: 100 },
      { enabled: !!instructorId }
    );

  const queryParamsForAPI: InstructorStudentQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      searchTerm: debouncedSearchTerm || undefined,
      sortBy: sortBy as InstructorStudentQueryParams['sortBy'], // Cast nếu cần
      status: activeFilters.status,
      courseId: activeFilters.courseId,
    }),
    [currentPage, debouncedSearchTerm, sortBy, activeFilters]
  );

  const {
    data: studentsData,
    isLoading: isLoadingStudentsInitial,
    isFetching: isFetchingStudents,
    isError,
    error,
  } = useMyStudents(queryParamsForAPI, { enabled: !!instructorId });

  const students = studentsData?.students || [];
  const totalItems = studentsData?.total || 0;
  const totalPages =
    studentsData?.totalPages || Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== INSTRUCTOR_STUDENTS_SORT_OPTIONS[0].value)
      params.set('sort', sortBy);
    if (activeFilters.status) params.set('status', activeFilters.status);
    if (activeFilters.courseId)
      params.set('courseId', activeFilters.courseId.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [
    debouncedSearchTerm,
    currentPage,
    sortBy,
    activeFilters,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeFilters, sortBy]);

  const handleFilterChange = <K extends keyof typeof activeFilters>(
    key: K,
    value: (typeof activeFilters)[K] | null
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: (value as any) === '' ? undefined : value,
    }));
  };

  const handleResetFilters = () => {
    setActiveFilters({ status: undefined, courseId: undefined });
    setSearchTerm('');
    setSortBy(INSTRUCTOR_STUDENTS_SORT_OPTIONS[0].value);
  };
  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Animation Variants
  const listVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
  };

  return (
    <InstructorLayout
      pageTitle='My Students'
      breadcrumbs={[
        { label: 'Dashboard', href: '/instructor' },
        { label: 'Students' },
      ]}
    >
      <div className='space-y-6 md:space-y-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-bold tracking-tight text-foreground'>
              Student Management
            </h1>
            <p className='text-muted-foreground mt-1'>
              Track and manage students enrolled in your courses.
            </p>
          </div>
          <Button size='lg' className='h-11 px-5 text-base w-full sm:w-auto'>
            <Icons.barChart className='w-5 h-5 mr-2' />
            Export Student Report
          </Button>
        </div>

        {/* Filters and Search Bar */}
        <Card className='dark:bg-slate-800/30 shadow'>
          <CardContent className='p-4 md:p-5'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
              <div className='relative lg:col-span-2'>
                <Label
                  htmlFor='student-search'
                  className='text-xs font-medium text-muted-foreground'
                >
                  Search Students
                </Label>
                <Icons.search className='absolute left-3 bottom-3 h-4 w-4 text-muted-foreground pointer-events-none' />
                <Input
                  id='student-search'
                  type='search'
                  placeholder='Search by name or email...'
                  className='pl-10 h-11 text-sm mt-1'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label
                  htmlFor='course-filter'
                  className='text-xs font-medium text-muted-foreground'
                >
                  Filter by Course
                </Label>
                <Select
                  value={activeFilters.courseId?.toString() || ''}
                  onValueChange={(val) =>
                    handleFilterChange('courseId', val ? Number(val) : null)
                  }
                  disabled={isLoadingInstructorCourses}
                >
                  <SelectTrigger className='h-11 text-sm mt-1'>
                    <SelectValue placeholder='All My Courses' />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorCoursesData?.courses.map((course) => (
                      <SelectItem
                        key={course.courseId}
                        value={course.courseId.toString()}
                      >
                        {course.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor='status-filter'
                  className='text-xs font-medium text-muted-foreground'
                >
                  Filter by Status
                </Label>
                <Select
                  value={activeFilters.status || ''}
                  onValueChange={(val) =>
                    handleFilterChange(
                      'status',
                      val as 'ACTIVE' | 'INACTIVE' | undefined
                    )
                  }
                >
                  <SelectTrigger className='h-11 text-sm mt-1'>
                    <SelectValue placeholder='All Statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 mt-4 items-end'>
              <div className='flex-grow'>
                <Label
                  htmlFor='sort-students'
                  className='text-xs font-medium text-muted-foreground'
                >
                  Sort By
                </Label>
                <Select
                  value={sortBy}
                  onValueChange={(val) => setSortBy(val as StudentSortByValue)}
                >
                  <SelectTrigger className='h-11 text-sm mt-1 w-full sm:w-[250px]'>
                    <SelectValue placeholder='Sort students by...' />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUCTOR_STUDENTS_SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant='ghost'
                onClick={handleResetFilters}
                className='h-11 text-muted-foreground hover:text-primary'
              >
                <Icons.listRestart className='mr-2 h-4 w-4' /> Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table or Status Messages */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={
              isLoadingStudentsInitial
                ? 'loading'
                : isError
                  ? 'error'
                  : students.length > 0
                    ? 'data'
                    : 'empty'
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isLoadingStudentsInitial ? (
              <div className='rounded-lg border dark:border-slate-700'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        'Student',
                        'Contact',
                        'Enrollments',
                        'Avg. Progress',
                        'Last Active',
                        'Status',
                        'Actions',
                      ].map((h) => (
                        <TableHead key={h}>
                          <Skeleton className='h-5 w-20' />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Skeleton className='h-10 w-10 rounded-full' />
                            <Skeleton className='h-5 w-32' />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-40' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-12' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-24' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-20' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-6 w-20 rounded-md' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-8 w-8 rounded-md' />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : isError ? (
              <Card className='text-center py-12 bg-destructive/10 border-destructive/30'>
                <CardContent>
                  <Icons.alertTriangle className='mx-auto h-12 w-12 text-destructive mb-4' />
                  <h3 className='text-xl font-semibold text-destructive-foreground'>
                    Failed to Load Students
                  </h3>
                  <p className='text-destructive/80 mt-1'>
                    {error?.message || 'An unexpected error occurred.'}
                  </p>
                </CardContent>
              </Card>
            ) : students.length > 0 ? (
              <div className='border dark:border-slate-700 rounded-lg shadow-sm overflow-hidden'>
                <Table>
                  <TableHeader className='bg-slate-50 dark:bg-slate-800/50'>
                    <TableRow>
                      <TableHead className='w-[280px]'>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className='text-center'>Courses</TableHead>
                      <TableHead>Avg. Progress</TableHead>
                      <TableHead>Last Learning Activity</TableHead>
                      <TableHead className='text-center'>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow
                        key={student.accountId}
                        className='hover:bg-muted/50 dark:hover:bg-muted/20'
                      >
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10 border'>
                              <AvatarImage
                                src={student.avatarUrl || undefined}
                                alt={student.fullName}
                              />
                              <AvatarFallback>
                                {getInitials(student.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium text-foreground'>
                                {student.fullName}
                              </p>
                              {/* <p className="text-xs text-muted-foreground">ID: {student.accountId}</p> */}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs'>
                          <a
                            href={`mailto:${student.email}`}
                            className='hover:text-primary flex items-center'
                          >
                            <Icons.mail className='w-3.5 h-3.5 mr-1.5 opacity-70' />
                            {student.email}
                          </a>
                        </TableCell>
                        <TableCell className='text-center font-medium'>
                          {student.enrolledCoursesCount}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Progress
                              value={student.averageCompletionRate || 0}
                              className={cn(
                                'h-2 w-20',
                                student.averageCompletionRate &&
                                  student.averageCompletionRate < 30
                                  ? 'bg-red-500'
                                  : student.averageCompletionRate &&
                                      student.averageCompletionRate < 70
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              )}
                            />
                            <span className='text-xs text-muted-foreground w-8 text-right'>
                              {student.averageCompletionRate?.toFixed(0) || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {student.lastLearningActivityTimestamp
                            ? format(
                                parseISO(
                                  student.lastLearningActivityTimestamp || ''
                                ),
                                'MMM dd, yyyy'
                              )
                            : 'N/A'}
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge
                            variant={
                              student.status === 'ACTIVE'
                                ? 'success'
                                : 'destructive'
                            }
                            className='text-xs px-2 py-0.5'
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                              >
                                <Icons.moreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  alert(`View profile for ${student.fullName}`)
                                }
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  alert(`Send message to ${student.fullName}`)
                                }
                              >
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='text-red-600 focus:text-red-600 focus:bg-red-50'>
                                Remove from Course (TBD)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              !isFetchingStudents && ( // Chỉ hiển thị khi không fetching
                <Card className='text-center py-16 col-span-full bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed dark:border-slate-700'>
                  <CardContent>
                    <Icons.usersRound className='mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4' />
                    <h3 className='text-xl font-semibold text-foreground'>
                      No Students Found
                    </h3>
                    <p className='mt-2 text-muted-foreground'>
                      {debouncedSearchTerm ||
                      activeFilters.status ||
                      activeFilters.courseId
                        ? 'No students match your current filters. Try adjusting them.'
                        : "You don't have any students enrolled yet, or no students match the current view."}
                    </p>
                    {(debouncedSearchTerm ||
                      activeFilters.status ||
                      activeFilters.courseId) && (
                      <Button
                        variant='outline'
                        className='mt-4'
                        onClick={handleResetFilters}
                      >
                        <Icons.listRestart className='mr-2 h-4 w-4' />
                        Clear Filters & Search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {!isError && totalItems > 0 && totalPages > 1 && (
          <div className='flex justify-center mt-8 md:mt-10'>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              isDisabled={isFetchingStudents}
            />
          </div>
        )}
      </div>
    </InstructorLayout>
  );
};

export default InstructorStudentsPage;
