// src/pages/NotFoundPage.tsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons'; // Home, AlertTriangle
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// SVG Illustration mới hoặc SVG cũ được style lại
// Ví dụ: Một SVG trừu tượng hơn hoặc một hình ảnh liên quan đến "lạc lối"
// Nếu bạn tìm được SVG mới, hãy thay thế component này
const NotFoundIllustration = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
  >
    {/* Sử dụng một icon lớn từ Lucide hoặc SVG tùy chỉnh */}
    <Icons.alertTriangle
      className="w-32 h-32 md:w-40 md:h-40 mx-auto text-primary/30 dark:text-primary/25"
      strokeWidth={1}
    />
    {/* <img src="/path/to/your/404-illustration.svg" alt="Page not found illustration" className="w-64 h-64 mx-auto mb-8" /> */}
  </motion.div>
);

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = '404 - Page Not Found | 3TEduTech';
  }, [location.pathname]);

  const pageVariants = {
    hidden: { opacity: 0, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' },
    }),
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-background to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-sky-900 p-4 sm:p-6 text-center transition-colors duration-500"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="bg-background dark:bg-slate-800/70 p-8 sm:p-10 md:p-14 rounded-2xl shadow-2xl max-w-xl w-full border dark:border-slate-700/50 backdrop-blur-sm"
      >
        <NotFoundIllustration />

        <motion.h1
          variants={contentVariants}
          custom={0}
          className="mt-6 text-6xl sm:text-7xl md:text-8xl font-extrabold text-primary dark:text-primary/90 mb-3 tracking-tighter"
        >
          404
        </motion.h1>
        <motion.p
          variants={contentVariants}
          custom={1}
          className="text-2xl sm:text-3xl font-semibold text-foreground dark:text-slate-100 mb-4"
        >
          Oops! Page Not Found.
        </motion.p>
        <motion.p
          variants={contentVariants}
          custom={2}
          className="text-muted-foreground dark:text-slate-400 mb-8 text-base sm:text-lg leading-relaxed max-w-md mx-auto"
        >
          It seems you've ventured into uncharted territory or the link you
          followed might be broken. Don't worry, we'll help you find your way
          back.
        </motion.p>

        <motion.div variants={contentVariants} custom={3}>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-base font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            <span
              onClick={() => (window.location.href = '/')}
              className="flex items-center cursor-pointer"
            >
              <Icons.home className="mr-2.5 h-5 w-5" /> Go Back to Homepage
            </span>
          </Button>
        </motion.div>

        <motion.div
          variants={contentVariants}
          custom={4}
          className="mt-12 text-xs text-slate-400 dark:text-slate-500"
        >
          <p>
            If you believe this is an error, please{' '}
            <Link to="/contact" className="underline hover:text-primary">
              contact our support team
            </Link>
            .
          </p>
          <p className="mt-1">
            Attempted path:{' '}
            <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">
              {location.pathname}
            </code>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default NotFoundPage; // Đổi tên component
