// src/components/home/Features.tsx
import { useState } from 'react';
import { Icons } from '../common/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Dải "vì sao chọn 3TEduTech".
 *
 * Bản trước gán cho mỗi tính năng một màu riêng (xanh, lục, tím, hổ phách,
 * hồng), nên năm mục cạnh nhau hiện ra năm bảng màu và không mục nào nổi bật
 * hơn mục nào. Nay mục đang chọn dùng đúng một sắc độ của màu nhấn, các mục
 * còn lại giữ màu chữ phụ — thứ bậc do trạng thái quyết định, không do màu.
 */
const FeaturesSection = () => {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);

  const featureItems = [
    {
      icon: <Icons.ai className='h-5 w-5' />,
      title: t('features.aiTitle'),
      description: t('features.aiDesc'),
      preview: {
        stat: 'Độ chính xác gợi ý',
        value: '98%',
        badge: 'Thông minh',
      },
    },
    {
      icon: <Icons.expert className='h-5 w-5' />,
      title: t('features.expertTitle'),
      description: t('features.expertDesc'),
      preview: {
        stat: 'Điểm đánh giá giảng viên',
        value: '4.9',
        badge: 'Được yêu thích',
      },
    },
    {
      icon: <Icons.learnAnywhere className='h-5 w-5' />,
      title: t('features.anywhereTitle'),
      description: t('features.anywhereDesc'),
      preview: {
        stat: 'Thiết bị hỗ trợ',
        value: '3+',
        badge: 'Đa nền tảng',
      },
    },
    {
      icon: <Icons.shieldCheck className='h-5 w-5' />,
      title: t('features.trustedTitle'),
      description: t('features.trustedDesc'),
      preview: {
        stat: 'Nội dung được kiểm duyệt',
        value: '100%',
        badge: 'Đã xác minh',
      },
    },
    {
      icon: <Icons.zap className='h-5 w-5' />,
      title: t('features.interactiveTitle'),
      description: t('features.interactiveDesc'),
      preview: {
        stat: 'Mức độ tương tác',
        value: '95%',
        badge: 'Tương tác',
      },
    },
  ];

  const aiChatbotItems = [
    t(
      'features.ai24h',
      '<strong>Hỗ trợ tức thì 24/7:</strong> Gặp vướng mắc lúc nào cũng có câu trả lời ngay.'
    ),
    t(
      'features.aiPersonalized',
      '<strong>Giải thích theo trình độ:</strong> AI điều chỉnh cách diễn giải theo mức hiểu của bạn.'
    ),
    t(
      'features.aiPractice',
      '<strong>Luyện tập tương tác:</strong> Củng cố kiến thức bằng ví dụ do AI sinh ra.'
    ),
  ];

  return (
    <section className='border-b border-border py-16 md:py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='mx-auto max-w-3xl text-center'
        >
          <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
            {t('features.whyTitle', 'Vì sao nên học cùng')}{' '}
            <span className='text-primary'>3TEduTech</span>?
          </h2>
          <p className='mt-3 text-base text-muted-foreground md:text-lg'>
            {t('features.whyDesc')}
          </p>
        </motion.div>

        {/* Bảng tính năng tương tác */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='mx-auto mt-12 w-full max-w-5xl rounded-xl border border-border bg-card p-6 sm:p-8'
        >
          <div className='grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10'>
            {/* Danh sách tính năng */}
            <div className='flex flex-col lg:col-span-5'>
              <div className='mb-5'>
                <Badge variant='secondary'>
                  <Icons.sparkles className='mr-1.5 h-3.5 w-3.5' aria-hidden='true' />
                  {t('features.platformBadge', 'Tính năng nền tảng')}
                </Badge>
              </div>

              <div className='space-y-1'>
                {featureItems.map((item, index) => {
                  const isActive = activeFeature === index;
                  return (
                    <button
                      key={item.title}
                      type='button'
                      onClick={() => setActiveFeature(index)}
                      aria-pressed={isActive}
                      className={cn(
                        'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                        isActive
                          ? 'border-border bg-muted'
                          : 'border-transparent hover:bg-muted/50'
                      )}
                    >
                      <div className='flex items-center gap-3'>
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground'
                          )}
                        >
                          {item.icon}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium transition-colors sm:text-base',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {item.title}
                        </span>
                      </div>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className='overflow-hidden'
                          >
                            <p className='pl-11 pt-2 text-sm leading-relaxed text-muted-foreground'>
                              {item.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khung xem trước */}
            <div className='flex items-center lg:col-span-7'>
              <div className='w-full rounded-xl border border-border bg-background'>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className='flex min-h-[250px] flex-col justify-center p-6 sm:min-h-[300px] sm:p-8'
                  >
                    <div className='mb-6 flex items-center justify-between gap-3'>
                      <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                        {featureItems[activeFeature].preview.stat}
                      </span>
                      <Badge variant='secondary' className='shrink-0'>
                        {featureItems[activeFeature].preview.badge}
                      </Badge>
                    </div>

                    <p className='text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl'>
                      {featureItems[activeFeature].preview.value}
                    </p>

                    {/* Đường xu hướng minh họa */}
                    <svg
                      className='mt-6 h-12 w-full text-primary'
                      viewBox='0 0 200 50'
                      fill='none'
                      aria-hidden='true'
                    >
                      <path
                        d='M0,40 Q20,35 40,30 T80,15 T120,20 T160,8 T200,12'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        fill='none'
                      />
                    </svg>

                    <p className='mt-4 text-sm text-muted-foreground'>
                      {featureItems[activeFeature].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dải trợ lý AI */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='mx-auto mt-16 max-w-5xl rounded-xl border border-border bg-card p-8 md:p-12'
        >
          <div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-2 md:gap-12'>
            <div className='text-center lg:text-left'>
              <Badge variant='secondary'>
                <Icons.sparkles className='mr-1.5 h-3.5 w-3.5' aria-hidden='true' />
                {t('features.aiBadge')}
              </Badge>
              <h2 className='mt-4 text-2xl font-semibold tracking-tight sm:text-3xl'>
                {t('features.aiSectionTitle')}
              </h2>
              <p className='mt-3 text-base text-muted-foreground'>
                {t('features.aiSectionDesc')}
              </p>
              <ul className='mt-6 space-y-3 text-left'>
                {aiChatbotItems.map((text, idx) => (
                  <li key={idx} className='flex items-start gap-3'>
                    <Icons.checkCircle2
                      className='mt-0.5 h-5 w-5 shrink-0 text-primary'
                      aria-hidden='true'
                    />
                    <p
                      className='text-sm text-muted-foreground'
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  </li>
                ))}
              </ul>
              <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start'>
                <Button asChild size='lg'>
                  <Link to='/courses'>{t('features.ctaExplore')}</Link>
                </Button>
              </div>
            </div>

            {/* Hình minh họa trợ lý AI */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className='flex h-64 items-center justify-center rounded-xl border border-border bg-muted/40 md:h-80'
            >
              <Icons.chatbot
                className='h-28 w-28 text-primary md:h-36 md:w-36'
                aria-hidden='true'
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
