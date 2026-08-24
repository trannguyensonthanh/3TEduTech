# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.validation.js'
s = read(p)

# 1. Them introVideoUrl + rang buoc gia khuyen mai
s = sub(s, """    // Giá do giảng viên tự nhập.
    originalPrice: Joi.number().min(0).default(0),
    discountedPrice: Joi.number().min(0).allow(null),
""",
"""    /* [THÊM 20/08/2026] Video giới thiệu — dán đường dẫn YouTube.
       Chỉ nhận http/https để không ai gắn được `javascript:` hay `data:` vào
       một trường sẽ được render thành liên kết trên trang khóa học. */
    introVideoUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(1000)
      .allow('', null)
      .messages({
        'string.uri': 'Đường dẫn video giới thiệu phải bắt đầu bằng http hoặc https.',
      }),

    // Giá do giảng viên tự nhập.
    originalPrice: Joi.number().min(0).default(0),
    discountedPrice: Joi.number().min(0).allow(null),
""", 'introVideoUrl')

# 2. Rang buoc discountedPrice <= originalPrice (luong thu cong da co, luong ZIP thi chua)
s = sub(s, """      .max(200),
  }),
};

/* [Giai đoạn D] Sinh câu hỏi trắc nghiệm. */""",
"""      .max(200),
  })
    /* [THÊM 20/08/2026] Giá khuyến mãi không được cao hơn giá gốc.
       Luồng sửa khóa học thủ công đã có ràng buộc này ở cả Joi lẫn zod; luồng
       nhập ZIP thì chưa, nên một khóa học nhập từ ZIP có thể mang giá khuyến
       mãi cao hơn giá gốc và hiển thị "giảm giá âm" trên thẻ khóa học. */
    .custom((value, helpers) => {
      if (
        value.discountedPrice !== null &&
        value.discountedPrice !== undefined &&
        value.discountedPrice > (value.originalPrice ?? 0)
      ) {
        return helpers.message(
          'Giá khuyến mãi không được lớn hơn giá gốc.'
        );
      }
      return value;
    }),
};

/* [Giai đoạn D] Sinh câu hỏi trắc nghiệm. */""", 'rang buoc gia')

# 3. Them do kho vao generateQuiz
s = sub(s, """const generateQuiz = {
  params: Joi.object().keys({ jobId }),
  body: Joi.object().keys({
    // Trần 5 khớp với giới hạn phía AI Service; đặt cao hơn chỉ tốn token mà
    // chất lượng câu hỏi giảm dần rõ rệt.
    questionsPerLesson: Joi.number().integer().min(1).max(5).default(3),
  }),
};""",
"""const generateQuiz = {
  params: Joi.object().keys({ jobId }),
  body: Joi.object().keys({
    // Trần 5 khớp với giới hạn phía AI Service; đặt cao hơn chỉ tốn token mà
    // chất lượng câu hỏi giảm dần rõ rệt.
    questionsPerLesson: Joi.number().integer().min(1).max(5).default(3),

    /* [THÊM 20/08/2026] Độ khó.
       Trước đây giao diện ghi cứng 3 câu mỗi bài và không có khái niệm độ khó,
       nên giảng viên không điều khiển được gì ngoài việc bấm "soạn lại".

       'mixed' là mặc định vì một đề chỉ toàn câu dễ không phân loại được học
       viên, còn một đề chỉ toàn câu khó thì tỉ lệ đậu sụp xuống và học viên bỏ
       ngang — trộn ba mức là lựa chọn an toàn khi giảng viên chưa có ý kiến. */
    difficulty: Joi.string()
      .valid('easy', 'medium', 'hard', 'mixed')
      .default('mixed'),
  }),
};

/* ============================================================================
   [THÊM 20/08/2026] LƯU CÂU HỎI GIẢNG VIÊN ĐÃ SỬA

   Trước đây câu hỏi do AI soạn là CHỈ ĐỌC ở màn hình duyệt: sai một chữ trong
   đáp án cũng phải bấm "soạn đề lại" toàn bộ (đốt thêm một lượt gọi mô hình và
   mất luôn những câu đang tốt), hoặc bỏ hết rồi vào trang Sửa khóa học gõ lại
   từ đầu.

   Tuyến này lưu bản đã sửa vào chính bản nháp trên Redis, nên `acceptProposal`
   vẫn đọc câu hỏi từ phía MÁY CHỦ như trước — không hề nới lỏng nguyên tắc
   "nội dung câu hỏi không nhận từ payload chấp nhận". Khác biệt là bản nháp
   trên máy chủ nay phản ánh đúng thứ giảng viên nhìn thấy.

   Ba bất biến dưới đây được kiểm ở ĐÂY, và được kiểm lại lần nữa trong
   quizzes.service khi giảng viên sửa sau lúc khóa học đã tạo:
     • tối thiểu 2 lựa chọn
     • correctIndex nằm trong phạm vi mảng lựa chọn
     • không có lựa chọn rỗng
============================================================================ */
const saveQuiz = {
  params: Joi.object().keys({ jobId }),
  body: Joi.object().keys({
    lessons: Joi.array()
      .items(
        Joi.object().keys({
          // Khóa đối chiếu với bản nháp phía máy chủ — không dùng để đọc tệp.
          sourcePath: Joi.string().max(1000).required(),
          questions: Joi.array()
            .items(
              Joi.object().keys({
                question: Joi.string().trim().min(1).max(1000).required(),
                options: Joi.array()
                  .items(Joi.string().trim().min(1).max(500).required())
                  .min(2)
                  .max(6)
                  .required()
                  .messages({
                    'array.min': 'Mỗi câu hỏi phải có ít nhất 2 lựa chọn.',
                    'array.max': 'Mỗi câu hỏi chỉ được tối đa 6 lựa chọn.',
                  }),
                correctIndex: Joi.number().integer().min(0).required(),
                explanation: Joi.string().max(1000).allow('', null),
              })
                /* `correctIndex` phải trỏ vào một lựa chọn CÓ THẬT. Kiểm ở đây
                   thay vì lúc ghi CSDL: nếu để lọt, đề sẽ có câu không có đáp
                   án đúng nào và học viên không bao giờ làm đúng được câu đó. */
                .custom((value, helpers) => {
                  if (value.correctIndex >= value.options.length) {
                    return helpers.message(
                      'Đáp án đúng phải là một trong các lựa chọn của câu hỏi.'
                    );
                  }
                  return value;
                })
            )
            .max(50)
            .required(),
        })
      )
      .max(200)
      .required(),
  }),
};""", 'generateQuiz + saveQuiz')

s = sub(s, """module.exports = {
  jobIdParam,
  acceptImport,
  generateQuiz,""",
"""module.exports = {
  jobIdParam,
  acceptImport,
  generateQuiz,
  saveQuiz,""", 'exports')
write(p, s)
print('imports.validation.js OK')
