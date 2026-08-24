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

s = sub(s, """router.get(
  '/:jobId/preview',
  authenticate,
  instructorOnly,
  validate(importValidation.previewFile),
  importController.previewFile
);""",
"""/* ==========================================================================
   Thẻ <video> KHÔNG gửi được header Authorization.

   Trình duyệt tự phát yêu cầu cho `<video src="...">` và cho từng lần tua theo
   Range; không có API nào chèn header vào những yêu cầu đó. Ba đường đi khả dĩ:

     (a) fetch toàn bộ tệp rồi tạo blob URL — không dùng được, video bài giảng
         hàng trăm MB phải tải xong mới xem được khung hình đầu tiên, và mất
         hoàn toàn khả năng tua.
     (b) URL ký sẵn có hạn dùng ngắn — sạch nhất, nhưng phải dựng thêm cơ chế
         ký và xác thực chữ ký cho đúng MỘT tính năng.
     (c) nhận token qua chuỗi truy vấn, CHỈ ở tuyến này.

   Chọn (c). Đánh đổi phải nói rõ: token đi vào chuỗi truy vấn sẽ nằm lại trong
   nhật ký truy cập của nginx và trong lịch sử trình duyệt. Giảm thiểu bằng:
   phạm vi đúng một tuyến, chỉ đọc, chỉ bản nháp của chính người gọi, và phản
   hồi đặt `Cache-Control: private, no-store`. Nếu sau này cần chặt hơn, đường
   nâng cấp là (b) — thay đúng middleware này, không đụng tới nơi nào khác.
   ========================================================================== */
const promoteQueryToken = (req, res, next) => {
  if (!req.header('Authorization') && req.query.access_token) {
    req.headers.authorization = `Bearer ${req.query.access_token}`;
  }
  /* Gỡ khỏi query TRƯỚC khi tới tầng kiểm tra: schema Joi của tuyến này chỉ
     khai `path`, và Joi từ chối khóa lạ — để nguyên thì mọi yêu cầu xem trước
     đều trả 400. */
  delete req.query.access_token;
  next();
};

router.get(
  '/:jobId/preview',
  promoteQueryToken,
  authenticate,
  instructorOnly,
  validate(importValidation.previewFile),
  importController.previewFile
);""", 'preview route')
write(p, s)
print('OK')
