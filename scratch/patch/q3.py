# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.service.js'
s = read(p)

OLD = """        lessonOrder += 1;
        createdLessons += 1;
      }
    }

    if (createdSections === 0) {"""

NEW = """        lessonOrder += 1;
        createdLessons += 1;
      }

      /* ==================================================================
         [THÊM 20/08/2026] BÀI KIỂM TRA CUỐI CHƯƠNG

         Câu hỏi do AI soạn được gom theo CHƯƠNG và đặt vào MỘT bài học riêng
         `LessonType = 'QUIZ'` xếp cuối chương.

         VÌ SAO PHẢI LÀ MỘT BÀI HỌC RIÊNG
         Trong mô hình dữ liệu của hệ thống, "quiz" không phải một thực thể
         riêng — nó CHÍNH LÀ bài học có LessonType = 'QUIZ', và
         `QuizQuestions.LessonID` trỏ thẳng vào bài học đó. Mọi đường đọc (API
         giảng viên, API làm bài, bộ render nội dung, hộp thoại sửa bài) đều
         kiểm tra `LessonType === 'QUIZ'` trước khi làm gì. Gắn câu hỏi vào một
         bài TEXT/VIDEO thì chúng lọt vào CSDL nhưng biến mất khỏi giao diện —
         đúng lỗi mà bản trước mắc phải.

         VÌ SAO GOM THEO CHƯƠNG chứ không tách theo từng bài
         AI sinh câu hỏi theo từng bài, nên tách theo bài là cách dịch một-một
         dễ nhất. Nhưng nó làm số mục trong chương trình học tăng gần gấp đôi:
         một chương 5 bài thành 10 mục, xen kẽ học—kiểm tra—học—kiểm tra. Gom
         theo chương giữ nhịp học tự nhiên và khớp với cách các nền tảng học
         trực tuyến lớn tổ chức. Thứ tự câu hỏi vẫn theo thứ tự bài, nên học
         viên vẫn thấy đề đi đúng mạch nội dung.

         Bài kiểm tra được tạo TRONG CÙNG transaction với các bài học của
         chương: tách ra làm sau commit thì một lần lỗi sẽ để lại chương có
         bài mà không có đề, một trạng thái nửa vời rất khó lần ra sau này.
         ================================================================== */
      if (includeQuiz) {
        const cauHoiCuaChuong = selectedLessons.flatMap((lesson) =>
          Array.isArray(lesson.quizQuestions) ? lesson.quizQuestions : []
        );

        if (cauHoiCuaChuong.length > 0) {
          const tenChuong = truncate(
            edit?.sectionName || section.sectionName || 'Chương',
            180
          );
          const baiKiemTra = await lessonRepository.createLesson(
            {
              SectionID: newSection.SectionID,
              LessonName: truncate(`Bài kiểm tra — ${tenChuong}`, 255),
              Description:
                `Bài kiểm tra tổng hợp ${cauHoiCuaChuong.length} câu hỏi ` +
                `cho toàn bộ nội dung chương này. Câu hỏi do AI soạn từ tài ` +
                `liệu bạn đã tải lên; giảng viên có thể sửa lại trong trang ` +
                `Sửa khóa học.`,
              // Xếp cuối chương: `lessonOrder` đã được tăng sau bài cuối cùng.
              LessonOrder: lessonOrder,
              LessonType: LessonType.QUIZ,
              /* Bài QUIZ không mang nội dung video hay văn bản. Ghi giá trị
                 khác null ở đây sẽ khiến lessons.service xóa đi khi giảng viên
                 mở ra sửa, và làm bản ghi trông như dữ liệu hỏng. */
              VideoSourceType: null,
              ExternalVideoID: null,
              VideoDurationSeconds: null,
              TextContent: null,
              IsFreePreview: 0,
            },
            transaction
          );
          lessonOrder += 1;
          createdLessons += 1;

          let questionOrder = 0;
          for (const q of cauHoiCuaChuong) {
            const created = await quizRepository.createQuestion(
              {
                LessonID: baiKiemTra.LessonID,
                QuestionText: truncate(q.question, 1000),
                Explanation: q.explanation ? truncate(q.explanation, 1000) : null,
                QuestionOrder: questionOrder,
              },
              transaction
            );

            await quizRepository.createOptionsForQuestion(
              created.QuestionID,
              q.options.map((text, index) => ({
                OptionText: truncate(text, 500),
                /* Đúng MỘT đáp án đúng — quy tắc này được kiểm ba lần trước
                   khi tới đây: ở AI Service, ở generateQuiz, và ở tuyến lưu
                   câu hỏi giảng viên đã sửa. */
                IsCorrectAnswer: index === q.correctIndex ? 1 : 0,
                OptionOrder: index,
              })),
              transaction
            );

            questionOrder += 1;
            createdQuestions += 1;
          }

          createdQuizLessons += 1;
        }
      }
    }

    if (createdSections === 0) {"""
s = sub(s, OLD, NEW, 'vong lap chuong')
write(p, s)
print('OK')
