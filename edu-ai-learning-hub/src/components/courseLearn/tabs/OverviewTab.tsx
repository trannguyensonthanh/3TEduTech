// src/components/courseLearn/tabs/OverviewTab.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '@/components/common/Icons';

interface OverviewTabProps {
  description: string | null | undefined;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ description }) => {
  const { t } = useTranslation();
  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-semibold flex items-center gap-2'>
        <Icons.info size={22} className='text-primary shrink-0' />
        {t('lessonTabs.overview')}
      </h2>
      <div className='prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed text-foreground/90'>
        {description ? (
          <p className='whitespace-pre-wrap'>{description}</p>
        ) : (
          <p className='text-muted-foreground italic'>
            {t('lessonContentRenderer.textNoContent')}
          </p>
        )}
      </div>
    </div>
  );
};
