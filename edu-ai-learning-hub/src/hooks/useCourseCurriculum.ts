import { useReducer, useCallback } from 'react';
import { toast } from '@/hooks/use-toast'; // Hoặc thư viện toast của bạn
import { Lesson } from '@/types/common.types';
import { Section } from '@/services/section.service';

// --- Types ---
export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ';

// export interface QuizOption {
//   tempId?: string | number; // FE temp ID
//   optionId?: number; // DB ID
//   optionText?: string;
//   isCorrectAnswer?: boolean;
//   optionOrder?: number; // Sẽ được tính lại
// }

// export interface QuizQuestion {
//   tempId?: string | number; // FE temp ID
//   questionId?: number; // DB ID
//   questionText: string;
//   explanation: string | null;
//   questionOrder?: number; // Sẽ được tính lại
//   options: QuizOption[];
//   lessonId?: number; // ID bài học (có thể là string từ backend)
// }

// export interface Attachment {
//   tempId?: string | number; // FE temp ID
//   attachmentId?: number; // DB ID
//   fileName: string;
//   fileUrl?: string; // Blob URL for preview
//   fileType?: string;
//   fileSize?: number;
//   file?: File; // The actual file object for upload
// }

// export interface Subtitle {
//   tempId?: string | number; // FE temp ID
//   subtitleId?: number; // DB ID
//   languageCode: string;
//   languageName: string;
//   subtitleUrl: string; // Can be Blob URL initially or final URL
//   isDefault: boolean;
//   // file?: File; // Nếu cần upload file .vtt
// }

// export interface Lesson {
//   tempId?: string | number; // FE temp ID
//   lessonId?: number | string; // ID từ BE (kiểu string như "4" hoặc số)
//   lessonName: string; // Tên bài học
//   description?: string | null; // Mô tả bài học
//   lessonOrder?: number; // Thứ tự bài học
//   lessonType: LessonType; // Loại bài học (VIDEO, TEXT, QUIZ)
//   isFreePreview: boolean; // Có phải bài học miễn phí hay không
//   // Video specific
//   videoSourceType?: 'CLOUDINARY' | 'YOUTUBE' | 'VIMEO' | null; // Loại nguồn video
//   externalVideoInput?: string | null; // ID video từ YT/Vimeo
//   lessonVideo?: File | null; // File video (nếu có upload)
//   videoDurationSeconds?: number | null; // Thời lượng video
//   thumbnailUrl?: string | null; // URL thumbnail của bài học
//   subtitles?: Subtitle[]; // Danh sách phụ đề
//   // Text specific
//   textContent?: string | null; // Nội dung dạng text
//   // Quiz specific
//   questions?: QuizQuestion[]; // Danh sách câu hỏi
//   // Common
//   attachments?: Attachment[]; // Danh sách file đính kèm
//   createdAt?: string; // Thời gian tạo
//   updatedAt?: string; // Thời gian cập nhật
//   externalVideoId?: string | null; // ID video từ YT/Vimeo (nếu có)
//   lessonVideoFile?: File | null; // File video (nếu có upload)
// }

// export interface Section {
//   sectionId?: number; // DB ID
//   tempId?: string | number; // FE temp ID
//   sectionName: string;
//   description?: string | null;
//   sectionOrder?: number; // Will be recalculated
//   lessons: Lesson[];
// }
interface CurriculumState {
  sections: Section[];
}

// --- Actions ---
type CurriculumAction =
  | {
      type: 'ADD_SECTION';
      payload: { sectionName: string; description?: string };
    }
  | {
      type: 'UPDATE_SECTION';
      payload: {
        sectionId: number | string;
        sectionName: string;
        description?: string | null;
      };
    }
  | { type: 'DELETE_SECTION'; payload: { sectionId: number | string } }
  | {
      type: 'ADD_LESSON';
      payload: { sectionId: number | string; lesson: Lesson };
    } // Lesson đã có tempId
  | {
      type: 'UPDATE_LESSON';
      payload: { sectionId: number | string; lesson: Lesson };
    }
  | {
      type: 'DELETE_LESSON';
      payload: { sectionId: number | string; lessonId: number | string };
    }
  | { type: 'REORDER_SECTIONS'; payload: { sections: Section[] } }
  | {
      type: 'REORDER_LESSONS';
      payload: { sectionId: number | string; lessons: Lesson[] };
    }
  | { type: 'SET_CURRICULUM'; payload: { sections: Section[] } };

// --- Helper to generate unique temp IDs ---
const generateTempId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// --- Reducer ---
const curriculumReducer = (
  state: CurriculumState,
  action: CurriculumAction
): CurriculumState => {
  switch (action.type) {
    case 'ADD_SECTION': {
      const newSection: Section = {
        tempId: generateTempId('section'),
        sectionName: action.payload.sectionName,
        description: action.payload.description,
        lessons: [],
        sectionOrder: state.sections.length,
      };
      return { ...state, sections: [...state.sections, newSection] };
    }
    case 'UPDATE_SECTION': {
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.sectionId === action.payload.sectionId ||
          s.tempId === action.payload.sectionId
            ? {
                ...s,
                sectionName: action.payload.sectionName,
                description: action.payload.description,
              }
            : s
        ),
      };
    }
    case 'DELETE_SECTION': {
      const updatedSections = state.sections
        .filter(
          (s) =>
            s.sectionId !== action.payload.sectionId &&
            s.tempId !== action.payload.sectionId
        )
        .map((s, index) => ({ ...s, sectionOrder: index })); // Reorder
      return { ...state, sections: updatedSections };
    }
    case 'ADD_LESSON': {
      const newLesson: Lesson = {
        ...action.payload.lesson,
        tempId: action.payload.lesson.tempId || generateTempId('lesson'), // Dùng tempId nếu có hoặc tạo mới
        lessonId: action.payload.lesson.lessonId, // Giữ id nếu có (trường hợp edit)
        lessonOrder:
          state.sections.find(
            (s) =>
              s.sectionId === action.payload.sectionId ||
              s.tempId === action.payload.sectionId
          )?.lessons.length || 0,
      };
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.sectionId === action.payload.sectionId ||
          s.tempId === action.payload.sectionId
            ? { ...s, lessons: [...s.lessons, newLesson] }
            : s
        ),
      };
    }
    case 'UPDATE_LESSON': {
      console.log(
        '[REDUCER] UPDATE_LESSON - Payload:',
        JSON.parse(JSON.stringify(action.payload))
      ); // Log bản sao sâu
      const targetSectionId = action.payload.sectionId;
      const updatedLessonData = action.payload.lesson;

      const newSections = state.sections.map((s) => {
        if (s.sectionId === targetSectionId || s.tempId === targetSectionId) {
          console.log(
            `[REDUCER] Found target section: ${s.tempId || s.sectionId}`
          );
          const newLessons = s.lessons.map((l) => {
            if (
              (l.lessonId && l.lessonId === updatedLessonData.lessonId) ||
              (l.tempId && l.tempId === updatedLessonData.tempId)
            ) {
              // Tạo đối tượng lesson mới hoàn toàn, không chỉ spread nông
              const lessonWithCorrectFile = {
                ...updatedLessonData, // Dữ liệu mới từ payload
                lessonVideoFile:
                  updatedLessonData.lessonVideoFile instanceof File
                    ? updatedLessonData.lessonVideoFile
                    : null, // QUAN TRỌNG: Đảm bảo đây là File hoặc null
                lessonOrder: l.lessonOrder, // Giữ lessonOrder cũ
              };
              return lessonWithCorrectFile;
            }
            // console.log(`[REDUCER]   Skipping lesson: ${l.tempId || l.id}`);
            return l;
          });
          return { ...s, lessons: newLessons };
        }
        return s;
      });
      console.log('[REDUCER] UPDATE_LESSON - New sections state:', newSections);
      return { ...state, sections: newSections };
    }
    case 'DELETE_LESSON': {
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (
            s.sectionId === action.payload.sectionId ||
            s.tempId === action.payload.sectionId
          ) {
            const updatedLessons = s.lessons
              .filter(
                (l) =>
                  l.lessonId !== action.payload.lessonId &&
                  l.tempId !== action.payload.lessonId
              )
              .map((l, index) => ({ ...l, lessonOrder: index })); // Reorder
            return { ...s, lessons: updatedLessons };
          }
          return s;
        }),
      };
    }
    case 'REORDER_SECTIONS': {
      const reorderedSections = action.payload.sections.map(
        (section, index) => ({
          ...section,
          sectionOrder: index,
        })
      );
      return { ...state, sections: reorderedSections };
    }
    case 'REORDER_LESSONS': {
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (
            s.sectionId === action.payload.sectionId ||
            s.tempId === action.payload.sectionId
          ) {
            const reorderedLessons = action.payload.lessons.map(
              (lesson, index) => ({
                ...lesson,
                lessonOrder: index,
              })
            );
            return { ...s, lessons: reorderedLessons };
          }
          return s;
        }),
      };
    }
    case 'SET_CURRICULUM':
      // eslint-disable-next-line no-case-declarations
      const initialSections = action.payload.sections.map((s) => ({
        ...s,
        tempId: s.tempId || s.sectionId || generateTempId('section'),
        lessons: (s.lessons || []).map((l) => ({
          ...l,
          tempId: l.tempId || l.lessonId || generateTempId('lesson'),
          questions: (l.questions || [])?.map((q) => ({
            ...q,
            tempId: q.tempId || q.questionId || generateTempId('question'),
            options: (q.options || []).map((o) => ({
              ...o,
              tempId: o.tempId || o.optionId || generateTempId('option'),
            })),
          })),
          attachments: (l.attachments || [])?.map((a) => ({
            ...a,
            tempId: a.tempId || a.attachmentId || generateTempId('attach'),
            // file object will be missing when loading from DB, handle this if needed
            file: a.file || null, // Set file to null when loading
          })),
          subtitles: (l.subtitles || [])?.map((sub) => ({
            ...sub,
            tempId: sub.tempId || sub.subtitleId || generateTempId('sub'),
          })),
        })),
      }));
      return { sections: initialSections };

    default:
      throw new Error(`Unhandled action type: ${action}`); // Hoặc return state
  }
};

// --- Custom Hook ---
export const useCourseCurriculum = (
  initialState: CurriculumState = { sections: [] }
) => {
  const [state, dispatch] = useReducer(curriculumReducer, initialState);

  // --- Callbacks ---
  const addSection = useCallback(
    (sectionName: string, description?: string) => {
      dispatch({ type: 'ADD_SECTION', payload: { sectionName, description } });
      toast({
        title: 'Section added',
        description: `Section "${sectionName}" created.`,
      });
    },
    []
  );

  const updateSection = useCallback(
    (
      sectionId: number | string,
      sectionName: string,
      description?: string | null
    ) => {
      dispatch({
        type: 'UPDATE_SECTION',
        payload: { sectionId, sectionName, description },
      });
      toast({
        title: 'Section updated',
        description: `Section "${sectionName}" updated.`,
      });
    },
    []
  );

  const deleteSectionCallback = useCallback((sectionId: number | string) => {
    // Renamed to avoid conflict
    // TODO: Add confirmation dialog logic here before dispatching
    dispatch({ type: 'DELETE_SECTION', payload: { sectionId } });
    toast({ title: 'Section deleted', variant: 'destructive' });
  }, []);

  const addLesson = useCallback(
    (
      sectionId: number | string,
      lesson: Omit<Lesson, 'id' | 'tempId' | 'lessonOrder'>
    ) => {
      // Add a temporary ID before dispatching
      const lessonWithTempId = { ...lesson, tempId: generateTempId('lesson') };
      dispatch({
        type: 'ADD_LESSON',
        payload: { sectionId, lesson: lessonWithTempId },
      });
      toast({
        title: 'Lesson added',
        description: `Lesson "${lesson.lessonName}" added.`,
      });
    },
    []
  );

  const updateLesson = useCallback(
    (sectionId: number | string, lesson: Lesson) => {
      // Ensure the lesson has a tempId or id before dispatching
      const lessonToUpdate = {
        ...lesson,
        tempId: lesson.tempId || lesson.lessonId,
      };
      console.log('Lesson to update', lessonToUpdate);
      if (!lessonToUpdate.tempId && !lessonToUpdate.lessonId) {
        console.error('Cannot update lesson without id or tempId', lesson);
        toast({
          title: 'Error',
          description: 'Cannot update lesson.',
          variant: 'destructive',
        });
        return;
      }
      dispatch({
        type: 'UPDATE_LESSON',
        payload: { sectionId, lesson: lessonToUpdate },
      });
      toast({
        title: 'Lesson updated',
        description: `Lesson "${lesson.lessonName}" updated.`,
      });
    },
    []
  );

  const deleteLessonCallback = useCallback(
    (sectionId: number | string, lessonId: number | string) => {
      // Renamed
      // TODO: Add confirmation dialog logic here
      dispatch({ type: 'DELETE_LESSON', payload: { sectionId, lessonId } });
      toast({ title: 'Lesson deleted', variant: 'destructive' });
    },
    []
  );

  const reorderSections = useCallback((sections: Section[]) => {
    dispatch({ type: 'REORDER_SECTIONS', payload: { sections } });
  }, []);

  const reorderLessons = useCallback(
    (sectionId: number | string, lessons: Lesson[]) => {
      dispatch({ type: 'REORDER_LESSONS', payload: { sectionId, lessons } });
    },
    []
  );

  const setCurriculum = useCallback((sections: Section[]) => {
    dispatch({ type: 'SET_CURRICULUM', payload: { sections } });
  }, []);

  return {
    sections: state.sections,
    addSection,
    updateSection,
    deleteSection: deleteSectionCallback, // Export renamed function
    addLesson,
    updateLesson,
    deleteLesson: deleteLessonCallback, // Export renamed function
    reorderSections,
    reorderLessons,
    setCurriculum,
  };
};
