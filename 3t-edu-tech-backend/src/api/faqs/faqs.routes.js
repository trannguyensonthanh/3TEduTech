/* ============================================================================
 * faqs.routes.js
 *
 * [SỬA 18/08/2026] HAI LỖI PHÂN QUYỀN LÀM MỌI ENDPOINT QUẢN TRỊ TRẢ 403
 *
 * Bản cũ viết:  authorize(Roles.ADMIN, Roles.SYSTEM_ADMIN)
 *
 * Sai hai chỗ cùng lúc, và cộng lại thì KHÔNG AI vào được:
 *
 *   1. `authorize(requiredRoles)` nhận đúng MỘT tham số là MẢNG. Ở đây lại
 *      truyền hai tham số rời. Tham số thứ hai bị bỏ qua, còn tham số thứ nhất
 *      là chuỗi 'AD' — mà middleware kiểm tra `Array.isArray(requiredRoles)`,
 *      chuỗi thì không phải mảng nên điều kiện luôn sai → luôn 403.
 *
 *   2. `Roles.SYSTEM_ADMIN` KHÔNG TỒN TẠI trong core/enums/Roles.js. Enum chỉ
 *      có STUDENT / INSTRUCTOR / ADMIN / SUPERADMIN. Đọc ra `undefined`.
 *
 * Hậu quả: tạo, sửa, xóa FAQ và tải PDF lên đều trả 403 kể cả khi đăng nhập
 * bằng tài khoản admin thật. Lỗi không lộ ra sớm vì bảng FAQs cũng chưa tồn
 * tại, nên endpoint chết vì lý do khác trước khi kịp chạm tới lớp phân quyền.
 * ========================================================================== */

const express = require('express');
const faqController = require('./faqs.controller');
const validate = require('../../middlewares/validation.middleware');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');
const faqValidation = require('./faqs.validation');
const { uploadAttachment, handleMulterError } = require('../../middlewares/upload.middleware');
const { cache } = require('../../middlewares/cache.middleware');

const router = express.Router();

/* ============================================================================
 * TÀI LIỆU CHÍNH SÁCH  [THÊM 18/08/2026]
 *
 * Thay cho `/upload-pdf` cũ — endpoint đó chỉ trả text về rồi thôi: không lưu
 * tệp gốc, không nạp vào ChromaDB, và gọi một thư viện (`pdf-parse`) chưa hề
 * có trong package.json (xem ghi chú trong faqs.controller.js).
 *
 * ⚠️ KHỐI NÀY PHẢI ĐỨNG TRƯỚC `router.route('/:id')` BÊN DƯỚI.
 *
 * Express so khớp theo THỨ TỰ khai báo. Nếu `/:id` đứng trước, đường dẫn
 * `/v1/faqs/documents` sẽ khớp vào nó với id = "documents", rồi
 * `validate(faqValidation.getFAQ)` từ chối vì "documents" không phải số —
 * quản trị viên nhận 400 "id phải là số" khi mở trang danh sách tài liệu, một
 * thông báo chẳng liên quan gì tới thứ họ vừa bấm.
 *
 * ★ TOÀN BỘ đều yêu cầu quyền quản trị, kể cả GET.
 *   Nội dung chính sách tới tay người dùng cuối QUA CHATBOT (đã nạp vào RAG),
 *   không qua các endpoint này. Ở đây là màn hình quản trị. Mở GET cho công
 *   khai sẽ lộ đường dẫn Cloudinary của tệp gốc — mà chủ trương đã thống nhất
 *   là chỉ cho XEM trong trang quản lý, không cho người dùng tải về.
 * ========================================================================== */

router
  .route('/documents')
  .get(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    faqController.listDocuments
  )
  .post(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    uploadAttachment.single('file'),
    handleMulterError,
    faqController.uploadDocument
  );

router
  .route('/documents/:docId/text')
  .get(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    faqController.getDocumentText
  );

router
  .route('/documents/:docId')
  .delete(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    faqController.deleteDocument
  );

router
  .route('/')
  .get(cache(21600), faqController.getAllFAQs)
  .post(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    validate(faqValidation.createFAQ),
    faqController.createFAQ
  );

router
  .route('/:id')
  .get(validate(faqValidation.getFAQ), faqController.getFAQById)
  .put(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    validate(faqValidation.updateFAQ),
    faqController.updateFAQ
  )
  .delete(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    validate(faqValidation.deleteFAQ),
    faqController.deleteFAQ
  );

module.exports = router;
