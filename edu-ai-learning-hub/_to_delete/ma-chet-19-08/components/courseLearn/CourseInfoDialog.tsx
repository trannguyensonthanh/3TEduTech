// import React from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { useTranslation } from 'react-i18next';

// interface CourseInfoDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   course: {
//     title: string;
//     instructor: string;
//     progress: number;
//     completedLessons: number;
//     totalLessons: number;
//     sections: { id: number; title: string; completed: boolean }[];
//   };
// }

// const CourseInfoDialog: React.FC<CourseInfoDialogProps> = ({
//   isOpen,
//   onClose,
//   course,
// }) => {
//   const { t } = useTranslation();
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className='sm:max-w-lg'>
//         <DialogHeader>
//           <DialogTitle>{t('courseInfoDialog.title')}</DialogTitle>
//           <DialogDescription>
//             {t('courseInfoDialog.description')}
//           </DialogDescription>
//         </DialogHeader>
//         <div className='space-y-4'>
//           <div>
//             <h3 className='font-medium text-lg'>
//               {t('courseInfoDialog.courseTitle')}
//             </h3>
//             <p>{course.title}</p>
//           </div>
//           <div>
//             <h3 className='font-medium text-lg'>
//               {t('courseInfoDialog.instructor')}
//             </h3>
//             <p>{course.instructor}</p>
//           </div>
//           <div>
//             <h3 className='font-medium text-lg'>
//               {t('courseInfoDialog.progress')}
//             </h3>
//             <p>
//               {t('courseInfoDialog.progressValue', {
//                 completed: course.completedLessons,
//                 total: course.totalLessons,
//                 percent: course.progress,
//               })}
//             </p>
//           </div>
//           <div>
//             <h3 className='font-medium text-lg'>
//               {t('courseInfoDialog.sections')}
//             </h3>
//             <ul className='list-disc pl-5'>
//               {course.sections.map((section) => (
//                 <li key={section.id}>
//                   {section.title} -{' '}
//                   {section.completed
//                     ? t('courseInfoDialog.completed')
//                     : t('courseInfoDialog.inProgress')}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//         <DialogFooter>
//           <Button onClick={onClose}>{t('courseInfoDialog.close')}</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };
// export default CourseInfoDialog;
