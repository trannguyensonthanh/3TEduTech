// import React from 'react';
// import {
//   Card,
//   CardHeader,
//   CardContent,
//   CardTitle,
//   CardDescription,
// } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';

// import { ChevronDown, Plus } from 'lucide-react';

// import AddLessonForm from './AddLessonForm';
// import LessonItem from '@/components/courses/LessonItem';
// import { Section } from '@/services/section.service';
// import { Lesson } from '@/services/lesson.service';

// interface CourseSectionCardProps {
//   section: Section;
//   activeSectionId: number | null;
//   setActiveSectionId: (id: number | null) => void;
//   onAddLesson: (
//     sectionId: number,
//     lessonTitle: string,
//     lessonDescription: string,
//     lessonType: 'VIDEO' | 'TEXT' | 'QUIZ'
//   ) => void;
//   onDeleteSection: (sectionId: number) => void;
//   onToggleSectionPublish: (sectionId: number) => void;
//   onEditSection: (section: Section) => void;
//   onEditLesson: (lesson: Lesson) => void;
//   onDeleteLesson: (lessonId: number) => void;
//   onToggleLessonPublish: (lessonId: number) => void;
//   onToggleLessonPreview: (lessonId: number) => void;
//   onAddResource: (lessonId: number) => void;
// }

// const CourseSectionCard: React.FC<CourseSectionCardProps> = ({
//   section,
//   activeSectionId,
//   setActiveSectionId,
//   onAddLesson,
//   onDeleteSection,
//   onToggleSectionPublish,
//   onEditSection,
//   onEditLesson,
//   onDeleteLesson,
//   onToggleLessonPublish,
//   onToggleLessonPreview,
//   onAddResource,
// }) => {
//   return (
//     <Card key={section.id} className='border border-gray-200'>
//       <CardHeader className='bg-muted/50 py-4'>
//         <div className='flex justify-between items-start'>
//           <div>
//             <div className='flex items-center space-x-2'>
//               <CardTitle className='text-lg'>{section.title}</CardTitle>
//               {section.isPublished ? (
//                 <Badge
//                   variant='outline'
//                   className='bg-green-50 text-green-700 border-green-200'
//                 >
//                   Published
//                 </Badge>
//               ) : (
//                 <Badge
//                   variant='outline'
//                   className='bg-amber-50 text-amber-700 border-amber-200'
//                 >
//                   Draft
//                 </Badge>
//               )}
//             </div>
//             <CardDescription className='mt-1'>
//               {section.description || 'No description provided'}
//             </CardDescription>
//           </div>
//           <div className='flex space-x-2'>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant='ghost' size='icon'>
//                   <ChevronDown className='h-4 w-4' />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align='end'>
//                 <DropdownMenuItem onClick={() => onEditSection(section)}>
//                   Edit Section
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                   onClick={() => onToggleSectionPublish(section.id)}
//                 >
//                   {section.isPublished
//                     ? 'Unpublish Section'
//                     : 'Publish Section'}
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                   className='text-red-600'
//                   onClick={() => onDeleteSection(section.id)}
//                 >
//                   Delete Section
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent className='p-0'>
//         <div className='divide-y'>
//           {section.lessons.map((lesson) => (
//             <LessonItem
//               key={lesson.id}
//               lesson={lesson}
//               onEditLesson={() => onEditLesson(lesson)}
//               onDeleteLesson={() => onDeleteLesson(lesson.id)}
//               onToggleLessonPublish={() => onToggleLessonPublish(lesson.id)}
//               onToggleLessonPreview={() => onToggleLessonPreview(lesson.id)}
//               onAddResource={() => onAddResource(lesson.id)}
//             />
//           ))}

//           {activeSectionId === section.id ? (
//             <AddLessonForm
//               sectionId={section.id}
//               onAddLesson={onAddLesson}
//               onCancel={() => setActiveSectionId(null)}
//             />
//           ) : (
//             <div className='p-4'>
//               <Button
//                 variant='ghost'
//                 className='w-full border border-dashed border-gray-300 text-muted-foreground'
//                 onClick={() => setActiveSectionId(section.id)}
//               >
//                 <Plus className='h-4 w-4 mr-2' />
//                 Add Lesson
//               </Button>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default CourseSectionCard;
