// import React, { useState } from 'react';
// import { Label } from '@/components/ui/label';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { useTranslation } from 'react-i18next';

// interface AddLessonFormProps {
//   sectionId: number;
//   onAddLesson: (
//     sectionId: number,
//     lessonTitle: string,
//     lessonDescription: string,
//     lessonType: 'VIDEO' | 'TEXT' | 'QUIZ'
//   ) => void;
//   onCancel: () => void;
// }

// const AddLessonForm: React.FC<AddLessonFormProps> = ({
//   sectionId,
//   onAddLesson,
//   onCancel,
// }) => {
//   const { t } = useTranslation();
//   const [newLessonTitle, setNewLessonTitle] = useState('');
//   const [newLessonDescription, setNewLessonDescription] = useState('');
//   const [newLessonType, setNewLessonType] = useState<'VIDEO' | 'TEXT' | 'QUIZ'>(
//     'VIDEO'
//   );

//   const handleSubmit = () => {
//     if (!newLessonTitle.trim()) return;
//     onAddLesson(sectionId, newLessonTitle, newLessonDescription, newLessonType);
//     resetForm();
//   };

//   const resetForm = () => {
//     setNewLessonTitle('');
//     setNewLessonDescription('');
//     setNewLessonType('VIDEO');
//     onCancel();
//   };

//   return (
//     <div className='p-4 bg-muted/30'>
//       <h4 className='font-medium mb-3'>{t('addLessonForm.title')}</h4>
//       <div className='space-y-4'>
//         <div>
//           <Label htmlFor={`new-lesson-title-${sectionId}`}>
//             {t('addLessonForm.lessonTitle')}
//           </Label>
//           <Input
//             id={`new-lesson-title-${sectionId}`}
//             placeholder={t('addLessonForm.lessonTitlePlaceholder')}
//             value={newLessonTitle}
//             onChange={(e) => setNewLessonTitle(e.target.value)}
//           />
//         </div>
//         <div>
//           <Label htmlFor={`new-lesson-description-${sectionId}`}>
//             {t('addLessonForm.description')}
//           </Label>
//           <Textarea
//             id={`new-lesson-description-${sectionId}`}
//             placeholder={t('addLessonForm.descriptionPlaceholder')}
//             value={newLessonDescription}
//             onChange={(e) => setNewLessonDescription(e.target.value)}
//             rows={3}
//           />
//         </div>
//         <div>
//           <Label htmlFor={`new-lesson-type-${sectionId}`}>
//             {t('addLessonForm.lessonType')}
//           </Label>
//           <Select
//             value={newLessonType}
//             onValueChange={(value: 'VIDEO' | 'TEXT' | 'QUIZ') =>
//               setNewLessonType(value)
//             }
//           >
//             <SelectTrigger id={`new-lesson-type-${sectionId}`}>
//               <SelectValue
//                 placeholder={t('addLessonForm.lessonTypePlaceholder')}
//               />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value='VIDEO'>
//                 {t('addLessonForm.typeVideo')}
//               </SelectItem>
//               <SelectItem value='TEXT'>
//                 {t('addLessonForm.typeText')}
//               </SelectItem>
//               <SelectItem value='QUIZ'>
//                 {t('addLessonForm.typeQuiz')}
//               </SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         <div className='flex justify-end space-x-2'>
//           <Button type='button' variant='outline' onClick={resetForm}>
//             {t('common.cancel', 'Cancel')}
//           </Button>
//           <Button onClick={handleSubmit}>{t('addLessonForm.addLesson')}</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddLessonForm;
