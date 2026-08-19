// import { useState } from 'react';
// import AdminLayout from '@/components/layout/AdminLayout';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger
// } from '@/components/ui/dropdown-menu';
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious
// } from '@/components/ui/pagination';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Check, ChevronDown, CreditCard, DollarSign, Download, EyeIcon, MoreHorizontal, Search, X } from 'lucide-react';

// // Mock data for demonstration
// const mockPayments = Array.from({ length: 50 }).map((_, i) => ({
//   id: i + 1,
//   studentName: `Student ${i + 1}`,
//   courseName: `Course ${Math.floor(Math.random() * 20) + 1}: Learn Something Amazing`,
//   instructorName: `Instructor ${Math.floor(Math.random() * 10) + 1}`,
//   amount: Math.floor(Math.random() * 200) + 9.99,
//   status: ['SUCCESS', 'PENDING', 'FAILED'][Math.floor(Math.random() * 3)],
//   method: ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO'][Math.floor(Math.random() * 4)],
//   currency: ['USD', 'EUR', 'GBP', 'VND'][Math.floor(Math.random() * 4)],
//   platformFee: 0,
//   instructorRevenue: 0,
//   transactionID: `TRX${Math.floor(Math.random() * 1000000)}`,
//   createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
// }));

// // Calculate platform fee and instructor revenue
// mockPayments.forEach(payment => {
//   payment.platformFee = parseFloat((payment.amount * 0.3).toFixed(2));
//   payment.instructorRevenue = parseFloat((payment.amount * 0.7).toFixed(2));
// });

// const PaymentManagement = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState('all');
//   const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
//   const [selectedPayment, setSelectedPayment] = useState<number | null>(null);

//   const itemsPerPage = 10;

//   // Filter payments based on search, status, and payment method
//   const filteredPayments = mockPayments.filter(payment => {
//     const matchesSearch = payment.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                           payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                           payment.instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                           payment.transactionID.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = activeTab === 'all' || payment.status.toLowerCase() === activeTab.toLowerCase();
//     const matchesMethod = selectedMethod === null || payment.method === selectedMethod;

//     return matchesSearch && matchesStatus && matchesMethod;
//   });

//   // Paginate payments
//   const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

//   // Get selected payment details
//   const selectedPaymentDetails = selectedPayment
//     ? mockPayments.find(payment => payment.id === selectedPayment)
//     : null;

//   // Calculate summary statistics
//   const totalRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.status === 'SUCCESS' ? payment.amount : 0), 0);
//   const platformRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.status === 'SUCCESS' ? payment.platformFee : 0), 0);
//   const instructorPayouts = filteredPayments.reduce((sum, payment) => sum + (payment.status === 'SUCCESS' ? payment.instructorRevenue : 0), 0);
//   const pendingAmount = filteredPayments.reduce((sum, payment) => sum + (payment.status === 'PENDING' ? payment.amount : 0), 0);

//   return (
//     <AdminLayout>
//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <h1 className="text-3xl font-bold">Payment Management</h1>
//           <Button>
//             <Download className="mr-2 h-4 w-4" /> Export Report
//           </Button>
//         </div>

//         {selectedPaymentDetails ? (
//           <div className="space-y-6">
//             <div className="flex justify-between">
//               <Button variant="outline" onClick={() => setSelectedPayment(null)}>
//                 Back to List
//               </Button>

//               {selectedPaymentDetails.status === 'PENDING' && (
//                 <div className="space-x-2">
//                   <Button variant="outline" className="text-destructive">
//                     <X className="mr-2 h-4 w-4" /> Cancel Payment
//                   </Button>
//                   <Button variant="default">
//                     <Check className="mr-2 h-4 w-4" /> Mark as Paid
//                   </Button>
//                 </div>
//               )}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Payment Details</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <h3 className="text-xl font-bold">Transaction #{selectedPaymentDetails.transactionID}</h3>
//                     <Badge
//                       className={
//                         selectedPaymentDetails.status === 'SUCCESS' ? 'bg-green-500' :
//                         selectedPaymentDetails.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
//                       }
//                     >
//                       {selectedPaymentDetails.status}
//                     </Badge>
//                   </div>

//                   <div className="space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Date:</span>
//                       <span>{selectedPaymentDetails.createdAt}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Payment Method:</span>
//                       <span>{selectedPaymentDetails.method.replace('_', ' ')}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Currency:</span>
//                       <span>{selectedPaymentDetails.currency}</span>
//                     </div>
//                     <div className="flex justify-between font-bold">
//                       <span>Total Amount:</span>
//                       <span>${selectedPaymentDetails.amount.toFixed(2)}</span>
//                     </div>
//                   </div>

//                   <div className="pt-4 border-t space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Platform Fee (30%):</span>
//                       <span>${selectedPaymentDetails.platformFee.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Instructor Revenue (70%):</span>
//                       <span>${selectedPaymentDetails.instructorRevenue.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Course & User Information</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <h4 className="font-medium">Course</h4>
//                     <p className="text-lg">{selectedPaymentDetails.courseName}</p>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <h4 className="font-medium">Student</h4>
//                       <p>{selectedPaymentDetails.studentName}</p>
//                       <p className="text-sm text-muted-foreground">student{selectedPaymentDetails.id}@example.com</p>
//                     </div>

//                     <div>
//                       <h4 className="font-medium">Instructor</h4>
//                       <p>{selectedPaymentDetails.instructorName}</p>
//                       <p className="text-sm text-muted-foreground">instructor{Math.floor(Math.random() * 10) + 1}@example.com</p>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {selectedPaymentDetails.status === 'FAILED' && (
//                 <Card className="md:col-span-2">
//                   <CardHeader>
//                     <CardTitle className="text-red-500">Error Information</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-muted-foreground">
//                       Payment processing failed. Error code: ERR{Math.floor(Math.random() * 1000)}.
//                       The payment gateway returned an error due to insufficient funds or declined card.
//                     </p>
//                     <Button variant="outline" className="mt-4">
//                       <CreditCard className="mr-2 h-4 w-4" /> Request New Payment
//                     </Button>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
//                   <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
//                   <DollarSign className="w-4 h-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
//                   <p className="text-xs text-muted-foreground">All successful payments</p>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
//                   <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
//                   <DollarSign className="w-4 h-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">${platformRevenue.toFixed(2)}</div>
//                   <p className="text-xs text-muted-foreground">30% of all payments</p>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
//                   <CardTitle className="text-sm font-medium">Instructor Payouts</CardTitle>
//                   <DollarSign className="w-4 h-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">${instructorPayouts.toFixed(2)}</div>
//                   <p className="text-xs text-muted-foreground">70% of all payments</p>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
//                   <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
//                   <DollarSign className="w-4 h-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
//                   <p className="text-xs text-muted-foreground">Payments being processed</p>
//                 </CardContent>
//               </Card>
//             </div>

//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="relative flex-1">
//                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   type="search"
//                   placeholder="Search by transaction ID, student, or course..."
//                   className="pl-8"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>

//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="outline">
//                     {selectedMethod ? selectedMethod.replace('_', ' ') : 'Payment Method'} <ChevronDown className="ml-2 h-4 w-4" />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuItem onClick={() => setSelectedMethod(null)}>
//                     All Methods
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={() => setSelectedMethod('CREDIT_CARD')}>
//                     Credit Card
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={() => setSelectedMethod('PAYPAL')}>
//                     PayPal
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={() => setSelectedMethod('BANK_TRANSFER')}>
//                     Bank Transfer
//                   </DropdownMenuItem>
//                   <DropdownMenuItem onClick={() => setSelectedMethod('CRYPTO')}>
//                     Cryptocurrency
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>

//             <Tabs defaultValue="all" onValueChange={setActiveTab}>
//               <TabsList>
//                 <TabsTrigger value="all">All</TabsTrigger>
//                 <TabsTrigger value="success">Successful</TabsTrigger>
//                 <TabsTrigger value="pending">Pending</TabsTrigger>
//                 <TabsTrigger value="failed">Failed</TabsTrigger>
//               </TabsList>
//             </Tabs>

//             <div className="border rounded-md">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>ID</TableHead>
//                     <TableHead>Transaction ID</TableHead>
//                     <TableHead>Student</TableHead>
//                     <TableHead>Course</TableHead>
//                     <TableHead>Instructor</TableHead>
//                     <TableHead>Amount</TableHead>
//                     <TableHead>Method</TableHead>
//                     <TableHead>Date</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {paginatedPayments.map((payment) => (
//                     <TableRow key={payment.id}>
//                       <TableCell>{payment.id}</TableCell>
//                       <TableCell className="font-medium">{payment.transactionID}</TableCell>
//                       <TableCell>{payment.studentName}</TableCell>
//                       <TableCell className="max-w-[200px] truncate">{payment.courseName}</TableCell>
//                       <TableCell>{payment.instructorName}</TableCell>
//                       <TableCell>
//                         ${payment.amount.toFixed(2)} {payment.currency}
//                       </TableCell>
//                       <TableCell>{payment.method.replace('_', ' ')}</TableCell>
//                       <TableCell>{payment.createdAt}</TableCell>
//                       <TableCell>
//                         <Badge
//                           className={
//                             payment.status === 'SUCCESS' ? 'bg-green-500' :
//                             payment.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
//                           }
//                         >
//                           {payment.status}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <DropdownMenu>
//                           <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" size="icon">
//                               <MoreHorizontal className="h-4 w-4" />
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end">
//                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem onClick={() => setSelectedPayment(payment.id)}>
//                               <EyeIcon className="mr-2 h-4 w-4" /> View Details
//                             </DropdownMenuItem>
//                             {payment.status === 'PENDING' && (
//                               <>
//                                 <DropdownMenuItem>
//                                   <Check className="mr-2 h-4 w-4" /> Mark as Paid
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem>
//                                   <X className="mr-2 h-4 w-4" /> Cancel
//                                 </DropdownMenuItem>
//                               </>
//                             )}
//                             <DropdownMenuItem>
//                               <Download className="mr-2 h-4 w-4" /> Download Receipt
//                             </DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>

//             <Pagination>
//               <PaginationContent>
//                 <PaginationItem>
//                   <PaginationPrevious
//                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//                     className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
//                   />
//                 </PaginationItem>
//                 {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
//                   const pageNumber = currentPage <= 3
//                     ? i + 1
//                     : currentPage >= totalPages - 2
//                       ? totalPages - 4 + i
//                       : currentPage - 2 + i;

//                   if (pageNumber <= 0 || pageNumber > totalPages) return null;

//                   return (
//                     <PaginationItem key={pageNumber}>
//                       <PaginationLink
//                         isActive={currentPage === pageNumber}
//                         onClick={() => setCurrentPage(pageNumber)}
//                       >
//                         {pageNumber}
//                       </PaginationLink>
//                     </PaginationItem>
//                   );
//                 })}
//                 <PaginationItem>
//                   <PaginationNext
//                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//                     className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
//                   />
//                 </PaginationItem>
//               </PaginationContent>
//             </Pagination>
//           </>
//         )}
//       </div>
//     </AdminLayout>
//   );
// };

// export default PaymentManagement;
