// import { useState } from 'react';
// import Layout from '@/components/layout/Layout';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Switch } from '@/components/ui/switch';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { useToast } from '@/hooks/use-toast';
// import { useNotification } from '@/hooks/use-notification';

// const NotificationSettings = () => {
//   const { toast } = useToast();
//   const notification = useNotification();

//   const [emailSettings, setEmailSettings] = useState({
//     courseUpdates: true,
//     accountNotifications: true,
//     promotionalEmails: false,
//     newCoursesFromInstructors: true,
//     newsletter: false,
//   });

//   const [pushSettings, setPushSettings] = useState({
//     courseReleases: true,
//     messages: true,
//     courseCompletion: true,
//     specialOffers: false,
//     courseRecommendations: true,
//   });

//   const handleSaveSettings = () => {
//     toast({
//       title: 'Settings saved',
//       description: 'Your notification preferences have been updated.',
//     });

//     notification.notifySuccess(
//       'Settings Updated',
//       'Your notification preferences have been successfully saved.'
//     );
//   };

//   const handleResetToDefault = () => {
//     setEmailSettings({
//       courseUpdates: true,
//       accountNotifications: true,
//       promotionalEmails: false,
//       newCoursesFromInstructors: true,
//       newsletter: false,
//     });

//     setPushSettings({
//       courseReleases: true,
//       messages: true,
//       courseCompletion: true,
//       specialOffers: false,
//       courseRecommendations: true,
//     });

//     toast({
//       title: 'Default settings restored',
//       description:
//         'Your notification settings have been reset to default values.',
//     });
//   };

//   return (
//     <Layout>
//       <div className="container py-8">
//         <div className="max-w-4xl mx-auto space-y-8">
//           <div>
//             <h1 className="text-3xl font-bold">Account Notifications</h1>
//             <p className="text-muted-foreground mt-2">
//               Manage how you want to be notified about your course updates and
//               platform activities.
//             </p>
//           </div>

//           <Tabs defaultValue="email" className="w-full">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="email">Email Notifications</TabsTrigger>
//               <TabsTrigger value="push">Push Notifications</TabsTrigger>
//             </TabsList>

//             {/* Email Notifications */}
//             <TabsContent value="email" className="space-y-4 mt-4">
//               <Alert>
//                 <AlertTitle>Email Delivery</AlertTitle>
//                 <AlertDescription>
//                   All emails will be sent to your verified email address. You
//                   can change it in your account settings.
//                 </AlertDescription>
//               </Alert>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Email Notification Preferences</CardTitle>
//                   <CardDescription>
//                     Choose which emails you'd like to receive
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {Object.entries(emailSettings).map(([key, value]) => (
//                     <div
//                       key={key}
//                       className="flex items-center justify-between"
//                     >
//                       <div>
//                         <p className="font-medium">
//                           {key
//                             .replace(/([A-Z])/g, ' $1')
//                             .replace(/^./, (str) => str.toUpperCase())}
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           {getSettingDescription(key)}
//                         </p>
//                       </div>
//                       <Switch
//                         checked={value}
//                         onCheckedChange={(checked) =>
//                           setEmailSettings((prev) => ({
//                             ...prev,
//                             [key]: checked,
//                           }))
//                         }
//                       />
//                     </div>
//                   ))}
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             {/* Push Notifications */}
//             <TabsContent value="push" className="space-y-4 mt-4">
//               <Alert>
//                 <AlertTitle>Browser Notifications</AlertTitle>
//                 <AlertDescription>
//                   Push notifications will appear on your browser when you're
//                   online. You may need to allow notifications in your browser
//                   settings.
//                 </AlertDescription>
//               </Alert>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Push Notification Preferences</CardTitle>
//                   <CardDescription>
//                     Select which push notifications you want to receive
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {Object.entries(pushSettings).map(([key, value]) => (
//                     <div
//                       key={key}
//                       className="flex items-center justify-between"
//                     >
//                       <div>
//                         <p className="font-medium">
//                           {key
//                             .replace(/([A-Z])/g, ' $1')
//                             .replace(/^./, (str) => str.toUpperCase())}
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           {getSettingDescription(key)}
//                         </p>
//                       </div>
//                       <Switch
//                         checked={value}
//                         onCheckedChange={(checked) =>
//                           setPushSettings((prev) => ({
//                             ...prev,
//                             [key]: checked,
//                           }))
//                         }
//                       />
//                     </div>
//                   ))}
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           </Tabs>

//           <div className="flex justify-between">
//             <Button variant="outline" onClick={handleResetToDefault}>
//               Reset to Default
//             </Button>
//             <Button onClick={handleSaveSettings}>Save Settings</Button>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// // Helper function to get descriptions for settings
// function getSettingDescription(key: string): string {
//   const descriptions: Record<string, string> = {
//     courseUpdates:
//       "Get notifications about updates to courses you're enrolled in",
//     accountNotifications: 'Receive important updates about your account',
//     promotionalEmails: 'Special offers and discounts for courses',
//     newCoursesFromInstructors:
//       'Be notified when instructors you follow publish new courses',
//     newsletter: 'Weekly educational content and platform updates',
//     courseReleases: 'Get notified when new course content is released',
//     messages: 'Receive notifications for new messages',
//     courseCompletion:
//       'Celebration alerts when you complete courses or milestones',
//     specialOffers: 'Limited-time deals and special pricing',
//     courseRecommendations:
//       'Personalized course suggestions based on your interests',
//   };

//   return descriptions[key] || 'Notification preference';
// }

// export default NotificationSettings;
