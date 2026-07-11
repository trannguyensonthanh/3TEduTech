// src/components/admin/courses/CoursesTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseListItem } from '@/services/course.service';
import { useSettings } from '@/contexts/SettingsContext';

interface CoursesTableProps {
  courses?: CourseListItem[];
  isLoading: boolean;
  onViewDetails: (course: CourseListItem) => void;
  onDelete: (course: CourseListItem) => void;
  // Thêm các actions khác nếu cần
}

const statusConfig = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  PUBLISHED: { label: 'Published', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

const AdminCoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  isLoading,
  onViewDetails,
  onDelete,
}) => {
  const { formatPrice } = useSettings();

  const renderSkeleton = () =>
    Array.from({ length: 10 }).map((_, i) => (
      <TableRow key={`skel-${i}`}>
        <TableCell>
          <Skeleton className='h-5 w-8' />
        </TableCell>
        <TableCell>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-10 rounded-md' />
            <div className='space-y-1'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className='h-5 w-28' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-6 w-20 rounded-full' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-5 w-16' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-5 w-12' />
        </TableCell>
        <TableCell className='text-right'>
          <Skeleton className='h-8 w-8 rounded-md' />
        </TableCell>
      </TableRow>
    ));

  return (
    <div className='border rounded-lg'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Students</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            renderSkeleton()
          ) : courses && courses.length > 0 ? (
            courses.map((course) => (
              <TableRow key={course.courseId}>
                <TableCell className='font-mono text-xs'>
                  {course.courseId}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <img
                      src={course.thumbnailUrl || undefined}
                      alt={course.courseName}
                      className='h-10 w-10 object-cover rounded-md bg-muted'
                    />
                    <div>
                      <p
                        className='font-semibold line-clamp-1'
                        title={course.courseName}
                      >
                        {course.courseName}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        by {course.instructorName}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline'>{course.categoryName}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[course.statusId]?.className}>
                    {statusConfig[course.statusId]?.label || course.statusId}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatPrice(course.pricing.display.originalPrice)}
                </TableCell>
                <TableCell>{course.studentCount.toLocaleString()}</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <Icons.moreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => onViewDetails(course)}>
                        <Icons.eye className='mr-2 h-4 w-4' />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() => onDelete(course)}
                      >
                        <Icons.trash className='mr-2 h-4 w-4' />
                        Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className='h-32 text-center'>
                No courses found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminCoursesTable;
