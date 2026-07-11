// src/pages/instructor/InstructorProfile.tsx
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoForm } from './components/GeneralInfoForm';
import { ProfessionalInfoForm } from './components/ProfessionalInfoForm';
import { SecurityForm } from './components/SecurityForm';
import { AvatarForm } from './components/AvatarForm';
import { SkillsForm } from './components/SkillsForm';
import { SocialLinksForm } from './components/SocialLinksForm';

const InstructorProfile = () => {
  return (
    <InstructorLayout>
      <div className='space-y-6 p-4 md:p-6 lg:p-8'>
        <header>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
            Profile & Settings
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage your public profile, professional details, and account
            security.
          </p>
        </header>

        <Tabs defaultValue='general' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-2 sm:w-auto sm:inline-flex'>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='professional'>Professional</TabsTrigger>
            <TabsTrigger value='social'>Social Links</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
          </TabsList>

          {/* Tab 1: General Information */}
          <TabsContent value='general' className='space-y-6'>
            <AvatarForm />
            <GeneralInfoForm />
          </TabsContent>

          {/* Tab 2: Professional Information */}
          <TabsContent value='professional' className='space-y-6'>
            <ProfessionalInfoForm />
            <SkillsForm />
          </TabsContent>

          {/* Tab 3: Social Links */}
          <TabsContent value='social'>
            <SocialLinksForm />
          </TabsContent>

          {/* Tab 4: Security */}
          <TabsContent value='security'>
            <SecurityForm />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorLayout>
  );
};

export default InstructorProfile;
