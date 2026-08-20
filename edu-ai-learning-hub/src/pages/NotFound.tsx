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
      className="mx-auto h-32 w-32 text-primary/30 md:h-40 md:w-40"
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
      className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 sm:p-10 md:p-14"
      >
        <NotFoundIllustration />

        <motion.h1
          variants={contentVariants}
          custom={0}
          className="mb-3 mt-6 text-6xl font-semibold tracking-tight text-primary sm:text-7xl"
        >
          404
        </motion.h1>
        <motion.p
          variants={contentVariants}
          custom={1}
          className="mb-4 text-2xl font-semibold text-foreground sm:text-3xl"
        >
          Oops! Page Not Found.
        </motion.p>
        <motion.p
          variants={contentVariants}
          custom={2}
          className="mx-auto mb-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          It seems you've ventured into uncharted territory or the link you
          followed might be broken. Don't worry, we'll help you find your way
          back.
        </motion.p>

        <motion.div variants={contentVariants} custom={3}>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base font-semibold"
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
          className="mt-12 text-xs text-muted-foreground"
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
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              {location.pathname}
            </code>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default NotFoundPage; // Đổi tên component
