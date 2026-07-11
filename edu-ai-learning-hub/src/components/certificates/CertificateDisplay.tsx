// src/components/certificates/CertificateDisplay.tsx
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons'; // Đảm bảo có Icons.download
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CertificateDisplayProps {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string; // Format: dd/MM/yyyy
  dynamicCertificateId: string;
  logoUrl?: string;
  signatureImageUrl?: string;
  // Bỏ prop onDownloadPNG vì component sẽ tự xử lý
}

export const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  studentName,
  courseName,
  instructorName,
  completionDate,
  dynamicCertificateId,
  logoUrl = '/logo-placeholder.png',
  signatureImageUrl,
}) => {
  const { t } = useTranslation();
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!certificateRef.current) {
      console.error('Certificate ref is not available.');
      // Có thể hiển thị toast thông báo lỗi cho người dùng ở đây
      return;
    }
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        removeContainer: true,
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `ChungChi-${courseName.replace(
        /\s+/g,
        '_'
      )}-${studentName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Lỗi tạo ảnh chứng chỉ:', error);
      // Hiển thị toast lỗi cho người dùng ở đây
    }
  };

  return (
    <div className='w-full flex flex-col items-center bg-slate-100 dark:bg-slate-900 py-8 px-4 md:py-12'>
      {' '}
      {/* Thêm padding cho toàn bộ wrapper */}
      <div
        ref={certificateRef}
        className={cn(
          'w-full max-w-[1000px] aspect-[1.414/1] p-10 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden',
          'bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 text-slate-800 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 dark:text-slate-200'
        )}
        style={{ fontFamily: "'Merriweather', serif" }}
      >
        {/* Decorative Border/Pattern */}
        <div className='absolute inset-0 z-0 pointer-events-none'>
          <div className='absolute top-0 left-0 w-24 h-24 md:w-32 md:h-32 border-t-4 border-l-4 border-blue-600 dark:border-blue-500 opacity-80 rounded-tl-2xl'></div>
          <div className='absolute bottom-0 right-0 w-24 h-24 md:w-32 md:h-32 border-b-4 border-r-4 border-green-600 dark:border-green-500 opacity-80 rounded-br-2xl'></div>
        </div>

        <div className='relative z-10 flex flex-col items-center justify-between h-full text-center'>
          {/* Section 1: Logo and Title */}
          <div className='w-full'>
            {logoUrl && (
              <img
                src={logoUrl}
                alt='3TEduTech Logo'
                className='mx-auto h-16 md:h-20 mb-6 md:mb-8'
              />
            )}
            <h1
              className='text-3xl md:text-4xl lg:text-5xl font-bold text-blue-700 dark:text-blue-400 tracking-tight uppercase'
              style={{ fontFamily: "'Merriweather', serif" }}
            >
              {t('certificate.title')}
            </h1>
            <p
              className='mt-3 md:mt-4 text-sm md:text-base text-slate-600 dark:text-slate-400'
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {t('certificate.presentedTo')}
            </p>
          </div>

          {/* Section 2: Student Name */}
          <div className='my-6 md:my-10'>
            <h2
              className='text-4xl md:text-5xl lg:text-6xl font-medium text-green-700 dark:text-green-400 px-4 break-words'
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              {studentName}
            </h2>
          </div>

          {/* Section 3: Course Information */}
          <div className='w-full'>
            <p
              className='text-sm md:text-base text-slate-600 dark:text-slate-400 mb-2 md:mb-3'
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {t('certificate.forCompleting')}
            </p>
            <h3
              className='text-2xl md:text-3xl lg:text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-6 md:mb-8 px-4 break-words'
              style={{ fontFamily: "'Merriweather', serif" }}
            >
              {courseName}
            </h3>
          </div>

          {/* Section 4: Details (Instructor, Date, ID) & Signature */}
          <div className='w-full mt-auto pt-6 md:pt-8'>
            <div
              className='flex flex-col md:flex-row justify-around items-center gap-6 md:gap-10 text-xs md:text-sm text-slate-700 dark:text-slate-300'
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <div className='flex flex-col items-center'>
                {signatureImageUrl ? (
                  <img
                    src={signatureImageUrl}
                    alt={t('certificate.instructorSignature')}
                    className='h-10 md:h-12 mb-1'
                  />
                ) : (
                  <div className='h-10 md:h-12 mb-1 border-b-2 border-slate-400 dark:border-slate-600 w-32 md:w-40'></div>
                )}
                <p className='font-semibold'>{instructorName}</p>
                <p className='text-slate-500 dark:text-slate-400'>
                  {t('certificate.instructor')}
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='h-10 md:h-12 mb-1 border-b-2 border-slate-400 dark:border-slate-600 w-32 md:w-40 flex items-end justify-center'>
                  <p className='font-semibold'>{completionDate}</p>
                </div>
                <p className='text-slate-500 dark:text-slate-400'>
                  {t('certificate.completionDate')}
                </p>
              </div>
            </div>
            <p className='mt-6 md:mt-8 text-xs text-slate-500 dark:text-slate-400 tracking-wider'>
              {t('certificate.certificateId', { id: dynamicCertificateId })}
            </p>
            <p className='mt-1 text-[10px] text-slate-400 dark:text-slate-500'>
              {t('certificate.verifyAt', { id: dynamicCertificateId })}
            </p>
          </div>
        </div>
      </div>
      {/* Nút Download PNG được tích hợp vào đây */}
      <div className='mt-6 text-center'>
        <Button onClick={handleDownloadPNG} variant='outline' size='lg'>
          <Icons.download className='mr-2 h-5 w-5' />{' '}
          {t('certificate.downloadPNG')}
        </Button>
      </div>
    </div>
  );
};
