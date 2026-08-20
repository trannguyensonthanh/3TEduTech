# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

# ---------- validation ----------
p = '/3t-edu-tech-backend/src/api/ai/chat.validation.js'
s = read(p)
s = sub(s, """const getOrCreateSession = {
  body: Joi.object().keys({
    scope: scope.required(),
    courseId: Joi.number().integer().allow(null),
    lessonId: Joi.number().integer().allow(null),
  }),
};""",
"""const getOrCreateSession = {
  body: Joi.object().keys({
    scope: scope.required(),
    courseId: Joi.number().integer().allow(null),
    lessonId: Joi.number().integer().allow(null),
    /* [THÊM 20/08/2026] Bắt buộc tạo phiên MỚI thay vì dùng lại phiên đang mở.
       Phục vụ nút "Hội thoại mới" ở trang AI Master — trước đây nút đó chỉ tạo
       một mục trong localStorage còn phía máy chủ vẫn là phiên cũ, nên mô hình
       tiếp tục nhận lịch sử của cuộc trò chuyện trước trong một khung chat
       trông như hoàn toàn trống. */
    forceNew: Joi.boolean().optional(),
  }),
};""", 'getOrCreateSession validation')
write(p, s)
print('chat.validation.js OK')

# ---------- service ----------
p = '/3t-edu-tech-backend/src/api/ai/chat.service.js'
s = read(p)
s = sub(s, """const getOrCreateSession = async (user, { scope, courseId, lessonId }) => {""",
        """const getOrCreateSession = async (
  user,
  { scope, courseId, lessonId, forceNew = false }
) => {""", 'chu ky getOrCreateSession')
s = sub(s, """  const existing = await chatRepository.findActiveSession(
    user.id,
    scope,
    normalizedCourseId
  );
  if (existing) return toCamelCaseObject(existing);""",
"""  /* [SỬA 20/08/2026] `forceNew` bỏ qua bước tìm phiên đang mở.
     Chỉ áp dụng cho MASTER: với COURSE/LESSON, mỗi khóa học đúng một phiên là
     hành vi mong muốn (trợ lý trong khóa học không có khái niệm "cuộc trò
     chuyện thứ hai"), còn cho tạo tùy ý thì mỗi lần mở lại hộp thoại là một
     phiên rỗng mới và lịch sử vỡ vụn. */
  if (!(forceNew && scope === 'MASTER')) {
    const existing = await chatRepository.findActiveSession(
      user.id,
      scope,
      normalizedCourseId
    );
    if (existing) return toCamelCaseObject(existing);
  }""", 'khoi findActiveSession')
write(p, s)
print('chat.service.js OK')

# ---------- controller ----------
p = '/3t-edu-tech-backend/src/api/ai/chat.controller.js'
s = read(p)
s = sub(s, """  const session = await chatService.getOrCreateSession(req.user, {
    scope: req.body.scope,
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
  });""",
"""  const session = await chatService.getOrCreateSession(req.user, {
    scope: req.body.scope,
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
    forceNew: req.body.forceNew === true,
  });""", 'controller getOrCreateSession')
write(p, s)
print('chat.controller.js OK')
