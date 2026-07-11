// // src/components/profile/PreferencesTab.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { Button } from '@/components/ui/button';
// import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardFooter,
// } from '@/components/ui/card';
// import { Icons } from '@/components/common/Icons';
// import { Separator } from '@/components/ui/separator';
// import { useTheme } from '@/contexts/ThemeContext'; // Hoặc import { useTheme as useNextThemes } from "next-themes";
// import { useToast } from '@/components/ui/use-toast';
// import {
//   useMyNotificationPreferences,
//   useUpdateMyNotificationPreferences,
// } from '@/hooks/queries/user.queries';
// import { Skeleton } from '@/components/ui/skeleton';
// import { cn } from '@/lib/utils';
// import { NotificationPreferences } from '@/services/user.service';

// // Định nghĩa các loại thông báo có thể cấu hình
// // Key phải khớp với các thuộc tính trong interface NotificationPreferences
// const notificationOptionsConfig: {
//   id: keyof NotificationPreferences; // Quan trọng: id phải là key của NotificationPreferences
//   label: string;
//   description: string;
// }[] = [
//   {
//     id: 'courseUpdates',
//     label: 'Course Updates & Announcements',
//     description:
//       'Get notified about new content, updates, or important announcements in your enrolled courses.',
//   },
//   {
//     id: 'newRecommendations',
//     label: 'Personalized Course Recommendations',
//     description:
//       'Receive tailored course suggestions based on your learning activity and interests.',
//   },
//   {
//     id: 'promotions',
//     label: 'Promotions & Special Offers',
//     description:
//       'Be the first to know about exclusive discounts, special promotions, and early bird offers.',
//   },
//   {
//     id: 'platformAnnouncements',
//     label: 'Platform News & Feature Updates',
//     description:
//       'Stay informed about new platform features, improvements, and important general announcements from 3TEduTech.',
//   },
//   // Thêm các tùy chọn khác nếu API hỗ trợ
//   // { id: 'weeklyDigest', label: 'Weekly Learning Digest', description: 'Receive a summary of your learning progress and new relevant content weekly.' },
// ];

// export const PreferencesTab: React.FC = () => {
//   const { toast } = useToast();
//   const { theme, setTheme } = useTheme();

//   const {
//     data: currentApiPrefs,
//     isLoading: isLoadingPrefs,
//     error: prefsError,
//     refetch: refetchPrefs, // Để refetch sau khi update lỗi và user muốn thử lại
//   } = useMyNotificationPreferences();

//   const updatePrefsMutation = useUpdateMyNotificationPreferences({
//     onSuccess: (updatedData) => {
//       // currentApiPrefs sẽ tự động được cập nhật bởi queryClient.setQueryData trong hook
//       setLocalPrefs(updatedData); // Cập nhật local state với dữ liệu đã lưu thành công
//       toast({
//         title: 'Preferences Saved',
//         description:
//           'Your notification settings have been successfully updated.',
//       });
//     },
//     onError: (error) => {
//       toast({
//         variant: 'destructive',
//         title: 'Update Failed',
//         description:
//           error.message ||
//           'Could not save your notification preferences. Please try again.',
//       });
//       // Không rollback localPrefs ở đây, để user có thể thử lại với giá trị họ đã chọn
//     },
//   });

//   const [localPrefs, setLocalPrefs] = useState<
//     Partial<NotificationPreferences>
//   >({});
//   const [hasChanges, setHasChanges] = useState(false);

//   useEffect(() => {
//     if (currentApiPrefs) {
//       setLocalPrefs(currentApiPrefs);
//     }
//   }, [currentApiPrefs]);

//   // Kiểm tra xem có thay đổi nào không
//   useEffect(() => {
//     if (currentApiPrefs && Object.keys(localPrefs).length > 0) {
//       const changed = notificationOptionsConfig.some(
//         (opt) => localPrefs[opt.id] !== currentApiPrefs[opt.id]
//       );
//       setHasChanges(changed);
//     } else if (
//       !currentApiPrefs &&
//       Object.values(localPrefs).some((val) => val === true)
//     ) {
//       // Trường hợp API chưa trả về gì, nhưng user đã toggle -> coi như có thay đổi
//       setHasChanges(true);
//     } else {
//       setHasChanges(false);
//     }
//   }, [localPrefs, currentApiPrefs]);

//   const handleNotificationToggle = (
//     prefKey: keyof NotificationPreferences,
//     checked: boolean
//   ) => {
//     setLocalPrefs((prev) => ({ ...prev, [prefKey]: checked }));
//   };

//   const handleSaveChanges = () => {
//     if (!hasChanges) {
//       toast({
//         title: 'No Changes',
//         description: 'Notification preferences are already up to date.',
//       });
//       return;
//     }

//     const prefsToUpdate: Partial<NotificationPreferences> = {};
//     notificationOptionsConfig.forEach((opt) => {
//       if (localPrefs[opt.id] !== undefined) {
//         // Chỉ gửi những key có trong localPrefs (đã được toggle)
//         prefsToUpdate[opt.id] = localPrefs[opt.id];
//       }
//     });

//     if (Object.keys(prefsToUpdate).length > 0) {
//       updatePrefsMutation.mutate(prefsToUpdate);
//     }
//   };

//   const isThemeDark = theme === 'dark';
//   const toggleAppTheme = () => {
//     const newTheme = isThemeDark ? 'light' : 'dark';
//     setTheme(newTheme); // Hàm setTheme từ useTheme (next-themes) sẽ tự lưu vào localStorage
//     toast({
//       title: `Switched to ${
//         newTheme.charAt(0).toUpperCase() + newTheme.slice(1)
//       } Mode`,
//       description: `Enjoy the new look of 3TEduTech!`,
//     });
//   };

//   return (
//     <div className="space-y-8">
//       {/* Theme Preference Card */}
//       <Card className="dark:bg-slate-800/30 shadow-lg border dark:border-slate-700/60">
//         <CardHeader className="border-b dark:border-slate-700/60 pb-4">
//           <CardTitle className="text-2xl font-semibold flex items-center">
//             <Icons.palette className="mr-3 h-6 w-6 text-purple-500 dark:text-purple-400" />
//             Appearance
//           </CardTitle>
//           <CardDescription className="text-sm">
//             Customize the look and feel of the application to your preference.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="p-6">
//           <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors">
//             <div className="space-y-0.5">
//               <Label
//                 htmlFor="dark-mode-switch-prefs"
//                 className="text-base font-medium cursor-pointer"
//               >
//                 Dark Mode
//               </Label>
//               <p className="text-sm text-muted-foreground">
//                 Switch between the light and dark themes for comfortable
//                 viewing.
//               </p>
//             </div>
//             <Switch
//               id="dark-mode-switch-prefs"
//               checked={isThemeDark}
//               onCheckedChange={toggleAppTheme}
//               aria-label="Toggle dark mode"
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* Email Notifications Card */}
//       {/* <Card className="dark:bg-slate-800/30 shadow-lg border dark:border-slate-700/60">
//         <CardHeader className="border-b dark:border-slate-700/60 pb-4">
//           <CardTitle className="text-2xl font-semibold flex items-center">
//             <Icons.bellRing className="mr-3 h-6 w-6 text-orange-500 dark:text-orange-400" />
//             Email Notifications
//           </CardTitle>
//           <CardDescription className="text-sm">
//             Manage how you receive email updates and announcements from
//             3TEduTech.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="p-6 space-y-5">
//           {isLoadingPrefs ? (
//             notificationOptionsConfig.map((opt) => (
//               <div
//                 key={`skeleton-${String(opt.id)}`}
//                 className="flex items-center justify-between py-3"
//               >
//                 <div className="space-y-1.5 flex-1 mr-4">
//                   <Skeleton className="h-5 w-1/2 rounded" />
//                   <Skeleton className="h-3.5 w-full rounded" />
//                 </div>
//                 <Skeleton className="h-6 w-10 rounded-full" />
//               </div>
//             ))
//           ) : prefsError ? (
//             <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center">
//               <Icons.alertTriangle className="h-5 w-5 mr-2 " />
//               Could not load notification preferences.{' '}
//               <Button
//                 variant="link"
//                 size="sm"
//                 onClick={() => refetchPrefs()}
//                 className="p-0 h-auto ml-1"
//               >
//                 Retry
//               </Button>
//             </div>
//           ) : (
//             notificationOptionsConfig.map((opt) => (
//               <div
//                 key={String(opt.id)}
//                 className="flex items-start sm:items-center justify-between py-2.5 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors -mx-3 px-3"
//               >
//                 <div className="space-y-0.5 mr-4 flex-1">
//                   <Label
//                     htmlFor={`notif-${String(opt.id)}`}
//                     className="font-medium text-base cursor-pointer"
//                   >
//                     {opt.label}
//                   </Label>
//                   <p className="text-sm text-muted-foreground leading-snug">
//                     {opt.description}
//                   </p>
//                 </div>
//                 <Switch
//                   id={`notif-${String(opt.id)}`}
//                   checked={localPrefs[opt.id] ?? false}
//                   onCheckedChange={(checked) =>
//                     handleNotificationToggle(opt.id, checked)
//                   }
//                   disabled={updatePrefsMutation.isPending}
//                   aria-label={opt.label}
//                 />
//               </div>
//             ))
//           )}
//         </CardContent>
//         {!isLoadingPrefs && !prefsError && (
//           <CardFooter className="border-t dark:border-slate-700/60 pt-6">
//             <Button
//               onClick={handleSaveChanges}
//               disabled={updatePrefsMutation.isPending || !hasChanges}
//               size="lg"
//               className="h-11 px-6 text-base"
//             >
//               {updatePrefsMutation.isPending ? (
//                 <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
//               ) : (
//                 <Icons.save className="mr-2 h-5 w-5" />
//               )}
//               Save Notification Settings
//             </Button>
//           </CardFooter>
//         )}
//       </Card> */}
//     </div>
//   );
// };
