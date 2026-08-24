// File: src/api/imports/imports.validation.js
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]

const Joi = require('joi');

/** jobId sinh bằng crypto.randomBytes(8) → đúng 16 ký tự hex. */
const jobId = Joi.string()
  .pattern(/^[0-9a-f]{16}$/)
  .required()
  .messages({
    'string.pattern.base': 'Mã phiên nhập không hợp lệ.',
  });

const jobIdParam = { params: Joi.object().keys({ jobId }) };

/* ============================================================================
   ★ SCHEMA CHẤP NHẬN — CHỈ NHẬN NHỮNG TRƯỜNG ĐƯỢC PHÉP SỬA

   Joi mặc định TỪ CHỐI khóa lạ, và ở đây đó là tính năng chứ không phải phiền
   toái. Client chỉ được sửa: tên, mô tả, chọn/bỏ chọn.

   Cố ý KHÔNG có trong danh sách:
     • sourcePath / absolutePath  → client trỏ bài học tới tệp bất kỳ trên máy chủ
     • lessonType                 → biến tài liệu thành video và ngược lại
     • statusId                   → tự xuất bản khóa học, bỏ qua bước duyệt
     • instructorId               → gán khóa học cho người khác
   Tất cả những trường đó do máy chủ tự quyết định (imports.service).
============================================================================ */
const acceptImport = {
  params: Joi.object().keys({ jobId }),
  body: Joi.object().keys({
    courseName: Joi.string().trim().min(3).max(500).required(),
    // Khóa ngoại — service còn đối chiếu lại với CSDL trước khi INSERT.
    categoryId: Joi.number().integer().required(),
    levelId: Joi.number().integer().required(),

    shortDescription: Joi.string().trim().max(500).allow('', null),
    fullDescription: Joi.string().max(50000).allow('', null),
    requirements: Joi.string().max(20000).allow('', null),
    learningOutcomes: Joi.string().max(20000).allow('', null),
    language: Joi.string().max(10).default('vi'),

    /* [Giai đoạn D] Có tạo kèm câu hỏi trắc nghiệm do AI soạn không.
       Mặc định FALSE: câu hỏi phải được giảng viên chọn một cách chủ động.
       Nội dung câu hỏi KHÔNG nhận từ client — máy chủ đọc từ bản nháp của
       chính nó (job.proposed), nếu không thì bất kỳ ai cũng tự soạn được đề
       và đáp án tùy ý cho khóa học của mình. */
    includeQuiz: Joi.boolean().default(false),

    /* [THÊM 20/08/2026] Có dùng ảnh tìm được trong tệp ZIP làm ảnh bìa không.
       Mặc định BẬT — ngược với includeQuiz. Lý do khác nhau: câu hỏi do AI bịa
       ra thì phải được duyệt một cách chủ động, còn ảnh bìa là tệp có thật do
       chính giảng viên đóng gói vào ZIP, nên dùng nó là mặc định hợp lý.
       Đường dẫn ảnh KHÔNG nhận từ client — máy chủ đọc từ bản nháp của nó. */
    useCoverImage: Joi.boolean().default(true),

    /* [THÊM 20/08/2026] Video giới thiệu — dán đường dẫn YouTube.
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

    sections: Joi.array()
      .items(
        Joi.object().keys({
          sourceDir: Joi.string().allow('').required(),
          sectionName: Joi.string().trim().max(255),
          description: Joi.string().max(10000).allow('', null),
          selected: Joi.boolean(),
          lessons: Joi.array().items(
            Joi.object().keys({
              // Dùng làm KHÓA ĐỐI CHIẾU với bản nháp phía máy chủ, không phải
              // để đọc tệp — service tra ngược lại trong `job.proposed`.
              sourcePath: Joi.string().max(1000).required(),
              lessonName: Joi.string().trim().max(255),
              description: Joi.string().max(10000).allow('', null),
              selected: Joi.boolean(),
            })
          ),
        })
      )
      .max(200),
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

/* [Giai đoạn D] Sinh câu hỏi trắc nghiệm. */
const generateQuiz = {
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
};

/* [THÊM 20/08/2026] Xem trước tệp trong bản nháp.

   `path` ở đây là ĐƯỜNG DẪN TƯƠNG ĐỐI trong tệp ZIP, dùng làm khóa đối chiếu
   với bản nháp phía máy chủ — KHÔNG phải đường dẫn để mở tệp. Service tra
   ngược trong `job.proposed` để lấy đường dẫn tuyệt đối thật.

   Vẫn chặn `..` ngay tại đây dù service đã có kiểm tra chứa: một tham số chứa
   `..` không bao giờ là yêu cầu hợp lệ, nên từ chối sớm và ghi được vào log
   truy cập vẫn tốt hơn là để nó đi sâu thêm ba tầng rồi mới bị chặn. */
const previewFile = {
  params: Joi.object().keys({ jobId }),
  query: Joi.object().keys({
    path: Joi.string()
      .max(1000)
      .required()
      .custom((value, helpers) =>
        value.includes('..') ? helpers.message('Đường dẫn tệp không hợp lệ.') : value
      ),
  }),
};

module.exports = {
  jobIdParam,
  acceptImport,
  generateQuiz,
  saveQuiz,
  previewFile,
};
