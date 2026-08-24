# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.routes.js'
s = read(p)

OLD = """router.post(
  '/:jobId/accept',"""
NEW = """/* [THÊM 20/08/2026] Lưu câu hỏi giảng viên đã sửa.

   Dùng `enrichLimiter` chung với hai tuyến AI ở trên? KHÔNG. Tuyến này không
   gọi mô hình nào cả, chỉ ghi vào Redis — tính vào hạn mức AI sẽ khiến giảng
   viên sửa vài câu hỏi rồi hết lượt nhờ AI viết mô tả. */
router.put(
  '/:jobId/quiz',
  authenticate,
  instructorOnly,
  validate(importValidation.saveQuiz),
  importController.saveQuiz
);

/* [THÊM 20/08/2026] Xem trước tệp trong bản nháp (video, ảnh bìa).

   Khai báo TRƯỚC '/:jobId' để đoạn cố định '/preview' không bị mẫu tham số
   nuốt mất — cùng lý do với '/limits' và '/:jobId/proposal' ở trên.

   KHÔNG gắn giới hạn tần suất: thẻ <video> gửi hàng chục yêu cầu Range cho một
   lần tua, nên bất kỳ hạn mức hợp lý nào cũng sẽ chặn nhầm việc xem bình
   thường. Hàng rào ở đây là quyền sở hữu bản nháp, không phải số lượt gọi. */
router.get(
  '/:jobId/preview',
  authenticate,
  instructorOnly,
  validate(importValidation.jobIdParam),
  importController.previewFile
);

router.post(
  '/:jobId/accept',"""
s = sub(s, OLD, NEW, 'neo accept')
write(p, s)
print('imports.routes.js OK')
