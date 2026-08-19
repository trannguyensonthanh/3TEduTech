// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState } from 'react';
// import { Search, ChevronDown } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import ApprovalsTable from './ApprovalsTable';
// import PaginationControls from '@/components/admin/PaginationControls';

// interface ApprovalsListProps {
//   approvals: any[];
//   onReview: (id: number) => void;
// }

// const ApprovalsList: React.FC<ApprovalsListProps> = ({
//   approvals,
//   onReview,
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState('pending');

//   const itemsPerPage = 10;

//   // Filter approvals based on search and active tab
//   const filteredApprovals = approvals.filter((approval) => {
//     const matchesSearch =
//       approval.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       approval.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesTab =
//       activeTab === 'all' ||
//       approval.status.toLowerCase() === activeTab.toLowerCase();

//     return matchesSearch && matchesTab;
//   });

//   // Paginate approvals
//   const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedApprovals = filteredApprovals.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   return (
//     <>
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//           <Input
//             type="search"
//             placeholder="Search by course or instructor name..."
//             className="pl-8"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="outline">
//               Filter by Type <ChevronDown className="ml-2 h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem onClick={() => setSearchTerm('')}>
//               All Types
//             </DropdownMenuItem>
//             <DropdownMenuItem onClick={() => setSearchTerm('NEW_COURSE')}>
//               New Courses
//             </DropdownMenuItem>
//             <DropdownMenuItem onClick={() => setSearchTerm('COURSE_UPDATE')}>
//               Course Updates
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       <Tabs defaultValue="pending" onValueChange={setActiveTab}>
//         <TabsList>
//           <TabsTrigger value="pending">Pending</TabsTrigger>
//           <TabsTrigger value="approved">Approved</TabsTrigger>
//           <TabsTrigger value="rejected">Rejected</TabsTrigger>
//           <TabsTrigger value="all">All</TabsTrigger>
//         </TabsList>

//         <TabsContent value="pending" className="mt-6">
//           <ApprovalsTable approvals={paginatedApprovals} onReview={onReview} />
//         </TabsContent>

//         <TabsContent value="approved" className="mt-6">
//           <ApprovalsTable approvals={paginatedApprovals} onReview={onReview} />
//         </TabsContent>

//         <TabsContent value="rejected" className="mt-6">
//           <ApprovalsTable approvals={paginatedApprovals} onReview={onReview} />
//         </TabsContent>

//         <TabsContent value="all" className="mt-6">
//           <ApprovalsTable approvals={paginatedApprovals} onReview={onReview} />
//         </TabsContent>
//       </Tabs>

//       <PaginationControls
//         currentPage={currentPage}
//         totalPages={totalPages}
//         setCurrentPage={setCurrentPage}
//       />
//     </>
//   );
// };

// export default ApprovalsList;
