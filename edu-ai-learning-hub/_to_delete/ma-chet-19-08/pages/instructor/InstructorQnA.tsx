// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import InstructorLayout from "@/components/layout/InstructorLayout";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Icons } from "@/components/common/Icons";
// import { format } from "date-fns";

// // Mock data for discussions
// interface User {
//   id: number;
//   name: string;
//   avatar?: string;
// }

// interface Course {
//   id: number;
//   title: string;
// }

// interface DiscussionPost {
//   id: number;
//   threadId: number;
//   parentPostId?: number;
//   user: User;
//   content: string;
//   createdAt: string;
//   isInstructorResponse: boolean;
//   replies?: DiscussionPost[];
// }

// interface DiscussionThread {
//   id: number;
//   title: string;
//   course: Course;
//   lessonTitle?: string;
//   createdAt: string;
//   updatedAt: string;
//   user: User;
//   status: "unanswered" | "answered" | "closed";
//   postCount: number;
//   lastActivityAt: string;
//   lastActivityBy: User;
//   posts: DiscussionPost[];
// }

// // Mock data
// const mockCourses: Course[] = [
//   { id: 1, title: "Complete Python Bootcamp" },
//   { id: 2, title: "Web Development Masterclass" },
//   { id: 3, title: "Machine Learning Fundamentals" },
// ];

// const mockDiscussionThreads: DiscussionThread[] = [
//   {
//     id: 1,
//     title: "How do I fix this error in my Python code?",
//     course: mockCourses[0],
//     lessonTitle: "Introduction to Python Functions",
//     createdAt: "2023-04-27T10:30:00",
//     updatedAt: "2023-04-28T14:20:00",
//     user: {
//       id: 101,
//       name: "John Doe",
//       avatar: "https://i.pravatar.cc/150?img=1",
//     },
//     status: "unanswered",
//     postCount: 3,
//     lastActivityAt: "2023-04-28T14:20:00",
//     lastActivityBy: {
//       id: 101,
//       name: "John Doe",
//       avatar: "https://i.pravatar.cc/150?img=1",
//     },
//     posts: [
//       {
//         id: 1,
//         threadId: 1,
//         user: {
//           id: 101,
//           name: "John Doe",
//           avatar: "https://i.pravatar.cc/150?img=1",
//         },
//         content: `I'm trying to create a function but I keep getting this error:

// \`\`\`python
// def my_function(x):
//   return x + 1

// result = my_function()
// \`\`\`

// Can someone help me understand what I'm doing wrong?`,
//         createdAt: "2023-04-27T10:30:00",
//         isInstructorResponse: false,
//         replies: [
//           {
//             id: 2,
//             threadId: 1,
//             parentPostId: 1,
//             user: {
//               id: 102,
//               name: "Alice Smith",
//               avatar: "https://i.pravatar.cc/150?img=5",
//             },
//             content:
//               "I think you're missing an argument when you call the function. You defined it with a parameter 'x' but you're not passing anything when you call it.",
//             createdAt: "2023-04-27T11:45:00",
//             isInstructorResponse: false,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     id: 2,
//     title: "Confused about React hooks lifecycles",
//     course: mockCourses[1],
//     lessonTitle: "React Hooks Introduction",
//     createdAt: "2023-04-26T16:20:00",
//     updatedAt: "2023-04-28T09:10:00",
//     user: {
//       id: 103,
//       name: "Emily Johnson",
//       avatar: "https://i.pravatar.cc/150?img=6",
//     },
//     status: "answered",
//     postCount: 5,
//     lastActivityAt: "2023-04-28T09:10:00",
//     lastActivityBy: {
//       id: 201,
//       name: "David Wilson",
//       avatar: "https://i.pravatar.cc/150?img=2",
//     },
//     posts: [
//       {
//         id: 3,
//         threadId: 2,
//         user: {
//           id: 103,
//           name: "Emily Johnson",
//           avatar: "https://i.pravatar.cc/150?img=6",
//         },
//         content:
//           "I'm struggling to understand when useEffect runs with different dependency arrays. Can someone explain it simply?",
//         createdAt: "2023-04-26T16:20:00",
//         isInstructorResponse: false,
//         replies: [
//           {
//             id: 4,
//             threadId: 2,
//             parentPostId: 3,
//             user: {
//               id: 201,
//               name: "David Wilson",
//               avatar: "https://i.pravatar.cc/150?img=2",
//             },
//             content: `Great question! Here's a simple breakdown:

// 1. useEffect(() => {}, []) - Runs once after the first render (like componentDidMount)
// 2. useEffect(() => {}, [someValue]) - Runs after first render and whenever someValue changes
// 3. useEffect(() => {}) - Runs after every render

// Does that help clarify things?`,
//             createdAt: "2023-04-26T18:05:00",
//             isInstructorResponse: true,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     id: 3,
//     title: "How to implement K-means clustering?",
//     course: mockCourses[2],
//     lessonTitle: "Clustering Algorithms",
//     createdAt: "2023-04-25T14:15:00",
//     updatedAt: "2023-04-25T14:15:00",
//     user: {
//       id: 104,
//       name: "Michael Brown",
//       avatar: "https://i.pravatar.cc/150?img=7",
//     },
//     status: "unanswered",
//     postCount: 1,
//     lastActivityAt: "2023-04-25T14:15:00",
//     lastActivityBy: {
//       id: 104,
//       name: "Michael Brown",
//       avatar: "https://i.pravatar.cc/150?img=7",
//     },
//     posts: [
//       {
//         id: 5,
//         threadId: 3,
//         user: {
//           id: 104,
//           name: "Michael Brown",
//           avatar: "https://i.pravatar.cc/150?img=7",
//         },
//         content:
//           "I'm trying to understand how to implement K-means clustering from scratch. The lesson examples use libraries, but I want to understand the algorithm itself. Any tips or resources?",
//         createdAt: "2023-04-25T14:15:00",
//         isInstructorResponse: false,
//       },
//     ],
//   },
// ];

// const InstructorQnA = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState<string>("unanswered");
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [selectedCourse, setSelectedCourse] = useState<string>("all");
//   const [selectedThread, setSelectedThread] = useState<DiscussionThread | null>(
//     null
//   );
//   const [replyContent, setReplyContent] = useState<string>("");
//   const [isReplyDialogOpen, setIsReplyDialogOpen] = useState<boolean>(false);

//   // Filter discussions based on active tab, search query, and selected course
//   const filteredDiscussions = mockDiscussionThreads.filter((thread) => {
//     // Filter by tab
//     if (activeTab === "unanswered" && thread.status !== "unanswered")
//       return false;
//     if (activeTab === "answered" && thread.status !== "answered") return false;
//     if (activeTab === "closed" && thread.status !== "closed") return false;

//     // Filter by search query
//     if (
//       searchQuery &&
//       !thread.title.toLowerCase().includes(searchQuery.toLowerCase())
//     )
//       return false;

//     // Filter by course
//     if (
//       selectedCourse !== "all" &&
//       thread.course.id !== parseInt(selectedCourse)
//     )
//       return false;

//     return true;
//   });

//   const handleOpenThread = (thread: DiscussionThread) => {
//     setSelectedThread(thread);
//   };

//   const handleSubmitReply = () => {
//     if (!replyContent.trim() || !selectedThread) return;

//     // In a real application, you would send this to your API
//     console.log("Submitting reply:", {
//       threadId: selectedThread.id,
//       content: replyContent,
//     });

//     // Mock update the thread status to "answered"
//     const updatedThreads = mockDiscussionThreads.map((thread) => {
//       if (thread.id === selectedThread.id) {
//         return {
//           ...thread,
//           status: "answered" as const,
//           posts: [
//             ...thread.posts,
//             {
//               id:
//                 Math.max(
//                   ...mockDiscussionThreads.flatMap((t) =>
//                     t.posts.map((p) => p.id)
//                   )
//                 ) + 1,
//               threadId: thread.id,
//               user: {
//                 id: 201,
//                 name: "David Wilson",
//                 avatar: "https://i.pravatar.cc/150?img=2",
//               },
//               content: replyContent,
//               createdAt: new Date().toISOString(),
//               isInstructorResponse: true,
//             },
//           ],
//         };
//       }
//       return thread;
//     });

//     // Reset form and close dialog
//     setReplyContent("");
//     setIsReplyDialogOpen(false);

//     // Update the selected thread to show the new reply
//     const updatedThread = updatedThreads.find(
//       (t) => t.id === selectedThread.id
//     );
//     if (updatedThread) {
//       setSelectedThread(updatedThread);
//     }
//   };

//   const handleCloseThread = (threadId: number) => {
//     // In a real application, you would send this to your API
//     console.log("Closing thread:", threadId);

//     // Mock update the thread status to "closed"
//     const updatedThreads = mockDiscussionThreads.map((thread) => {
//       if (thread.id === threadId) {
//         return { ...thread, status: "closed" as const };
//       }
//       return thread;
//     });

//     // Update the selected thread if it's the one being closed
//     if (selectedThread && selectedThread.id === threadId) {
//       const updatedThread = updatedThreads.find((t) => t.id === threadId);
//       if (updatedThread) {
//         setSelectedThread(updatedThread);
//       }
//     }
//   };

//   return (
//     <InstructorLayout>
//       <div className="container mx-auto p-4 md:p-6">
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-2xl font-bold">Q&A Management</h1>
//             <p className="text-muted-foreground">
//               Manage discussions and respond to student questions
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left column - Discussion list */}
//           <div className="lg:col-span-1">
//             <Card>
//               <CardHeader className="space-y-4">
//                 <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
//                   <Input
//                     placeholder="Search discussions..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="md:max-w-sm"
//                   />
//                   <Select
//                     value={selectedCourse}
//                     onValueChange={setSelectedCourse}
//                   >
//                     <SelectTrigger className="md:w-[180px]">
//                       <SelectValue placeholder="Select course" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Courses</SelectItem>
//                       {mockCourses.map((course) => (
//                         <SelectItem
//                           key={course.id}
//                           value={course.id.toString()}
//                         >
//                           {course.title}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <Tabs
//                   defaultValue="unanswered"
//                   value={activeTab}
//                   onValueChange={setActiveTab}
//                 >
//                   <TabsList className="grid w-full grid-cols-3">
//                     <TabsTrigger value="unanswered" className="truncate">
//                       Unanswered
//                       <Badge variant="secondary" className="ml-2">
//                         {
//                           mockDiscussionThreads.filter(
//                             (t) => t.status === "unanswered"
//                           ).length
//                         }
//                       </Badge>
//                     </TabsTrigger>
//                     <TabsTrigger value="answered" className="truncate">
//                       Answered
//                     </TabsTrigger>
//                     <TabsTrigger value="closed" className="truncate">
//                       Closed
//                     </TabsTrigger>
//                   </TabsList>
//                 </Tabs>
//               </CardHeader>
//               <CardContent>
//                 <ScrollArea className="h-[600px] pr-4">
//                   {filteredDiscussions.length > 0 ? (
//                     <div className="space-y-3">
//                       {filteredDiscussions.map((thread) => (
//                         <Card
//                           key={thread.id}
//                           className={`cursor-pointer transition-colors hover:bg-muted/50 ${
//                             selectedThread?.id === thread.id
//                               ? "border-primary"
//                               : ""
//                           }`}
//                           onClick={() => handleOpenThread(thread)}
//                         >
//                           <CardHeader className="py-3">
//                             <div className="flex justify-between items-start">
//                               <div className="space-y-1">
//                                 <CardTitle className="text-base font-medium">
//                                   {thread.title}
//                                 </CardTitle>
//                                 <CardDescription className="text-xs">
//                                   {thread.course.title} • {thread.lessonTitle}
//                                 </CardDescription>
//                               </div>
//                               <Badge
//                                 variant={
//                                   thread.status === "unanswered"
//                                     ? "destructive"
//                                     : thread.status === "answered"
//                                     ? "success"
//                                     : "secondary"
//                                 }
//                               >
//                                 {thread.status}
//                               </Badge>
//                             </div>
//                           </CardHeader>
//                           <CardFooter className="py-2 text-xs text-muted-foreground">
//                             <div className="flex justify-between items-center w-full">
//                               <div className="flex items-center space-x-2">
//                                 <Avatar className="h-6 w-6">
//                                   <AvatarImage
//                                     src={thread.user.avatar}
//                                     alt={thread.user.name}
//                                   />
//                                   <AvatarFallback>
//                                     {thread.user.name.charAt(0)}
//                                   </AvatarFallback>
//                                 </Avatar>
//                                 <span>{thread.user.name}</span>
//                               </div>
//                               <div className="flex items-center space-x-2">
//                                 <Icons.messageSquare className="h-4 w-4" />
//                                 <span>{thread.postCount}</span>
//                               </div>
//                             </div>
//                           </CardFooter>
//                         </Card>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="flex flex-col items-center justify-center py-8 text-center">
//                       <Icons.messageSquare className="h-12 w-12 text-muted-foreground mb-4" />
//                       <h3 className="text-lg font-medium">
//                         No discussions found
//                       </h3>
//                       <p className="text-muted-foreground mt-1">
//                         {searchQuery || selectedCourse !== "all"
//                           ? "Try adjusting your filters"
//                           : "There are no discussions in this category"}
//                       </p>
//                     </div>
//                   )}
//                 </ScrollArea>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Right column - Discussion thread */}
//           <div className="lg:col-span-2">
//             {selectedThread ? (
//               <Card>
//                 <CardHeader>
//                   <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
//                     <div>
//                       <Badge className="mb-2" variant="outline">
//                         {selectedThread.course.title}
//                       </Badge>
//                       <CardTitle>{selectedThread.title}</CardTitle>
//                       <CardDescription className="mt-1">
//                         Started by {selectedThread.user.name} on{" "}
//                         {format(new Date(selectedThread.createdAt), "PP")}
//                       </CardDescription>
//                     </div>
//                     <div className="flex space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setIsReplyDialogOpen(true)}
//                       >
//                         <Icons.messageSquare className="mr-2 h-4 w-4" />
//                         Reply
//                       </Button>
//                       {selectedThread.status !== "closed" && (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleCloseThread(selectedThread.id)}
//                         >
//                           <Icons.check className="mr-2 h-4 w-4" />
//                           Close Thread
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <ScrollArea className="h-[600px] pr-4">
//                     <div className="space-y-6">
//                       {selectedThread.posts.map((post) => (
//                         <div key={post.id} className="space-y-6">
//                           <div
//                             className={`p-4 rounded-lg ${
//                               post.isInstructorResponse
//                                 ? "bg-primary/10 border border-primary/20"
//                                 : "bg-muted"
//                             }`}
//                           >
//                             <div className="flex justify-between items-start mb-4">
//                               <div className="flex items-center space-x-3">
//                                 <Avatar>
//                                   <AvatarImage
//                                     src={post.user.avatar}
//                                     alt={post.user.name}
//                                   />
//                                   <AvatarFallback>
//                                     {post.user.name.charAt(0)}
//                                   </AvatarFallback>
//                                 </Avatar>
//                                 <div>
//                                   <div className="font-medium">
//                                     {post.user.name}
//                                     {post.isInstructorResponse && (
//                                       <Badge variant="outline" className="ml-2">
//                                         Instructor
//                                       </Badge>
//                                     )}
//                                   </div>
//                                   <div className="text-xs text-muted-foreground">
//                                     {format(new Date(post.createdAt), "PPp")}
//                                   </div>
//                                 </div>
//                               </div>
//                               <Button variant="ghost" size="icon">
//                                 <Icons.moreHorizontal className="h-4 w-4" />
//                               </Button>
//                             </div>
//                             <div className="prose prose-sm dark:prose-invert max-w-none">
//                               <div
//                                 dangerouslySetInnerHTML={{
//                                   __html: post.content.replace(/\n/g, "<br/>"),
//                                 }}
//                               />
//                             </div>
//                           </div>

//                           {/* Post replies */}
//                           {post.replies && post.replies.length > 0 && (
//                             <div className="pl-6 border-l space-y-4">
//                               {post.replies.map((reply) => (
//                                 <div
//                                   key={reply.id}
//                                   className={`p-4 rounded-lg ${
//                                     reply.isInstructorResponse
//                                       ? "bg-primary/10 border border-primary/20"
//                                       : "bg-muted"
//                                   }`}
//                                 >
//                                   <div className="flex justify-between items-start mb-4">
//                                     <div className="flex items-center space-x-3">
//                                       <Avatar>
//                                         <AvatarImage
//                                           src={reply.user.avatar}
//                                           alt={reply.user.name}
//                                         />
//                                         <AvatarFallback>
//                                           {reply.user.name.charAt(0)}
//                                         </AvatarFallback>
//                                       </Avatar>
//                                       <div>
//                                         <div className="font-medium">
//                                           {reply.user.name}
//                                           {reply.isInstructorResponse && (
//                                             <Badge
//                                               variant="outline"
//                                               className="ml-2"
//                                             >
//                                               Instructor
//                                             </Badge>
//                                           )}
//                                         </div>
//                                         <div className="text-xs text-muted-foreground">
//                                           {format(
//                                             new Date(reply.createdAt),
//                                             "PPp"
//                                           )}
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <Button variant="ghost" size="icon">
//                                       <Icons.moreHorizontal className="h-4 w-4" />
//                                     </Button>
//                                   </div>
//                                   <div className="prose prose-sm dark:prose-invert max-w-none">
//                                     <div
//                                       dangerouslySetInnerHTML={{
//                                         __html: reply.content.replace(
//                                           /\n/g,
//                                           "<br/>"
//                                         ),
//                                       }}
//                                     />
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </ScrollArea>
//                 </CardContent>
//                 {selectedThread.status === "closed" && (
//                   <CardFooter className="bg-muted/50 border-t p-4">
//                     <div className="w-full text-center text-muted-foreground">
//                       <Icons.lock className="mx-auto h-5 w-5 mb-2" />
//                       <p>This discussion thread has been closed</p>
//                     </div>
//                   </CardFooter>
//                 )}
//               </Card>
//             ) : (
//               <Card className="h-full flex flex-col items-center justify-center p-12 text-center">
//                 <Icons.messageSquare className="h-16 w-16 text-muted-foreground mb-6" />
//                 <h3 className="text-xl font-medium mb-2">
//                   Select a Discussion
//                 </h3>
//                 <p className="text-muted-foreground max-w-md">
//                   Choose a discussion thread from the left panel to view and
//                   respond to student questions.
//                 </p>
//               </Card>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Reply Dialog */}
//       <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
//         <DialogContent className="sm:max-w-[600px]">
//           <DialogHeader>
//             <DialogTitle>Reply to Discussion</DialogTitle>
//             <DialogDescription>
//               Your response will be visible to all students enrolled in this
//               course.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="mt-4 mb-6">
//             <Textarea
//               placeholder="Type your reply here..."
//               value={replyContent}
//               onChange={(e) => setReplyContent(e.target.value)}
//               className="min-h-[200px]"
//             />
//           </div>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsReplyDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleSubmitReply}>Submit Reply</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </InstructorLayout>
//   );
// };

// export default InstructorQnA;
