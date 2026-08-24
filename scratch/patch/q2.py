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

OLD = """        /* [GIAI ĐOẠN D] Tạo câu hỏi trắc nghiệm ngay trong CÙNG transaction.
           Nếu tách ra làm sau commit, một lần lỗi sẽ để lại khóa học có bài
           thì có đề, bài thì không — trạng thái nửa vời rất khó lần ra sau này.
           Số lượt ghi tuy nhiều nhưng mỗi lệnh đều nhỏ. */
        if (
          includeQuiz &&
          Array.isArray(lesson.quizQuestions) &&
          lesson.quizQuestions.length > 0
        ) {
          let questionOrder = 0;
          for (const q of lesson.quizQuestions) {
            const created = await quizRepository.createQuestion(
              {
                LessonID: newLesson.LessonID,
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
                // Đúng MỘT đáp án đúng. `correctIndex` đã được kiểm tra nằm
                // trong phạm vi ở cả AI Service lẫn generateQuiz.
                IsCorrectAnswer: index === q.correctIndex ? 1 : 0,
                OptionOrder: index,
              })),
              transaction
            );

            questionOrder += 1;
            createdQuestions += 1;
          }
        }
"""

NEW = """        /* [GỠ 20/08/2026] Ở ĐÂY TRƯỚC ĐÂY LÀ MỘT LỖI NGHIÊM TRỌNG.

           Bản cũ gắn câu hỏi trắc nghiệm vào CHÍNH bài học TEXT/VIDEO vừa tạo
           (`LessonID: newLesson.LessonID`). Cơ sở dữ liệu chấp nhận, vì
           `FK_QuizQuestions_LessonID` chỉ đòi LessonID tồn tại chứ không ràng
           buộc LessonType. Nhưng MỌI đường đọc trong hệ thống đều đòi
           `LessonType = 'QUIZ'`:

             • quizzes.service.getQuestionsForInstructor → 400
             • quizzes.service.startQuizAttempt          → 400
             • quizzes.service.createQuestionWithOptions → 400
             • LessonContentRenderer chỉ render QuizPlayer khi lessonType QUIZ
             • LessonDialog chỉ hiện LessonQuizManager khi lessonType QUIZ

           Kết quả: câu hỏi NẰM TRONG cơ sở dữ liệu nhưng không ai nhìn thấy —
           học viên không làm được, giảng viên không xem cũng không sửa được —
           trong khi thông báo vẫn báo "đã tạo N câu hỏi". Và đường sửa tay
           duy nhất (đổi bài sang loại QUIZ) lại XÓA SẠCH `TextContent` đã trích
           từ ZIP (lessons.service.js), rồi khóa luôn không cho đổi ngược lại.

           Nay câu hỏi được GOM THEO CHƯƠNG và ghi vào một bài học QUIZ riêng
           đặt ở cuối chương — xem khối bên dưới vòng lặp bài học. */
"""
s = sub(s, OLD, NEW, 'khoi tao quiz cu')

# Chen khoi tao bai QUIZ cuoi chuong. Tim diem ket thuc vong lap bai hoc.
ANCHOR = """        /* Ghi nhận video cần tải lên Cloudinary SAU khi transaction commit."""
assert s.count(ANCHOR) == 1
# Tim vi tri ket thuc vong for lessons de chen sau no.
print('OK phan 1, tiep tuc thu cong')
write(p, s)
