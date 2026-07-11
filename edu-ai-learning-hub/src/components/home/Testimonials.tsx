// src/components/home/Testimonials.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Icons } from '../common/Icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

// SỬA LẠI IMPORT VÀ TYPES CHO EMBLA CAROUSEL
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
// EmblaCarouselType thường được alias thành EmblaApiType để tránh nhầm lẫn với kiểu component
// Hoặc import trực tiếp: import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'; nếu type không export từ 'embla-carousel-react'
// Tuy nhiên, 'embla-carousel-react' thường re-export các types này.

import Autoplay from 'embla-carousel-autoplay'; // Import plugin Autoplay
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Interface cho Testimonial (đồng bộ với API nếu có)
interface Testimonial {
  id: string | number;
  quote: string;
  name: string;
  title: string; // Chức danh hoặc "Student of [Course Name]"
  avatarUrl: string;
  rating?: number; // Rating (1-5) nếu có
}

// Interface cho Số liệu thống kê (đồng bộ với API nếu có)
interface StatItem {
  icon: React.ReactElement;
  value: string; // "100K+", "2K+", "98%"
  label: string;
  colorClass: string; // Ví dụ: "text-blue-500"
}

// --- MOCK DATA (Sẽ thay thế bằng API calls) ---
const getMockTestimonials = (t: (key: string) => string): Testimonial[] => [
  {
    id: 1,
    quote: t('testimonials.testimonial1.quote'),
    name: 'Sơn Thành',
    title: t('testimonials.testimonial1.title'),
    avatarUrl: 'https://i.imgur.com/d5p124y.png',
    rating: 5,
  },
  {
    id: 2,
    quote: t('testimonials.testimonial2.quote'),
    name: 'Cao Duy Thái',
    title: t('testimonials.testimonial2.title'),
    avatarUrl: 'https://i.imgur.com/VlQOEul.png',
    rating: 5,
  },
  {
    id: 3,
    quote: t('testimonials.testimonial3.quote'),
    name: 'Nguyễn Duy Thái',
    title: t('testimonials.testimonial3.title'),
    avatarUrl: 'https://i.imgur.com/OKAoeOZ.png',
    rating: 4,
  },
  {
    id: 4,
    quote: t('testimonials.testimonial4.quote'),
    name: 'Sarah Miller',
    title: t('testimonials.testimonial4.title'),
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 5,
  },
];

const getMockStats = (t: (key: string) => string): StatItem[] => [
  {
    icon: <Icons.students className='w-8 h-8' />,
    value: '100K+',
    label: t('testimonials.stats.activeStudents'),
    colorClass: 'text-blue-500 dark:text-blue-400',
  },
  {
    icon: <Icons.courses className='w-8 h-8' />,
    value: '2K+',
    label: t('testimonials.stats.qualityCourses'),
    colorClass: 'text-green-500 dark:text-green-400',
  },
  {
    icon: <Icons.instructors className='w-8 h-8' />,
    value: '150+',
    label: t('testimonials.stats.expertInstructors'),
    colorClass: 'text-purple-500 dark:text-purple-400',
  },
  {
    icon: <Icons.star className='w-8 h-8' />,
    value: '4.8/5',
    label: t('testimonials.stats.averageRating'),
    colorClass: 'text-yellow-500 dark:text-yellow-400',
  },
];
// --- END MOCK DATA ---

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const TestimonialsSection = () => {
  const { t } = useTranslation();
  // TODO: Thay thế bằng API call sử dụng React Query hooks
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    getMockTestimonials(t)
  );
  const [stats, setStats] = useState<StatItem[]>(getMockStats(t));

  const emblaOptions: EmblaOptionsType = { loop: true, align: 'start' };
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    // Clean up
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    setTestimonials(getMockTestimonials(t));
    setStats(getMockStats(t));
  }, [t]);

  // TODO: Hook để fetch testimonials và stats từ API
  // const { data: testimonialsData, isLoading: isLoadingTestimonials } = useTestimonialsQuery();
  // const { data: platformStats, isLoading: isLoadingStats } = usePlatformStatsQuery();
  // useEffect(() => { if (testimonialsData) setTestimonials(testimonialsData.items); }, [testimonialsData]);
  // useEffect(() => { if (platformStats) setStats(mapApiStatsToDisplay(platformStats)); }, [platformStats]);

  return (
    <section className='py-16 md:py-24 bg-slate-50 dark:bg-slate-900/70 overflow-hidden'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          variants={sectionVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className='text-center mb-12 md:mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
              {t('testimonials.title')}
            </h2>
            <p className='mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto'>
              {t('testimonials.description')}
            </p>
          </div>

          {/* Testimonials Carousel */}
          {testimonials.length > 0 && (
            <motion.div
              variants={itemVariants}
              className='embla mb-16 md:mb-24 relative'
            >
              <div className='overflow-hidden' ref={emblaRef}>
                <div className='flex -ml-4 touch-pan-y'>
                  {' '}
                  {/* Negative margin to offset padding on slides */}
                  {testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className='flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] min-w-0 pl-4'
                    >
                      <Card className='h-full flex flex-col bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-transparent hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all duration-300'>
                        <CardHeader className='pb-4'>
                          <div className='flex items-center mb-3'>
                            {[...Array(5)].map((_, i) => (
                              <Icons.star
                                key={i}
                                className={cn(
                                  'h-5 w-5',
                                  (testimonial.rating || 5) > i
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-slate-300 dark:text-slate-600 fill-slate-300 dark:fill-slate-600'
                                )}
                              />
                            ))}
                          </div>
                          <Icons.quote className='w-8 h-8 text-blue-500 dark:text-blue-400 opacity-30 mb-2' />
                        </CardHeader>
                        <CardContent className='flex-grow'>
                          <blockquote className='text-slate-700 dark:text-slate-300 leading-relaxed italic'>
                            "{testimonial.quote}"
                          </blockquote>
                        </CardContent>
                        <div className='p-6 mt-auto bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700/50'>
                          <div className='flex items-center'>
                            <Avatar className='h-12 w-12 border-2 border-blue-200 dark:border-blue-700'>
                              <AvatarImage
                                src={testimonial.avatarUrl}
                                alt={testimonial.name}
                              />
                              <AvatarFallback>
                                {testimonial.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='ml-4'>
                              <p className='font-semibold text-slate-800 dark:text-slate-100'>
                                {testimonial.name}
                              </p>
                              <p className='text-xs text-slate-500 dark:text-slate-400'>
                                {testimonial.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
              {/* Carousel Dots */}
              {emblaApi &&
                scrollSnaps.length > 3 && ( // Chỉ hiển thị dots nếu có nhiều hơn 3 slide (vì lg:flex-[0_0_33.33%])
                  <div className='absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-2 mt-6'>
                    {scrollSnaps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                          'h-2 w-2 rounded-full transition-all duration-300',
                          index === selectedIndex
                            ? 'w-6 bg-blue-500'
                            : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* Platform Statistics */}
          <motion.div
            variants={itemVariants}
            className='bg-white dark:bg-slate-800/70 rounded-2xl shadow-2xl p-8 md:p-12'
          >
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
              {stats.map((stat) => (
                <div key={stat.label} className='flex flex-col items-center'>
                  <div
                    className={`p-3 rounded-full mb-3 ${stat.colorClass
                      .replace('text-', 'bg-')
                      .replace('-500', '-100 dark:bg-opacity-20')}`}
                  >
                    {React.cloneElement(stat.icon, {
                      className: cn('w-7 h-7 md:w-8 md:h-8', stat.colorClass),
                    })}
                  </div>
                  <p
                    className={`text-3xl md:text-4xl font-bold ${stat.colorClass} mb-1`}
                  >
                    {stat.value}
                  </p>
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
