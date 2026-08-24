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

s = sub(s, """  if (fullDescription) {
    proposal.courseDescription = fullDescription;
    proposal.courseDescriptionSource = 'ai';
  }
  proposal.courseShortDescription = shortDescription || null;""",
"""  if (fullDescription) {
    proposal.courseDescription = fullDescription;
    proposal.courseDescriptionSource = 'ai';
  }
  proposal.courseShortDescription = shortDescription || null;

  /* [THÊM 20/08/2026] Yêu cầu đầu vào và kết quả đạt được.

     Trước đây AI không sinh hai trường này, nên mọi khóa học nhập từ ZIP đều
     có cột Requirements và LearningOutcomes rỗng — trong khi "Bạn sẽ học được
     gì" là khối thuyết phục người mua mạnh nhất trên trang chi tiết khóa học.

     Chỉ ghi đè khi AI thật sự trả về nội dung: giảng viên có thể đã tự viết ở
     màn hình duyệt rồi mới bấm nhờ AI, và xóa mất công của họ vì AI trả chuỗi
     rỗng là kiểu mất dữ liệu khó chịu nhất. */
  const requirements =
    typeof data.requirements === 'string' ? data.requirements.trim() : '';
  const learningOutcomes =
    typeof data.learning_outcomes === 'string'
      ? data.learning_outcomes.trim()
      : '';

  if (requirements) {
    proposal.courseRequirements = requirements;
    proposal.courseRequirementsSource = 'ai';
  }
  if (learningOutcomes) {
    proposal.courseLearningOutcomes = learningOutcomes;
    proposal.courseLearningOutcomesSource = 'ai';
  }""", 'gan requirements/outcomes')

# Bo sung so lieu tra ve cho giao dien
s = sub(s, """  sectionCount = applyDescriptions(data.sections, sectionByKey, 'ai');
  lessonCount = applyDescriptions(data.lessons, lessonByKey, 'ai');""",
"""  sectionCount = applyDescriptions(data.sections, sectionByKey, 'ai');
  lessonCount = applyDescriptions(data.lessons, lessonByKey, 'ai');""", 'no-op')
write(p, s)
print('OK')
