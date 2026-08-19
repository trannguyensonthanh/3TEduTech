// import React from 'react';
// import { Label } from '@/components/ui/label';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Switch } from '@/components/ui/switch';
// import { Plus, Trash } from 'lucide-react';
// import { QuizQuestion } from '@/services/quiz.service';

// interface EditLessonDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   editLessonTitle: string;
//   setEditLessonTitle: (title: string) => void;
//   editLessonDescription: string;
//   setEditLessonDescription: (description: string) => void;
//   editLessonType: 'VIDEO' | 'TEXT' | 'QUIZ';
//   setEditLessonType: (type: 'VIDEO' | 'TEXT' | 'QUIZ') => void;
//   editLessonDuration: string;
//   setEditLessonDuration: (duration: string) => void;
//   editLessonVideoUrl: string;
//   setEditLessonVideoUrl: (url: string) => void;
//   editLessonContent: string;
//   setEditLessonContent: (content: string) => void;
//   editLessonQuestions: QuizQuestion[];
//   setEditLessonQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
//   onSave: () => void;
// }

// const EditLessonDialog: React.FC<EditLessonDialogProps> = ({
//   isOpen,
//   onClose,
//   editLessonTitle,
//   setEditLessonTitle,
//   editLessonDescription,
//   setEditLessonDescription,
//   editLessonType,
//   setEditLessonType,
//   editLessonDuration,
//   setEditLessonDuration,
//   editLessonVideoUrl,
//   setEditLessonVideoUrl,
//   editLessonContent,
//   setEditLessonContent,
//   editLessonQuestions,
//   setEditLessonQuestions,
//   onSave,
// }) => {
//   const handleAddQuizQuestion = () => {
//     const newQuestion: QuizQuestion = {
//       id: Date.now(),
//       text: '',
//       explanation: '',
//       options: [
//         { optionId: Date.now() + 1, optionText: '', isCorrectAnswer: false },
//         { optionId: Date.now() + 2, optionText: '', isCorrectAnswer: false },
//       ],
//     };

//     setEditLessonQuestions((prev) => [...prev, newQuestion]);
//   };

//   const handleUpdateQuizQuestion = (
//     questionId: number,
//     field: keyof QuizQuestion,
//     value: string
//   ) => {
//     setEditLessonQuestions((prev) =>
//       prev.map((question) =>
//         question.questionId === questionId
//           ? { ...question, [field]: value }
//           : question
//       )
//     );
//   };

//   const handleUpdateQuizOption = (
//     questionId: number,
//     optionId: number,
//     field: 'text' | 'isCorrect',
//     value: string | boolean
//   ) => {
//     setEditLessonQuestions((prev) =>
//       prev.map((question) =>
//         question.id === questionId
//           ? {
//               ...question,
//               options: question.options.map((option) =>
//                 option.id === optionId
//                   ? { ...option, [field]: value }
//                   : field === 'isCorrect' && value === true
//                     ? { ...option, isCorrect: false }
//                     : option
//               ),
//             }
//           : question
//       )
//     );
//   };

//   const handleAddQuizOption = (questionId: number) => {
//     const newOption = {
//       id: Date.now(),
//       text: '',
//       isCorrect: false,
//     };

//     setEditLessonQuestions((prev) =>
//       prev.map((question) =>
//         question.id === questionId
//           ? { ...question, options: [...question.options, newOption] }
//           : question
//       )
//     );
//   };

//   const handleDeleteQuizOption = (questionId: number, optionId: number) => {
//     setEditLessonQuestions((prev) =>
//       prev.map((question) =>
//         question.id === questionId
//           ? {
//               ...question,
//               options: question.options.filter(
//                 (option) => option.id !== optionId
//               ),
//             }
//           : question
//       )
//     );
//   };

//   const handleDeleteQuizQuestion = (questionId: number) => {
//     setEditLessonQuestions((prev) =>
//       prev.filter((question) => question.id !== questionId)
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className='sm:max-w-[700px]'>
//         <DialogHeader>
//           <DialogTitle>Edit Lesson</DialogTitle>
//           <DialogDescription>Update lesson details</DialogDescription>
//         </DialogHeader>
//         <ScrollArea className='max-h-[70vh]'>
//           <div className='space-y-4 py-4 pr-4'>
//             <div>
//               <Label htmlFor='edit-lesson-title'>Lesson Title</Label>
//               <Input
//                 id='edit-lesson-title'
//                 value={editLessonTitle}
//                 onChange={(e) => setEditLessonTitle(e.target.value)}
//               />
//             </div>
//             <div>
//               <Label htmlFor='edit-lesson-description'>
//                 Description (optional)
//               </Label>
//               <Textarea
//                 id='edit-lesson-description'
//                 value={editLessonDescription}
//                 onChange={(e) => setEditLessonDescription(e.target.value)}
//                 rows={3}
//               />
//             </div>
//             <div>
//               <Label htmlFor='edit-lesson-type'>Lesson Type</Label>
//               <Select
//                 value={editLessonType}
//                 onValueChange={(value: 'VIDEO' | 'TEXT' | 'QUIZ') =>
//                   setEditLessonType(value)
//                 }
//               >
//                 <SelectTrigger id='edit-lesson-type'>
//                   <SelectValue placeholder='Select lesson type' />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value='VIDEO'>Video</SelectItem>
//                   <SelectItem value='TEXT'>Text</SelectItem>
//                   <SelectItem value='QUIZ'>Quiz</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {editLessonType === 'VIDEO' && (
//               <>
//                 <div>
//                   <Label htmlFor='edit-lesson-duration'>Duration (mm:ss)</Label>
//                   <Input
//                     id='edit-lesson-duration'
//                     value={editLessonDuration}
//                     onChange={(e) => setEditLessonDuration(e.target.value)}
//                     placeholder='e.g. 12:30'
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor='edit-lesson-video-url'>Video URL</Label>
//                   <Input
//                     id='edit-lesson-video-url'
//                     value={editLessonVideoUrl}
//                     onChange={(e) => setEditLessonVideoUrl(e.target.value)}
//                     placeholder='e.g. https://example.com/video.mp4'
//                   />
//                 </div>
//               </>
//             )}

//             {editLessonType === 'TEXT' && (
//               <div>
//                 <Label htmlFor='edit-lesson-content'>
//                   Lesson Content (HTML)
//                 </Label>
//                 <Textarea
//                   id='edit-lesson-content'
//                   value={editLessonContent}
//                   onChange={(e) => setEditLessonContent(e.target.value)}
//                   rows={10}
//                   placeholder='<h2>Lesson title</h2><p>Content goes here...</p>'
//                 />
//               </div>
//             )}

//             {editLessonType === 'QUIZ' && (
//               <div className='space-y-6'>
//                 <div className='flex items-center justify-between'>
//                   <h3 className='font-medium'>Quiz Questions</h3>
//                   <Button
//                     variant='outline'
//                     size='sm'
//                     onClick={handleAddQuizQuestion}
//                   >
//                     <Plus className='h-4 w-4 mr-2' />
//                     Add Question
//                   </Button>
//                 </div>

//                 {editLessonQuestions.length === 0 ? (
//                   <div className='text-center p-4 border border-dashed rounded-md'>
//                     <p className='text-muted-foreground'>
//                       No questions added yet. Add your first question.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className='space-y-6'>
//                     {editLessonQuestions.map((question, qIndex) => (
//                       <div key={question.id} className='border rounded-lg p-4'>
//                         <div className='flex justify-between items-start mb-3'>
//                           <h4 className='font-medium'>Question {qIndex + 1}</h4>
//                           <Button
//                             variant='ghost'
//                             size='icon'
//                             onClick={() =>
//                               handleDeleteQuizQuestion(question.id)
//                             }
//                           >
//                             <Trash className='h-4 w-4 text-red-500' />
//                           </Button>
//                         </div>

//                         <div className='space-y-4'>
//                           <div>
//                             <Label htmlFor={`question-${question.id}-text`}>
//                               Question Text
//                             </Label>
//                             <Input
//                               id={`question-${question.id}-text`}
//                               value={question.text}
//                               onChange={(e) =>
//                                 handleUpdateQuizQuestion(
//                                   question.id,
//                                   'text',
//                                   e.target.value
//                                 )
//                               }
//                               placeholder='Enter question text'
//                             />
//                           </div>

//                           <div>
//                             <Label>Answer Options</Label>
//                             <div className='space-y-2 mt-2'>
//                               {question.options.map((option) => (
//                                 <div
//                                   key={option.id}
//                                   className='flex items-center space-x-2'
//                                 >
//                                   <div className='flex-1'>
//                                     <Input
//                                       value={option.text}
//                                       onChange={(e) =>
//                                         handleUpdateQuizOption(
//                                           question.id,
//                                           option.id,
//                                           'text',
//                                           e.target.value
//                                         )
//                                       }
//                                       placeholder='Option text'
//                                     />
//                                   </div>
//                                   <div className='flex items-center space-x-2'>
//                                     <div className='flex items-center space-x-1'>
//                                       <Label
//                                         htmlFor={`option-${option.id}-correct`}
//                                         className='text-sm cursor-pointer'
//                                       >
//                                         Correct
//                                       </Label>
//                                       <Switch
//                                         id={`option-${option.id}-correct`}
//                                         checked={option.isCorrect}
//                                         onCheckedChange={(checked) =>
//                                           handleUpdateQuizOption(
//                                             question.id,
//                                             option.id,
//                                             'isCorrect',
//                                             checked
//                                           )
//                                         }
//                                       />
//                                     </div>
//                                     <Button
//                                       variant='ghost'
//                                       size='icon'
//                                       onClick={() =>
//                                         handleDeleteQuizOption(
//                                           question.id,
//                                           option.id
//                                         )
//                                       }
//                                       disabled={question.options.length <= 2}
//                                     >
//                                       <Trash className='h-4 w-4 text-red-500' />
//                                     </Button>
//                                   </div>
//                                 </div>
//                               ))}

//                               <Button
//                                 variant='outline'
//                                 size='sm'
//                                 className='w-full mt-2'
//                                 onClick={() => handleAddQuizOption(question.id)}
//                               >
//                                 <Plus className='h-4 w-4 mr-2' />
//                                 Add Option
//                               </Button>
//                             </div>
//                           </div>

//                           <div>
//                             <Label
//                               htmlFor={`question-${question.id}-explanation`}
//                             >
//                               Explanation (shown after answering)
//                             </Label>
//                             <Textarea
//                               id={`question-${question.id}-explanation`}
//                               value={question.explanation}
//                               onChange={(e) =>
//                                 handleUpdateQuizQuestion(
//                                   question.id,
//                                   'explanation',
//                                   e.target.value
//                                 )
//                               }
//                               placeholder='Explain the correct answer'
//                               rows={2}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </ScrollArea>
//         <DialogFooter>
//           <Button variant='outline' onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={onSave}>Save Changes</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default EditLessonDialog;
