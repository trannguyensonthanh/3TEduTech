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
s = sub(s, """  let createdQuestions = 0;""",
        """  let createdQuestions = 0;
  /* Số BÀI KIỂM TRA được tạo — mỗi chương có câu hỏi thì sinh đúng một bài.
     Đếm riêng với `createdLessons` để thông báo cho giảng viên nói rõ "3 chương,
     12 bài học, 3 bài kiểm tra" thay vì gộp thành 15 bài trông khó hiểu. */
  let createdQuizLessons = 0;""", 'khai bao bien dem')

s = sub(s, """      `(${createdSections} chương, ${createdLessons} bài, ${createdQuestions} câu hỏi) `""",
        """      `(${createdSections} chương, ${createdLessons} bài, ` +
      `${createdQuizLessons} bài kiểm tra, ${createdQuestions} câu hỏi) `""", 'log ket qua')

s = sub(s, """    totalQuestions: createdQuestions,""",
        """    totalQuestions: createdQuestions,
    totalQuizLessons: createdQuizLessons,""", 'gia tri tra ve')
write(p, s)
print('OK')
