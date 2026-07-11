// import { useState } from 'react';
// import InstructorLayout from '@/components/layout/InstructorLayout';
// import { Button } from '@/components/ui/button';
// import { Icons } from '@/components/common/Icons';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
//   CardFooter
// } from '@/components/ui/card';
// import { Switch } from '@/components/ui/switch';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const InstructorSettings = () => {
//   return (
//     <InstructorLayout>
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
//           <Button>
//             <Icons.save className="mr-2 h-4 w-4" />
//             Save Changes
//           </Button>
//         </div>

//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//           <Card>
//             <CardHeader>
//               <CardTitle>Payout Settings</CardTitle>
//               <CardDescription>
//                 Configure how and when you receive your earnings.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="payout-method">Payout Method</Label>
//                 <Select defaultValue="paypal">
//                   <SelectTrigger id="payout-method">
//                     <SelectValue placeholder="Select payout method" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="paypal">PayPal</SelectItem>
//                     <SelectItem value="bank">Bank Transfer</SelectItem>
//                     <SelectItem value="stripe">Stripe</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="paypal-email">PayPal Email</Label>
//                 <Input
//                   id="paypal-email"
//                   type="email"
//                   placeholder="your-paypal-email@example.com"
//                   defaultValue="john.smith@example.com"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="payout-threshold">Payout Threshold</Label>
//                 <Select defaultValue="50">
//                   <SelectTrigger id="payout-threshold">
//                     <SelectValue placeholder="Select minimum amount" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="25">$25</SelectItem>
//                     <SelectItem value="50">$50</SelectItem>
//                     <SelectItem value="100">$100</SelectItem>
//                     <SelectItem value="250">$250</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <p className="text-xs text-muted-foreground">
//                   Minimum amount required before automatic payout is initiated.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Tax Information</CardTitle>
//               <CardDescription>
//                 Configure your tax details for accurate reporting.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="country">Country of Residence</Label>
//                 <Select defaultValue="us">
//                   <SelectTrigger id="country">
//                     <SelectValue placeholder="Select country" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="us">United States</SelectItem>
//                     <SelectItem value="ca">Canada</SelectItem>
//                     <SelectItem value="uk">United Kingdom</SelectItem>
//                     <SelectItem value="au">Australia</SelectItem>
//                     <SelectItem value="other">Other</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="tax-id">Tax ID Number</Label>
//                 <Input
//                   id="tax-id"
//                   placeholder="Tax ID Number"
//                   defaultValue="XXX-XX-XXXX"
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   For US instructors, this is your SSN or EIN.
//                 </p>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Switch id="tax-withholding" defaultChecked={true} />
//                 <Label htmlFor="tax-withholding">Enable tax withholding</Label>
//               </div>
//             </CardContent>
//             <CardFooter>
//               <Button variant="outline" className="w-full">
//                 <Icons.file className="mr-2 h-4 w-4" />
//                 Download Tax Documents
//               </Button>
//             </CardFooter>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Privacy Settings</CardTitle>
//               <CardDescription>
//                 Control what information is visible to others.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <h4 className="font-medium">Show my profile publicly</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Allow students and visitors to view your instructor profile.
//                   </p>
//                 </div>
//                 <Switch defaultChecked={true} />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <h4 className="font-medium">Display contact information</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Show your email to enrolled students.
//                   </p>
//                 </div>
//                 <Switch defaultChecked={false} />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <h4 className="font-medium">Share social media profiles</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Display your social links on your instructor profile.
//                   </p>
//                 </div>
//                 <Switch defaultChecked={true} />
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Default Course Settings</CardTitle>
//               <CardDescription>
//                 Set default settings for all your new courses.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="default-language">Default Language</Label>
//                 <Select defaultValue="en">
//                   <SelectTrigger id="default-language">
//                     <SelectValue placeholder="Select language" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="en">English</SelectItem>
//                     <SelectItem value="es">Spanish</SelectItem>
//                     <SelectItem value="fr">French</SelectItem>
//                     <SelectItem value="de">German</SelectItem>
//                     <SelectItem value="zh">Chinese</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="default-level">Default Course Level</Label>
//                 <Select defaultValue="all">
//                   <SelectTrigger id="default-level">
//                     <SelectValue placeholder="Select level" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="beginner">Beginner</SelectItem>
//                     <SelectItem value="intermediate">Intermediate</SelectItem>
//                     <SelectItem value="advanced">Advanced</SelectItem>
//                     <SelectItem value="all">All Levels</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <h4 className="font-medium">Enable course discussions</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Allow students to ask questions and discuss course content.
//                   </p>
//                 </div>
//                 <Switch defaultChecked={true} />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <h4 className="font-medium">Enable course reviews</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Allow students to leave reviews on your courses.
//                   </p>
//                 </div>
//                 <Switch defaultChecked={true} />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="border-destructive">
//           <CardHeader>
//             <CardTitle className="text-destructive">Danger Zone</CardTitle>
//             <CardDescription>
//               Irreversible and destructive actions.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h4 className="font-medium">Delete Instructor Account</h4>
//                 <p className="text-sm text-muted-foreground">
//                   Permanently remove your instructor account and all associated data.
//                 </p>
//               </div>
//               <Button variant="destructive">Delete Account</Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </InstructorLayout>
//   );
// };

// export default InstructorSettings;
