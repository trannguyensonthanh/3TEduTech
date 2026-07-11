// import { useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import Layout from '@/components/layout/Layout';
// import { Button } from '@/components/ui/button';
// import { Icons } from '@/components/common/Icons';

// // Mock course data
// const coursesData = [
//   {
//     id: 1,
//     slug: 'complete-python-bootcamp',
//     title: 'Complete Python Bootcamp: From Zero to Hero',
//     description: 'Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games!',
//     instructor: {
//       name: 'John Smith',
//       avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
//     },
//     sections: [
//       {
//         id: 1,
//         title: 'Getting Started with Python',
//         description: 'Set up your development environment and learn the basics of Python programming.',
//         lessons: [
//           { id: 1, title: 'Introduction to the Course', duration: '5:23', preview: true },
//           { id: 2, title: 'Python Installation on Windows', duration: '8:45', preview: true },
//           { id: 3, title: 'Python Installation on Mac', duration: '7:32', preview: true },
//           { id: 4, title: 'Setting Up Your Development Environment', duration: '12:18', preview: false },
//           { id: 5, title: 'Your First Python Program', duration: '10:42', preview: false },
//         ]
//       },
//       {
//         id: 2,
//         title: 'Python Basics',
//         description: 'Learn the fundamental concepts and syntax of Python programming language.',
//         lessons: [
//           { id: 6, title: 'Numbers and Math Operations', duration: '15:20', preview: false },
//           { id: 7, title: 'Variables and Strings', duration: '18:33', preview: false },
//           { id: 8, title: 'Lists, Tuples, and Sets', duration: '22:15', preview: false },
//           { id: 9, title: 'Dictionaries in Python', duration: '16:48', preview: false },
//         ]
//       },
//       {
//         id: 3,
//         title: 'Control Flow',
//         description: 'Master conditional statements and loops to control the flow of your programs.',
//         lessons: [
//           { id: 10, title: 'Conditional Statements (if, elif, else)', duration: '20:15', preview: false },
//           { id: 11, title: 'For Loops in Python', duration: '18:22', preview: false },
//           { id: 12, title: 'While Loops and Loop Control', duration: '15:10', preview: false },
//           { id: 13, title: 'List Comprehensions', duration: '14:35', preview: false },
//         ]
//       },
//     ],
//   }
// ];

// const CourseSectionDetail = () => {
//   const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>();

//   // Find course and section
//   const course = coursesData.find(c => c.slug === courseId);

//   if (!course) {
//     return (
//       <Layout>
//         <div className="container mx-auto px-4 py-10">
//           <div className="text-center py-16">
//             <Icons.bookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//             <h3 className="text-xl font-medium mb-2">Course not found</h3>
//             <p className="text-muted-foreground mb-4">
//               The course you're looking for doesn't exist or has been removed.
//             </p>
//             <Button variant="outline" asChild>
//               <Link to="/courses">Browse All Courses</Link>
//             </Button>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   const section = course.sections.find(s => s.id === parseInt(sectionId || '0', 10));

//   if (!section) {
//     return (
//       <Layout>
//         <div className="container mx-auto px-4 py-10">
//           <div className="text-center py-16">
//             <Icons.bookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//             <h3 className="text-xl font-medium mb-2">Section not found</h3>
//             <p className="text-muted-foreground mb-4">
//               The section you're looking for doesn't exist or has been removed.
//             </p>
//             <Button variant="outline" asChild>
//               <Link to={`/courses/${courseId}`}>Return to Course</Link>
//             </Button>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="container mx-auto px-4 py-10">
//         <div className="max-w-4xl mx-auto">
//           <div className="flex items-center mb-6">
//             <Link to={`/courses/${courseId}`} className="text-brand-500 hover:underline flex items-center">
//               <Icons.arrowLeft className="h-4 w-4 mr-1" />
//               Back to Course
//             </Link>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//             <div className="p-6">
//               <h1 className="text-2xl font-bold mb-2">{section.title}</h1>
//               <p className="text-muted-foreground mb-6">{section.description}</p>

//               <div className="space-y-4">
//                 <h2 className="text-xl font-semibold">Section Lessons ({section.lessons.length})</h2>
//                 <div className="space-y-3">
//                   {section.lessons.map((lesson) => (
//                     <div key={lesson.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
//                       <Link to={`/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}`}>
//                         <div className="flex justify-between items-center">
//                           <div className="flex items-center">
//                             {lesson.preview ? (
//                               <Icons.video className="h-5 w-5 text-brand-500 mr-3" />
//                             ) : (
//                               <Icons.lock className="h-5 w-5 text-gray-400 mr-3" />
//                             )}
//                             <span className={`${lesson.preview ? 'text-brand-500' : 'text-gray-700'}`}>
//                               {lesson.title}
//                             </span>
//                           </div>
//                           <div className="flex items-center">
//                             {lesson.preview && (
//                               <span className="text-xs text-brand-500 font-medium bg-brand-50 px-2 py-1 rounded mr-3">
//                                 Preview
//                               </span>
//                             )}
//                             <span className="text-gray-500 text-sm">{lesson.duration}</span>
//                           </div>
//                         </div>
//                       </Link>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="mt-8 flex justify-between">
//                 {/* Section navigation */}
//                 <div>
//                   {section.id > 1 && (
//                     <Button variant="outline" asChild>
//                       <Link to={`/courses/${courseId}/sections/${section.id - 1}`}>
//                         <Icons.arrowLeft className="mr-2 h-4 w-4" />
//                         Previous Section
//                       </Link>
//                     </Button>
//                   )}
//                 </div>
//                 <div>
//                   {section.id < course.sections.length && (
//                     <Button variant="outline" asChild>
//                       <Link to={`/courses/${courseId}/sections/${section.id + 1}`}>
//                         Next Section
//                         <Icons.arrowRight className="ml-2 h-4 w-4" />
//                       </Link>
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="mt-8">
//             <h2 className="text-xl font-semibold mb-4">About This Course</h2>
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <div className="flex items-center mb-4">
//                 <img
//                   src={course.instructor.avatar}
//                   alt={course.instructor.name}
//                   className="w-12 h-12 rounded-full object-cover mr-3"
//                 />
//                 <div>
//                   <h3 className="font-medium">{course.title}</h3>
//                   <p className="text-sm text-muted-foreground">Instructor: {course.instructor.name}</p>
//                 </div>
//               </div>
//               <p className="text-gray-700">{course.description}</p>
//               <div className="mt-4">
//                 <Button variant="outline" asChild>
//                   <Link to={`/courses/${courseId}`}>
//                     View Full Course
//                   </Link>
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default CourseSectionDetail;
