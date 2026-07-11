// src/components/courseLearn/LessonTabs.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { Lesson } from '@/types/common.types';
import { OverviewTab } from './tabs/OverviewTab';
import { ResourcesTab } from './tabs/ResourcesTab';
import { DiscussionsTab } from './tabs/DiscussionsTab';

interface LessonTabsProps {
  lesson: Lesson;
  courseId: number;
  courseInstructorId: number;
}

const LessonTabs: React.FC<LessonTabsProps> = ({
  lesson,
  courseId,
  courseInstructorId,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('description');

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className='h-full flex flex-col'
    >
      <TabsList className='grid w-full grid-cols-3 sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b shadow-sm'>
        <TabsTrigger value='description'>
          {t('lessonTabs.overview')}
        </TabsTrigger>
        <TabsTrigger value='resources'>
          {t('lessonTabs.resources', {
            count: lesson.attachments?.length || 0,
          })}
        </TabsTrigger>
        <TabsTrigger value='discussions'>{t('lessonTabs.qna')}</TabsTrigger>
      </TabsList>
      <div className='flex-grow overflow-y-auto p-4 md:p-6'>
        {activeTab === 'description' && (
          <OverviewTab description={lesson.description} />
        )}
        {activeTab === 'resources' && (
          <ResourcesTab
            attachments={(lesson.attachments || []).map((att) => ({
              ...att,
              lessonId: lesson.lessonId,
            }))}
          />
        )}
        {activeTab === 'discussions' && (
          <DiscussionsTab
            lessonId={Number(lesson.lessonId)}
            courseId={courseId}
            courseInstructorId={courseInstructorId}
          />
        )}
      </div>
    </Tabs>
  );
};

export default LessonTabs;
