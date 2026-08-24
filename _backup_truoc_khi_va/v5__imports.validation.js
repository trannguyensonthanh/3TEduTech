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
  }),
};

/* [Giai đoạn D] Sinh câu hỏi trắc nghiệm. */
const generateQuiz = {
  params: Joi.object().keys({ jobId }),
  body: Joi.object().keys({
    // Trần 5 khớp với giới hạn phía AI Service; đặt cao hơn chỉ tốn token mà
    // chất lượng câu hỏi giảm dần rõ rệt.
    questionsPerLesson: Joi.number().integer().min(1).max(5).default(3),
  }),
};

module.exports = {
  jobIdParam,
  acceptImport,
  generateQuiz,
};
