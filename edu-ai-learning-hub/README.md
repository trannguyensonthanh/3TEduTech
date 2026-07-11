# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/528cadf2-20e1-44ee-abc7-062f91d817fc

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/528cadf2-20e1-44ee-abc7-062f91d817fc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/528cadf2-20e1-44ee-abc7-062f91d817fc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

/_ eslint-disable @typescript-eslint/no-explicit-any _/
// src/components/instructor/courseCreate/LessonDialog.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import \* as z from 'zod';
import {
Dialog,
DialogContent,
DialogFooter,
DialogHeader,
DialogTitle,
DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
Form,
FormControl,
FormDescription,
FormField,
FormItem,
FormLabel,
FormMessage,
} from '@/components/ui/form';
import {
Video,
FileText,
BookOpen as BookIcon,
Upload,
Trash,
Edit,
Plus,
File as FileIcon,
X,
Link as LinkIcon,
Cloud,
Captions,
AlertTriangle,
} from 'lucide-react'; // Renamed Book
import { toast } from '@/hooks/use-toast';
import QuizQuestionDialog from './QuizQuestionDialog';
import {
Lesson,
LessonType,
QuizQuestion,
Attachment,
Subtitle,
QuizOption,
} from '@/hooks/useCourseCurriculum';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { generateTempId } from '@/components/common/generateTempId';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { useLessonVideoUrl } from '@/hooks/queries/lesson.queries';
// --- Zod Schema ---
const quizOptionSchemaFE = z.object({
tempId: z.union([z.string(), z.number()]).optional(),
id: z.number().optional(),
optionText: z.string().min(1, 'Option text is required').max(500),
isCorrectAnswer: z.boolean().default(false),
optionOrder: z.number().optional(),
});

const quizQuestionSchemaFE = z.object({
tempId: z.union([z.string(), z.number()]).optional(),
id: z.number().optional(),
questionText: z.string().min(1),
explanation: z.string().nullable().optional(),
questionOrder: z.number().optional(),
options: z.array(quizOptionSchemaFE).min(2),
});

const attachmentSchemaFE = z.object({
tempId: z.union([z.string(), z.number()]).optional(),
id: z.number().optional(),
fileName: z.string(),
fileUrl: z.string().optional(),
fileType: z.string().optional(),
fileSize: z.number().optional(),
file: z.custom<File>((val) => val instanceof File, 'Invalid file'),
});

const subtitleSchemaFE = z.object({
tempId: z.union([z.string(), z.number()]).optional(),
id: z.number().optional(),
languageCode: z.string().min(1).max(10),
languageName: z.string().min(1).max(50),
subtitleUrl: z.string().url('Invalid Subtitle URL').min(1),
isDefault: z.boolean().default(false),
});

const lessonFormSchema = z
.object({
lessonName: z.string().min(1, 'Lesson name is required').max(255),
description: z.string().max(4000).optional().nullable(),
lessonType: z.enum(['VIDEO', 'TEXT', 'QUIZ']),
isFreePreview: z.boolean().default(false),
videoSourceType: z
.enum(['CLOUDINARY', 'YOUTUBE', 'VIMEO'])
.optional()
.nullable(),
externalVideoInput: z
.string()
.max(1000)
.refine((val) => !val || /^(ftp|http|https):\/\/[^ "]+$/.test(val), {
message: 'Invalid URL format',
})
.optional()
.nullable(),
lessonVideo: z
.custom<File | null>(
(val) => val === null || val instanceof File,
'Invalid file'
)
.optional()
.nullable(),
textContent: z.string().max(20000).optional().nullable(),
})
.refine(
(data) =>
data.lessonType !== 'VIDEO' ||
data.videoSourceType === 'CLOUDINARY' ||
!!data.externalVideoInput?.trim(),
{
message: 'YouTube/Vimeo link is required',
path: ['externalVideoInput'],
}
)
.refine(
(data) =>
data.lessonType !== 'VIDEO' ||
data.videoSourceType !== 'CLOUDINARY' ||
!!data.lessonVideo ||
!!data.externalVideoInput,
{
message: 'Please upload a video file or provide an existing video ID', // Clarified message
path: ['lessonVideo'],
}
)
.refine((data) => data.lessonType !== 'TEXT' || !!data.textContent?.trim(), {
message: 'Text content is required',
path: ['textContent'],
});

type LessonFormData = z.infer<typeof lessonFormSchema>;

interface LessonDialogProps {
open: boolean;
onClose: () => void;
onSave: (data: Lesson) => void;
initialData: Lesson | null;
isEditing: boolean;
lessonVideoRef: React.RefObject<HTMLInputElement>;
attachmentRef: React.RefObject<HTMLInputElement>;
}

const LessonDialog: React.FC<LessonDialogProps> = ({
open,
onClose,
onSave,
initialData,
isEditing,
lessonVideoRef,
attachmentRef,
}) => {
const form = useForm<LessonFormData>({
resolver: zodResolver(lessonFormSchema),
defaultValues: {
lessonName: '',
description: null,
lessonType: 'VIDEO',
isFreePreview: false,
videoSourceType: 'CLOUDINARY',
externalVideoInput: null,
lessonVideo: null,
textContent: null,
},
});

const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
const [attachments, setAttachments] = useState<Attachment[]>([]);
const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
const [lessonVideoPreview, setLessonVideoPreview] = useState<string | null>(
null
);
const [quizDialogOpen, setQuizDialogOpen] = useState(false);
const [editingQuizQuestion, setEditingQuizQuestion] =
useState<QuizQuestion | null>(null);
const [newSubtitle, setNewSubtitle] = useState<
Omit<Subtitle, 'id' | 'tempId'>

> ({

    languageCode: '',
    languageName: '',
    subtitleUrl: '',
    isDefault: false,

});
const { data: lessonVideoData, isLoading: isLoadingLessonVideo } =
useLessonVideoUrl(initialData ? Number(initialData.lessonId) : undefined);
console.log('LessonDialog initialData:', initialData);
console.log('lessonVideoData:', lessonVideoData);

useEffect(() => {
if (lessonVideoPreview?.startsWith('blob:')) {
console.log(
'Revoking previous blob preview on effect run:',
lessonVideoPreview
);
URL.revokeObjectURL(lessonVideoPreview);
}

    form.resetField('lessonVideo');
    let newPreviewUrl: string | null = null;
    let shouldRevokeOldPreview = true; // Mặc định là revoke preview cũ
    if (open) {
      if (isEditing && initialData) {
        form.reset({
          lessonName: initialData.lessonName,
          description: initialData.description || null,
          lessonType: initialData.lessonType,
          isFreePreview: initialData.isFreePreview,
          videoSourceType:
            initialData.videoSourceType ||
            (initialData.lessonType === 'VIDEO' ? 'CLOUDINARY' : null),
          externalVideoInput:
            initialData.videoSourceType === 'YOUTUBE'
              ? `https://youtube.com/watch?v=${initialData.externalVideoId}`
              : initialData.videoSourceType === 'VIMEO'
              ? `https://vimeo.com/${initialData.externalVideoId}`
              : null,
          textContent: initialData.textContent || null,
          lessonVideo: initialData.lessonVideoFile || null,
        });
        if (initialData.lessonType === 'VIDEO') {
          if (initialData.videoSourceType === 'CLOUDINARY') {
            if (initialData.lessonVideoFile instanceof File) {
              // Nếu có File object, tạo Blob URL mới
              console.log(
                '[useEffect] Editing, Cloudinary type, found lessonVideoFile. Creating new Blob URL.'
              );
              newPreviewUrl = URL.createObjectURL(initialData.lessonVideoFile);
              // Nếu Blob URL mới giống hệt Blob URL cũ đang hiển thị (ít khả năng, nhưng để an toàn)
              // thì không cần revoke cái cũ rồi set lại cái giống hệt.
              // Tuy nhiên, việc luôn tạo mới và revoke cũ có thể an toàn hơn về mặt quản lý resource.
              if (lessonVideoPreview === newPreviewUrl) {
                shouldRevokeOldPreview = false; // Không revoke nếu URL giống hệt
              }
            } else if (initialData?.externalVideoId === undefined) {
              // Trường hợp: Đã upload lên Cloudinary, sử dụng signedUrl từ lessonVideoData
              newPreviewUrl = lessonVideoData?.signedUrl;
              console.log(
                '[useEffect] Editing, Cloudinary type, using signedUrl from lessonVideoData:',
                newPreviewUrl
              );
              // Nếu URL mới giống với preview hiện tại, không cần làm gì
              if (lessonVideoPreview === newPreviewUrl) {
                shouldRevokeOldPreview = false;
              }
            }
          } else if (
            initialData.videoSourceType === 'YOUTUBE' ||
            initialData.videoSourceType === 'VIMEO'
          ) {
            // Xử lý cho YouTube/Vimeo nếu bạn có cách hiển thị preview đặc biệt
            // Hiện tại, bạn chỉ có input cho link, nên không cần preview ở đây
            console.log(
              'Editing: YouTube/Vimeo link, no direct preview in dialog for now.'
            );
          }
        }
        // Add tempIds for proper key management and editing
        // *** FIX: Cập nhật state cho quiz, attachments, subtitles ***
        setQuizQuestions(
          initialData.questions?.map((q) => ({
            ...q,
            tempId: q.tempId || q.id || generateTempId('question'),
            options: (q.options || []).map((o) => ({
              ...o,
              tempId: o.tempId || o.id || generateTempId('option'),
            })),
          })) || []
        );

        setAttachments(
          initialData.attachments?.map(
            (a) =>
              ({
                ...a,
                tempId: a.tempId || a.id || generateTempId('attach'),
                file: null, // Luôn reset file object khi load lại
              } as any)
          ) || []
        ); // Cần ép kiểu any vì ta thêm file: null

        setSubtitles(
          initialData.subtitles?.map((s) => ({
            ...s,
            tempId: s.tempId || s.id || generateTempId('subtitle'),
          })) || []
        );
        setLessonVideoPreview(null);
        // Display existing Cloudinary video info (if editing)
        if (
          initialData.videoSourceType === 'CLOUDINARY' &&
          initialData.externalVideoId === undefined
        ) {
          // You might want to display a placeholder or the public ID instead of trying to preview
          console.log(
            'Existing Cloudinary Video ID:',
            initialData.externalVideoId
          );
        }
      } else {
        form.reset();
        setQuizQuestions([]);
        setAttachments([]);
        setSubtitles([]);
        setLessonVideoPreview(null);
      }
      setNewSubtitle({
        languageCode: '',
        languageName: '',
        subtitleUrl: '',
        isDefault: false,
      });
      setEditingQuizQuestion(null); // Reset cả câu hỏi đang sửa
      setQuizDialogOpen(false); // Đảm bảo dialog quiz đóng
    }
    // Dọn dẹp Blob URL cũ *trước khi* set cái mới nếu cần
    if (shouldRevokeOldPreview && lessonVideoPreview?.startsWith('blob:')) {
      console.log('[useEffect] Revoking old blob preview:', lessonVideoPreview);
      URL.revokeObjectURL(lessonVideoPreview);
    }

    // Cập nhật state preview
    // Chỉ cập nhật nếu newPreviewUrl khác với lessonVideoPreview hiện tại để tránh vòng lặp vô hạn nếu lessonVideoPreview nằm trong dependency array
    // (Mặc dù hiện tại nó không nằm trong dependency array của useEffect này)
    if (lessonVideoPreview !== newPreviewUrl) {
      console.log('[useEffect] Setting lessonVideoPreview to:', newPreviewUrl);
      setLessonVideoPreview(newPreviewUrl);
    }
    // Quan trọng: Không reset form.setValue('lessonVideo', null) ở đây nữa.
    // Trường 'lessonVideo' của RHF sẽ chỉ được set khi người dùng chọn file mới trong handleVideoFileChange.

}, [open, isEditing, initialData, form]);

// Dọn dẹp Blob URL cuối cùng khi component unmount (dialog đóng hoàn toàn)
// useEffect dọn dẹp khi component unmount
useEffect(() => {
return () => {
if (lessonVideoPreview?.startsWith('blob:')) {
console.log(
'[useEffect Cleanup] Revoking blob preview on unmount:',
lessonVideoPreview
);
URL.revokeObjectURL(lessonVideoPreview);
}
};
}, [lessonVideoPreview]); // Chỉ chạy khi lessonVideoPreview thay đổi
const handleFormSubmit = (formData: LessonFormData) => {
const newSelectedFile = form.getValues('lessonVideo'); // File | null
console.log('New selected file:', newSelectedFile);
console.log(' initialData.lessonVideoFile:', initialData?.lessonVideoFile);
console.log(newSelectedFile instanceof File);
// Xác định File object cuối cùng
let finalFileObject: File | null = null;
if (newSelectedFile instanceof File) {
finalFileObject = newSelectedFile;
} else if (isEditing && initialData?.lessonVideoFile instanceof File) {
finalFileObject = initialData.lessonVideoFile;
}

    // Xác định externalVideoId cuối cùng
    let finalExternalVideoId: string | null | undefined = undefined;
    if (formData.videoSourceType === 'CLOUDINARY') {
      if (finalFileObject) {
        // Nếu có file mới hoặc giữ file cũ (chưa upload), externalId sẽ do backend xử lý khi upload
        finalExternalVideoId = null;
      } else if (
        isEditing &&
        initialData?.videoSourceType === 'CLOUDINARY' &&
        initialData?.externalVideoId
      ) {
        finalExternalVideoId = initialData.externalVideoId; // Giữ ID Cloudinary cũ nếu không có file mới
      }
    } else {
      // YouTube, Vimeo
      finalExternalVideoId = formData.externalVideoInput;
    }
    console.log('finalFileObject:', finalFileObject);
    const finalLessonData: Lesson = {
      // ID và order luôn lấy từ initialData nếu đang edit
      tempId:
        initialData?.tempId ||
        (isEditing && initialData?.id ? undefined : generateTempId('lesson')),
      id: isEditing ? initialData?.id : undefined,
      lessonOrder: isEditing ? initialData?.lessonOrder : undefined,

      // Các trường từ form
      lessonName: formData.lessonName,
      description: formData.description,
      lessonType: formData.lessonType,
      isFreePreview: formData.isFreePreview,
      videoSourceType: formData.videoSourceType,
      textContent: formData.textContent,
      externalVideoInput: formData.externalVideoInput, // Giữ lại để form có thể hiển thị, nhưng externalVideoId mới là cái quan trọng

      // Các trường đã xử lý
      lessonVideoFile: finalFileObject,
      lessonVideo: finalFileObject, // Giữ lại để form có thể hiển thị, nhưng lessonVideoFile mới là cái quan trọng
      externalVideoId: finalExternalVideoId,

      // Các mảng từ state của dialog
      questions:
        formData.lessonType === 'QUIZ'
          ? quizQuestions
          : isEditing
          ? initialData?.questions
          : [],
      attachments: attachments,
      subtitles:
        formData.lessonType === 'VIDEO'
          ? subtitles
          : isEditing
          ? initialData?.subtitles
          : [],

      // Dọn dẹp (có thể gộp vào logic trên nếu muốn)
      ...(formData.lessonType !== 'VIDEO' && {
        videoSourceType: undefined,
        externalVideoId: undefined,
        lessonVideoFile: undefined,
        subtitles: undefined,
      }),
      ...(formData.lessonType !== 'TEXT' && { textContent: undefined }),
      ...(formData.lessonType !== 'QUIZ' && { questions: undefined }),
    };
    console.log('finalLessonData:', finalLessonData);
    console.log(
      '[LessonDialog] Final lesson data to save:',
      JSON.parse(JSON.stringify(finalLessonData))
    );
    onSave(finalLessonData);

};

const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// Clean up previous blob URL if exists
if (lessonVideoPreview?.startsWith('blob:')) {
URL.revokeObjectURL(lessonVideoPreview);
}
setLessonVideoPreview(null); // Reset
if (e.target.files && e.target.files[0]) {
const file = e.target.files[0];
form.setValue('lessonVideo', file, { shouldValidate: true });
const previewUrl = URL.createObjectURL(file);
setLessonVideoPreview(previewUrl);
toast({ title: 'Video Selected', description: file.name });
} else {
form.setValue('lessonVideo', null);
}
};

const handleInternalAttachmentUpload = (
e: React.ChangeEvent<HTMLInputElement>
) => {
if (e.target.files && e.target.files[0]) {
const file = e.target.files[0];
const newAttachment: Attachment = {
tempId: generateTempId('attach'),
fileName: file.name,
fileType: file.type,
fileSize: file.size,
file: file,
// fileUrl: URL.createObjectURL(file) // Create blob URL for preview if needed
};
setAttachments((prev) => [...prev, newAttachment]);
toast({
title: 'Attachment Added',
description: `File "${file.name}" ready.`,
});
if (attachmentRef.current) attachmentRef.current.value = '';
}
};

const handleInternalRemoveAttachment = (attachmentId: number | string) => {
if (window.confirm('Remove this attachment?')) {
const attachmentToRemove = attachments.find(
(a) => a.id === attachmentId || a.tempId === attachmentId
);
if (attachmentToRemove?.fileUrl?.startsWith('blob:')) {
URL.revokeObjectURL(attachmentToRemove.fileUrl);
}
setAttachments((prev) =>
prev.filter((a) => a.id !== attachmentId && a.tempId !== attachmentId)
);
toast({ title: 'Attachment Removed' });
}
};

// --- Quiz Question Logic ---
const openAddQuizDialog = () => {
setEditingQuizQuestion(null);
setQuizDialogOpen(true);
};
const openEditQuizDialog = (question: QuizQuestion) => {
setEditingQuizQuestion(question);
setQuizDialogOpen(true);
};
const saveQuizQuestion = (questionDataFromDialog: any) => {
const questionToSave: QuizQuestion = {
...questionDataFromDialog,
tempId:
editingQuizQuestion?.tempId ||
questionDataFromDialog.tempId ||
(editingQuizQuestion?.id ? undefined : generateTempId('question')),
id: editingQuizQuestion?.id,
questionOrder: editingQuizQuestion?.questionOrder ?? quizQuestions.length,
options: questionDataFromDialog.options.map(
(opt: any, index: number) => ({
...opt,
tempId: opt.tempId || `option-${Date.now()}-${index}`,
optionOrder: index,
})
),
};
setQuizQuestions((prev) => {
if (editingQuizQuestion) {
return prev.map((q) =>
q.id === editingQuizQuestion.id ||
q.tempId === editingQuizQuestion.tempId
? questionToSave
: q
);
} else {
return [...prev, questionToSave];
}
});
setQuizDialogOpen(false);
};
const deleteQuizQuestionInternal = (questionId: number | string) => {
if (window.confirm('Delete this question?')) {
setQuizQuestions((prev) =>
prev
.filter((q) => q.id !== questionId && q.tempId !== questionId)
.map((q, index) => ({ ...q, questionOrder: index }))
);
toast({ title: 'Question removed', variant: 'destructive' });
}
};

// --- Subtitle Logic ---
const handleAddSubtitle = () => {
if (
!newSubtitle.languageCode.trim() ||
!newSubtitle.languageName.trim() ||
!newSubtitle.subtitleUrl.trim()
) {
toast({
title: 'Missing Info',
description: 'Please provide language code, name, and URL.',
variant: 'destructive',
});
return;
}
try {
// Validate URL format before adding
new URL(newSubtitle.subtitleUrl);
} catch (\_) {
toast({
title: 'Invalid URL',
description: 'Please enter a valid Subtitle URL.',
variant: 'destructive',
});
return;
}

    const subtitleToAdd: Subtitle = {
      ...newSubtitle,
      tempId: generateTempId('subtitle'),
    };
    setSubtitles((prev) => {
      // Ensure only one default
      if (subtitleToAdd.isDefault) {
        return [
          ...prev.map((s) => ({ ...s, isDefault: false })),
          subtitleToAdd,
        ];
      }
      return [...prev, subtitleToAdd];
    });
    // Reset form
    setNewSubtitle({
      languageCode: '',
      languageName: '',
      subtitleUrl: '',
      isDefault: false,
    });
    toast({
      title: 'Subtitle Added',
      description: `Subtitle for ${subtitleToAdd.languageName} added.`,
    });

};

const handleRemoveSubtitle = (subtitleId: number | string) => {
if (window.confirm('Delete this subtitle?')) {
setSubtitles((prev) =>
prev.filter((s) => s.id !== subtitleId && s.tempId !== subtitleId)
);
toast({ title: 'Subtitle Removed', variant: 'destructive' });
}
};

const handleSetDefaultSubtitle = (subtitleId: number | string) => {
setSubtitles((prev) =>
prev.map((s) => ({
...s,
isDefault: s.id === subtitleId || s.tempId === subtitleId,
}))
);
toast({ title: 'Default Subtitle Set' });
};
console.log(!form.formState.isValid || form.formState.isSubmitting);
// --- RENDER ---
return (

<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
{' '}
{/_ Ensure onClose is called _/}
<DialogContent className="max-w-3xl max-h-[90vh]">
{' '}
{/_ Set max height _/}
<DialogHeader>
<DialogTitle>
{isEditing ? 'Edit Lesson' : 'Add New Lesson'}
</DialogTitle>
</DialogHeader>
{/_ Wrap form content in ScrollArea _/}
<ScrollArea className="max-h-[calc(90vh-200px)] pr-6">
{' '}
{/_ Adjust max-height as needed, add padding right _/}
<Form {...form}>
<form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-6 p-1"
            >
{/_ Lesson Name _/}
<FormField
control={form.control}
name="lessonName"
render={({ field }) => (
<FormItem>
<FormLabel>Lesson Title \*</FormLabel>
<FormControl>
<Input
placeholder="e.g. Introduction to React Hooks"
{...field}
/>
</FormControl>
<FormMessage />
</FormItem>
)}
/>

              {/* Lesson Type Select */}
              <FormField
                control={form.control}
                name="lessonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="TEXT">Text</SelectItem>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Free Preview Checkbox */}
              <FormField
                control={form.control}
                name="isFreePreview"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Free Preview</FormLabel>
                      <FormDescription className="text-xs">
                        Allow users to view this lesson without enrolling.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe this lesson..."
                        {...field}
                        value={field.value ?? ''}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Conditional Content --- */}

              {/* Video Fields */}
              {form.watch('lessonType') === 'VIDEO' && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <h3 className="font-semibold text-base flex items-center">
                    <Video className="h-5 w-5 mr-2 text-primary" /> Video
                    Settings
                  </h3>
                  {/* Video Source Select */}
                  <FormField
                    control={form.control}
                    name="videoSourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Source</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? 'CLOUDINARY'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select video source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CLOUDINARY">
                              <Cloud className="inline-block h-4 w-4 mr-2" />
                              Upload (Cloudinary)
                            </SelectItem>
                            <SelectItem value="YOUTUBE">
                              <LinkIcon className="inline-block h-4 w-4 mr-2" />
                              YouTube Link
                            </SelectItem>
                            <SelectItem value="VIMEO">
                              <LinkIcon className="inline-block h-4 w-4 mr-2" />
                              Vimeo Link
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cloudinary Upload */}
                  {form.watch('videoSourceType') === 'CLOUDINARY' && (
                    <FormField
                      control={form.control}
                      name="lessonVideo"
                      render={(
                        { fieldState } // Use fieldState for errors
                      ) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Upload Video File</FormLabel>
                          <FormControl>
                            <div>
                              <input
                                type="file"
                                ref={lessonVideoRef}
                                accept="video/*"
                                style={{ display: 'none' }}
                                onChange={handleVideoFileChange}
                              />
                              {lessonVideoPreview ? (
                                <div className="relative group aspect-video">
                                  {' '}
                                  {/* Giữ aspect-video để duy trì tỷ lệ */}
                                  <video
                                    key={lessonVideoPreview}
                                    src={lessonVideoPreview}
                                    controls // Vẫn giữ controls gốc của trình duyệt
                                    className="w-full h-full rounded-md bg-black object-contain" // object-contain để không bị cắt nếu tỷ lệ khác
                                    onError={(e) => {
                                      // Xảy ra khi URL không hợp lệ (ví dụ Blob URL hết hạn, hoặc URL Cloudinary sai)
                                      console.error(
                                        'Video preview error:',
                                        e,
                                        lessonVideoPreview
                                      );
                                      toast({
                                        title: 'Video Preview Error',
                                        description:
                                          'Could not load video preview.',
                                        variant: 'destructive',
                                      });
                                      // Có thể reset preview ở đây
                                      // setLessonVideoPreview(null);
                                      // form.setValue('lessonVideo', null);
                                    }}
                                  />
                                  {/* Nút điều khiển đặt ở góc trên bên phải */}
                                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    {/* Nút Edit/Replace */}
                                    <Button
                                      type="button"
                                      variant="secondary" // Hoặc "outline" tùy style
                                      size="icon"
                                      className="h-8 w-8 rounded-full shadow" // Kích thước nhỏ hơn
                                      title="Replace Video"
                                      onClick={() =>
                                        lessonVideoRef.current?.click()
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {/* Nút Delete chỉ hiển thị cho Blob URL */}
                                    {lessonVideoPreview?.startsWith(
                                      'blob:'
                                    ) && (
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow" // Kích thước nhỏ hơn
                                        title="Remove Selected Video"
                                        onClick={() => {
                                          if (
                                            lessonVideoPreview?.startsWith(
                                              'blob:'
                                            )
                                          ) {
                                            URL.revokeObjectURL(
                                              lessonVideoPreview
                                            );
                                          }
                                          setLessonVideoPreview(null);
                                          form.setValue('lessonVideo', null);
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ) : isEditing &&
                                initialData?.videoSourceType === 'CLOUDINARY' &&
                                initialData?.externalVideoId ? (
                                <div className="border rounded p-3 text-sm text-muted-foreground flex items-center justify-between">
                                  <span>
                                    Video previously uploaded (ID:{' '}
                                    {initialData.externalVideoId.substring(
                                      0,
                                      15
                                    )}
                                    ...).
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      lessonVideoRef.current?.click()
                                    }
                                  >
                                    Replace
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                  onClick={() =>
                                    lessonVideoRef.current?.click()
                                  }
                                >
                                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground text-center mb-3">
                                    Drag & drop or click to browse
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    (Max 500MB)
                                  </span>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage>{fieldState.error?.message}</FormMessage>{' '}
                          {/* Display validation error */}
                        </FormItem>
                      )}
                    />
                  )}

                  {/* YouTube/Vimeo URL Input */}
                  {(form.watch('videoSourceType') === 'YOUTUBE' ||
                    form.watch('videoSourceType') === 'VIMEO') && (
                    <FormField
                      control={form.control}
                      name="externalVideoInput"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch('videoSourceType')} Video Link *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`Paste public ${form.watch(
                                'videoSourceType'
                              )} video link here`}
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* --- Subtitle Section --- */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3 text-base flex items-center">
                      <Captions className="h-5 w-5 mr-2" /> Subtitles (.vtt
                      files)
                    </h4>
                    {/* Add New Subtitle Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end border-b pb-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor="sub-lang-code"
                          className="text-xs font-medium"
                        >
                          Language Code *
                        </Label>
                        <Input
                          id="sub-lang-code"
                          size={12} // Replace with a valid number or remove the size prop
                          placeholder="en"
                          value={newSubtitle.languageCode}
                          onChange={(e) =>
                            setNewSubtitle({
                              ...newSubtitle,
                              languageCode: e.target.value
                                .toLowerCase()
                                .slice(0, 10),
                            })
                          }
                        />{' '}
                        {/* Limit length */}
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="sub-lang-name"
                          className="text-xs font-medium"
                        >
                          Display Name *
                        </Label>
                        <Input
                          id="sub-lang-name"
                          size={12}
                          placeholder="English"
                          value={newSubtitle.languageName}
                          onChange={(e) =>
                            setNewSubtitle({
                              ...newSubtitle,
                              languageName: e.target.value.slice(0, 50),
                            })
                          }
                        />{' '}
                        {/* Limit length */}
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="sub-url"
                          className="text-xs font-medium"
                        >
                          Subtitle URL (.vtt) *
                        </Label>
                        <Input
                          id="sub-url"
                          size={12}
                          placeholder="https://..."
                          type="url"
                          value={newSubtitle.subtitleUrl}
                          onChange={(e) =>
                            setNewSubtitle({
                              ...newSubtitle,
                              subtitleUrl: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2 md:col-span-3">
                        <Checkbox
                          id="sub-default"
                          checked={newSubtitle.isDefault}
                          onCheckedChange={(checked) =>
                            setNewSubtitle({
                              ...newSubtitle,
                              isDefault: !!checked,
                            })
                          }
                        />
                        <Label
                          htmlFor="sub-default"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Set as default subtitle
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddSubtitle}
                          className="ml-auto"
                          disabled={
                            !newSubtitle.languageCode.trim() ||
                            !newSubtitle.languageName.trim() ||
                            !newSubtitle.subtitleUrl.trim()
                          }
                        >
                          Add Subtitle
                        </Button>
                      </div>
                    </div>
                    {/* List Existing Subtitles */}
                    {subtitles.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Manage Subtitles
                        </Label>
                        {subtitles.map((sub) => (
                          <div
                            key={sub.tempId || sub.id}
                            className="flex items-center justify-between text-sm p-2 border rounded bg-background"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="defaultSubtitleRadio"
                                id={`default-${sub.tempId || sub.id}`}
                                checked={sub.isDefault}
                                onChange={() =>
                                  handleSetDefaultSubtitle(
                                    sub.tempId || sub.id!
                                  )
                                }
                                className="form-radio h-4 w-4 text-primary focus:ring-primary border-gray-300"
                              />
                              <Label
                                htmlFor={`default-${sub.tempId || sub.id}`}
                                className="cursor-pointer flex flex-col"
                              >
                                <span className="font-medium">
                                  {sub.languageName} ({sub.languageCode})
                                </span>
                                <a
                                  href={sub.subtitleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate max-w-[200px] sm:max-w-xs md:max-w-sm"
                                >
                                  {' '}
                                  {sub.subtitleUrl}
                                </a>
                              </Label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleRemoveSubtitle(sub.tempId || sub.id!)
                              }
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No subtitles added yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Text Fields */}
              {form.watch('lessonType') === 'TEXT' && (
                <FormField
                  control={form.control} // 'form.control' phải được truyền từ React Hook Form instance
                  name="textContent" // Tên của field trong form data
                  render={(
                    { fieldState } // field không cần trực tiếp ở đây khi dùng Controller
                  ) => (
                    <FormItem className="border rounded-md p-4 bg-muted/20">
                      <FormLabel className="font-semibold text-base flex items-center mb-3">
                        {' '}
                        {/* Tăng mb một chút */}
                        <FileText className="h-5 w-5 mr-2 text-primary" /> Text
                        Content *
                      </FormLabel>
                      <FormControl>
                        {/* Sử dụng Controller để tích hợp TiptapEditor */}
                        <Controller
                          name="textContent" // Tên field phải khớp
                          control={form.control} // Truyền control vào Controller
                          render={(
                            { field: controllerField } // field từ Controller
                          ) => (
                            <TiptapEditor
                              initialContent={controllerField.value || ''} // Giá trị ban đầu từ RHF
                              onContentChange={(htmlContent) => {
                                controllerField.onChange(htmlContent); // Cập nhật giá trị cho RHF
                              }}
                              // onBlur={controllerField.onBlur} // Tùy chọn: nếu TiptapEditor có hỗ trợ và bạn cần trigger validation onBlur
                              // Bạn có thể truyền thêm props để tùy chỉnh TiptapEditor nếu cần
                              // ví dụ: minHeight="300px" nếu TiptapEditor hỗ trợ prop đó
                            />
                          )}
                        />
                      </FormControl>
                      {/*
                      FormDescription có thể không cần thiết nếu TiptapEditor đã đủ rõ ràng
                      hoặc bạn có thể thêm mô tả phù hợp cho TiptapEditor.
                      Ví dụ: <FormDescription>Use the rich text editor to format your content.</FormDescription>
                    */}
                      <FormMessage /> {/* Hiển thị lỗi validation nếu có */}
                    </FormItem>
                  )}
                />
              )}

              {/* Quiz Fields */}
              {form.watch('lessonType') === 'QUIZ' && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <h3 className="font-semibold text-base flex items-center">
                      <BookIcon className="h-5 w-5 mr-2 text-primary" /> Quiz
                      Questions
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openAddQuizDialog}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Question
                    </Button>
                  </div>
                  {quizQuestions.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {quizQuestions.map((q, index) => (
                        <div
                          key={q.tempId || q.id}
                          className="border rounded-md p-3 bg-background"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">
                              Question {index + 1}:{' '}
                              <span className="font-normal">
                                {q.questionText}
                              </span>
                            </p>
                            <div className="flex space-x-1 flex-shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditQuizDialog(q)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  deleteQuizQuestionInternal(q.tempId || q.id!)
                                }
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {/* Optionally display options preview */}
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {q.options.map((opt) => (
                              <li
                                key={opt.tempId || opt.id}
                                className={`text-xs ${
                                  opt.isCorrectAnswer
                                    ? 'text-green-600 font-medium'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {opt.optionText}{' '}
                                {opt.isCorrectAnswer && '(Correct)'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed rounded-md">
                      <p className="text-muted-foreground text-sm mb-2">
                        No questions added yet.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openAddQuizDialog}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add First Question
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments Section */}
              <div className="border rounded-md p-4 space-y-3 bg-muted/20">
                <div className="flex justify-between items-center border-b pb-3 mb-3">
                  <h3 className="font-semibold text-base flex items-center">
                    <FileIcon className="h-5 w-5 mr-2 text-primary" /> Lesson
                    Attachments
                  </h3>
                  <div>
                    <input
                      type="file"
                      ref={attachmentRef}
                      style={{ display: 'none' }}
                      onChange={handleInternalAttachmentUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => attachmentRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" /> Add File
                    </Button>
                  </div>
                </div>
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.tempId || att.id}
                        className="flex items-center justify-between p-2 border rounded-md bg-background"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span
                            className="text-sm font-medium truncate"
                            title={att.fileName}
                          >
                            {att.fileName}
                          </span>
                          {att.fileSize && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(att.fileSize / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleInternalRemoveAttachment(
                              att.tempId || att.id!
                            )
                          }
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No attachments added.
                  </p>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !form.formState.isValid || form.formState.isSubmitting
                  }
                >
                  {form.formState.isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Lesson'
                    : 'Add Lesson'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>{' '}
        {/* Kết thúc ScrollArea */}
        {/* Nested Quiz Dialog */}
        {quizDialogOpen && (
          <QuizQuestionDialog
            key={
              editingQuizQuestion?.tempId ||
              editingQuizQuestion?.id ||
              'new-quiz-q'
            }
            open={quizDialogOpen}
            onClose={() => setQuizDialogOpen(false)}
            onSave={saveQuizQuestion}
            initialData={editingQuizQuestion}
            isEditing={!!editingQuizQuestion}
          />
        )}
      </DialogContent>
    </Dialog>

);
};

export default LessonDialog;

1
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ:NGUYEN VAN A
Ngày phát hành:07/15
Mật khẩu OTP:123456
Thành công
