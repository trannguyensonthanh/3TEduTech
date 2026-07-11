// src/components/courseLearn/tabs/ResourcesTab.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '@/components/common/Icons';
import { Attachment } from '@/services/lesson.service';

interface ResourcesTabProps {
  attachments: Attachment[];
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ attachments }) => {
  const { t } = useTranslation();
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold flex items-center gap-2'>
        <Icons.download size={22} className='text-primary shrink-0' />
        {t('lessonTabs.downloadableResources')}
      </h2>
      {attachments && attachments.length > 0 ? (
        <div className='space-y-3'>
          {attachments.map((resource) => (
            <a
              key={resource.attachmentId}
              href={resource.fileUrl}
              target='_blank'
              rel='noopener noreferrer'
              download
              className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors group shadow-sm'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <Icons.file className='h-6 w-6 text-primary group-hover:scale-105 transition-transform shrink-0' />
                <div className='flex-1 min-w-0'>
                  <h4
                    className='font-medium text-sm group-hover:text-primary truncate'
                    title={resource.fileName}
                  >
                    {resource.fileName}
                  </h4>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    {resource.fileType && (
                      <span>
                        {resource.fileType.split('/')[1]?.toUpperCase()}
                      </span>
                    )}
                    {resource.fileSize && (
                      <span>
                        • {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Icons.download
                size={18}
                className='text-muted-foreground group-hover:text-primary transition-colors shrink-0'
              />
            </a>
          ))}
        </div>
      ) : (
        <div className='text-center py-12 border border-dashed rounded-lg bg-muted/20'>
          <Icons.fileSearch className='h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30' />
          <h3 className='text-md font-medium'>{t('lessonTabs.noResources')}</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            {t('lessonTabs.noResourcesDesc')}
          </p>
        </div>
      )}
    </div>
  );
};
