// src/pages/CertificatesPage.tsx
import React, { useState, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout'; // Bạn đã có
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CertificateDisplay } from '@/components/certificates/CertificateDisplay'; // Component hiển thị web
import { Icons } from '@/components/common/Icons';
import { format, parseISO } from 'date-fns';
import { Loader2, AlertTriangle, FileText, Download } from 'lucide-react';
import {
  useMyCategorizedEnrollmentsWithCertificateInfo,
  ProcessedEnrollment,
} from '@/hooks/queries/enrollment.queries';
import { useMyProfile } from '@/hooks/queries/user.queries';
import { Progress } from '@/components/ui/progress';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { CertificatePDFDocument } from '@/components/certificates/CertificatePDFDocument';

const CertificatesPage = () => {
  const navigate = useNavigate();
  const [selectedCertificateCourse, setSelectedCertificateCourse] =
    useState<ProcessedEnrollment | null>(null);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const { data: profileData, isLoading: isLoadingProfile } = useMyProfile();
  const {
    data: categorizedEnrollments,
    isLoading: isLoadingEnrollments,
    error: enrollmentsError,
    refetch: refetchEnrollments, // Thêm hàm refetch
  } = useMyCategorizedEnrollmentsWithCertificateInfo();

  // Không cần useMemo riêng nữa vì hook đã xử lý
  const displayCourses = categorizedEnrollments || {
    completed: [],
    inProgress: [],
  };

  console.log('Display Courses:', displayCourses);
  console.log('Profile Data:', profileData);

  const viewCertificate = (course: ProcessedEnrollment) => {
    if (course.completionDate) {
      setSelectedCertificateCourse(course);
      setCertificateOpen(true);
    }
  };

  const studentName = profileData?.fullName || 'Học viên';
  const isLoading = isLoadingProfile || isLoadingEnrollments;

  if (isLoading) {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-4 flex justify-center items-center min-h-[calc(100vh-200px)]'>
          <p className='ml-4 text-lg'>Loading data...</p>
        </div>
      </Layout>
    );
  }

  if (enrollmentsError) {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-4 text-center'>
          <AlertTriangle className='h-12 w-12 mx-auto text-destructive mb-4' />
          <h2 className='text-xl font-semibold text-destructive mb-2'>
            Lỗi tải dữ liệu
          </h2>
          <p className='text-muted-foreground'>
            {enrollmentsError.message ||
              'Không thể tải danh sách khóa học của bạn. Vui lòng thử lại sau.'}
          </p>
          <Button onClick={() => refetchEnrollments()} className='mt-6'>
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  const pdfDocumentInstance =
    selectedCertificateCourse &&
    selectedCertificateCourse.completionDate &&
    profileData ? (
      <CertificatePDFDocument
        studentName={studentName} // Đảm bảo studentName có giá trị
        courseName={selectedCertificateCourse.courseName || 'N/A'}
        instructorName={selectedCertificateCourse.instructorName || 'N/A'}
        completionDate={format(
          parseISO(selectedCertificateCourse.completionDate),
          'dd/MM/yyyy'
        )}
        dynamicCertificateId={
          selectedCertificateCourse.dynamicCertificateId ||
          `CERT-${selectedCertificateCourse.courseId}-${profileData.accountId}`
        } // Đảm bảo profileData.accountId có
        logoUrl='/images/logo/3telogo.jpeg' // Logo của bạn
      />
    ) : null; // Gán null nếu điều kiện không thỏa

  return (
    <Layout>
      <div className='container mx-auto py-10 px-4'>
        <div className='mb-10 max-w-3xl mx-auto text-center'>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-3'>
            My Certificates
          </h1>
          <p className='text-lg text-muted-foreground'>
            Manage and download your course completion certificates.
          </p>
        </div>

        <div className='max-w-5xl mx-auto'>
          <Tabs defaultValue='completed' className='w-full'>
            <TabsList className='grid w-full grid-cols-2 md:w-[350px] mx-auto mb-10 shadow-sm'>
              <TabsTrigger value='completed' className='py-2.5'>
                Completed ({displayCourses.completed.length})
              </TabsTrigger>
              <TabsTrigger value='in-progress' className='py-2.5'>
                In Progress ({displayCourses.inProgress.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value='completed'>
              {displayCourses.completed.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8'>
                  {displayCourses.completed.map((course) => (
                    <CourseCard
                      key={course.enrollmentId}
                      course={course}
                      onViewCertificate={() => viewCertificate(course)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Icons.certificate className='h-16 w-16' />}
                  title='No certificates yet'
                  description='Complete courses to earn certificates and showcase your achievements!'
                  action={
                    <Button onClick={() => navigate('/my-courses')}>
                      View my courses
                    </Button>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value='in-progress'>
              {displayCourses.inProgress.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8'>
                  {displayCourses.inProgress.map((course) => (
                    <CourseCard
                      key={course.enrollmentId}
                      course={course}
                      isInProgress
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Icons.graduationCap className='h-16 w-16' />}
                  title='No courses in progress'
                  description='Discover and start a new learning journey today!'
                  action={
                    <Button onClick={() => navigate('/courses')}>
                      Find new courses
                    </Button>
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Certificate Dialog */}
      {selectedCertificateCourse &&
        selectedCertificateCourse.completionDate && (
          <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
            <DialogContent className='max-w-4xl w-[95vw] p-0 overflow-auto'>
              {/* Header của Dialog có thể tùy chỉnh */}
              <DialogHeader className='p-6 pb-4 border-b'>
                {' '}
                {/* sr-only nếu CertificateDisplay đã có title */}
                <DialogTitle>Certificate Preview</DialogTitle>
                <DialogDescription>
                  Certificate of completion for the course
                  {selectedCertificateCourse.courseName}.
                </DialogDescription>
              </DialogHeader>

              {/* CertificateDisplay sẽ được render trong phần content chính của Dialog */}
              <div className='max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar'>
                {' '}
                {/* Cho phép scroll nếu nội dung dài */}
                <Suspense
                  fallback={
                    <div className='h-[60vh] flex items-center justify-center'>
                      <Loader2 className='h-8 w-8 animate-spin' />
                    </div>
                  }
                >
                  <CertificateDisplay
                    studentName={studentName}
                    courseName={
                      selectedCertificateCourse.courseName || 'Chưa có tên'
                    }
                    instructorName={
                      selectedCertificateCourse.instructorName || 'Chưa có tên'
                    }
                    completionDate={format(
                      parseISO(selectedCertificateCourse.completionDate),
                      'dd/MM/yyyy'
                    )}
                    dynamicCertificateId={
                      selectedCertificateCourse.dynamicCertificateId ||
                      `CERT-${selectedCertificateCourse.courseId}-${profileData.accountId}`
                    }
                    logoUrl='/images/logo/3telogo.jpeg' // Logo của bạn
                  />
                </Suspense>
              </div>

              <DialogFooter className='p-4 sm:p-6 border-t bg-muted/30 flex flex-col sm:flex-row sm:justify-end gap-3'>
                {/* Chỉ còn nút Download PDF và nút Đóng */}
                <Suspense
                  fallback={
                    <Button disabled className='w-full sm:w-auto'>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Preparing PDF...
                    </Button>
                  }
                >
                  {pdfDocumentInstance && ( // pdfDocument được tạo ở trên
                    <PDFDownloadLink
                      document={pdfDocumentInstance}
                      fileName={`ChungChi-${selectedCertificateCourse.courseName?.replace(
                        /\s+/g,
                        '_'
                      )}-${studentName.replace(/\s+/g, '_')}.pdf`}
                      className='w-full sm:w-auto' // Cho nút chiếm full width trên mobile
                    >
                      {(
                        { loading } // Bỏ blob, url, error nếu không dùng
                      ) => (
                        <Button
                          variant='default'
                          disabled={loading}
                          className='w-full'
                        >
                          {loading ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          ) : (
                            <Icons.download className='mr-2 h-4 w-4' />
                          )}
                          Download PDF
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </Suspense>
                <Button
                  variant='outline'
                  onClick={() => setCertificateOpen(false)}
                  className='w-full sm:w-auto'
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
    </Layout>
  );
};

interface CourseCardProps {
  course: ProcessedEnrollment;
  isInProgress?: boolean;
  onViewCertificate?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isInProgress = false,
  onViewCertificate,
}) => {
  const navigate = useNavigate();
  return (
    <Card className='overflow-hidden flex flex-col h-full group transition-all duration-300 hover:shadow-2xl border hover:border-primary/50'>
      <div className='aspect-[16/9] relative overflow-hidden'>
        {' '}
        {/* Đổi thành 16/9 phổ biến hơn */}
        <img
          src={
            course.thumbnailUrl ||
            'https://via.placeholder.com/400x225/e2e8f0/94a3b8?text=3TEduTech'
          }
          alt={course.courseName}
          className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
        />
        {!isInProgress && (
          <div className='absolute top-3 right-3 bg-green-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-lg'>
            COMPLETED
          </div>
        )}
        {isInProgress && course.progressPercentage > 0 && (
          <div
            className='absolute bottom-0 left-0 h-1 bg-blue-600'
            style={{ width: `${course.progressPercentage}%` }}
            title={`Tiến độ: ${course.progressPercentage}%`}
          ></div>
        )}
      </div>

      <CardHeader className='pb-2 pt-4'>
        <CardTitle className='text-md font-semibold leading-snug line-clamp-2 h-[40px] group-hover:text-blue-600 transition-colors'>
          {isInProgress && course.slug ? (
            <a
              onClick={() => navigate(`/learn/${course.slug}`)}
              className='cursor-pointer hover:underline'
            >
              {course.courseName}
            </a>
          ) : (
            course.courseName
          )}
        </CardTitle>
        {course.instructorName && (
          <CardDescription className='text-xs pt-1'>
            GV: {course.instructorName}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className='flex-grow space-y-2.5 text-sm py-3'>
        {isInProgress ? (
          <>
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>Tiến độ</span>
              <span className='font-semibold text-foreground'>
                {course.progressPercentage || 0}%
              </span>
            </div>
            <Progress
              value={course.progressPercentage || 0}
              className='h-1.5'
            />
          </>
        ) : (
          course.completionDate && (
            <div className='flex items-center text-xs text-muted-foreground'>
              <Icons.calendar className='h-3.5 w-3.5 mr-1.5 flex-shrink-0' />
              <span>
                Hoàn thành:{' '}
                {format(parseISO(course.completionDate), 'dd/MM/yyyy')}
              </span>
            </div>
          )
        )}
      </CardContent>

      <CardFooter className='pt-2 pb-4'>
        {isInProgress && course.slug ? (
          <Button
            variant='ghost'
            size='sm'
            className='w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700'
            onClick={() => navigate(`/learn/${course.slug}`)}
          >
            Go to course
            <Icons.arrowRight className='ml-1.5 h-4 w-4' />
          </Button>
        ) : (
          <Button
            variant='outline'
            size='sm'
            className='w-full'
            onClick={onViewCertificate}
            disabled={!course.completionDate}
          >
            <Icons.fileText className='h-4 w-4 mr-2' />
            View certificate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Placeholder cho khi không có dữ liệu
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className='flex flex-col items-center justify-center text-center py-16 px-6 border-2 border-dashed rounded-xl min-h-[350px] bg-slate-50/50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700'>
    <div className='mb-5 text-slate-400 dark:text-slate-500'>
      {React.cloneElement(icon as React.ReactElement, {
        className: 'h-20 w-20 opacity-70',
      })}
    </div>
    <h3 className='text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-3'>
      {title}
    </h3>
    <p className='text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed'>
      {description}
    </p>
    {action}
  </div>
);

export default CertificatesPage;
