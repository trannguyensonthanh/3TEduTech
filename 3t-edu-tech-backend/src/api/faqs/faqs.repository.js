/* ============================================================================
 * faqs.repository.js
 *
 * [SỬA 18/08/2026] BỎ HẲN BẢNG CSDL — ĐỌC TỪ HẰNG SỐ TRONG MÃ NGUỒN
 *
 * Bản cũ chạy `SELECT * FROM FAQs`, nhưng bảng đó KHÔNG TỒN TẠI trong bất kỳ
 * migration nào (V1..V8 tạo 44 bảng, không có FAQs). Nên mọi lần gọi đều trả
 * 500 "Invalid object name 'FAQs'" — và vì healthcheck của Docker trỏ đúng vào
 * endpoint này, log bị ngập stack trace mỗi 30 giây.
 *
 * Thay vì thêm bảng, nội dung FAQ nay nằm ở `faqs.data.js`. Lý do đầy đủ nằm
 * trong ghi chú đầu tệp đó; tóm tắt: nội dung đổi vài tháng một lần, và để
 * trong Git thì có sẵn lịch sử sửa đổi kèm tác giả — thứ mà một bảng CSDL trần
 * không có.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO GIỮ NGUYÊN TÊN HÀM VÀ HÌNH DẠNG DỮ LIỆU TRẢ VỀ
 *
 * `faqs.service.js` và `faqs.controller.js` không phải sửa một dòng nào. Ở đây
 * vẫn trả về đối tượng viết hoa kiểu CSDL (`FaqID`, `Question`...) vì tầng
 * service đang chạy `toCamelCaseObject()` lên kết quả. Đổi sang camelCase ở đây
 * sẽ khiến bộ chuyển đổi đó không nhận ra gì và giao diện nhận về khóa rỗng.
 * ========================================================================== */

const httpStatus = require('http-status').status;

const faqData = require('./faqs.data');
const ApiError = require('../../core/errors/ApiError');

/** Chuyển từ dạng camelCase trong faqs.data.js sang dạng mà service mong đợi. */
const toRow = (faq) => ({
  FaqID: faq.faqId,
  Question: faq.question,
  Answer: faq.answer,
  Category: faq.category,
  SortOrder: faq.sortOrder,
  IsActive: true,
  // Giữ hai cột thời gian để giao diện không phải xử lý trường hợp thiếu.
  // Không có ý nghĩa thật vì nội dung đến từ mã nguồn — thời điểm sửa thật sự
  // nằm trong lịch sử Git.
  CreatedAt: null,
  UpdatedAt: null,
});

const getAllFAQs = async () => faqData.getAll().map(toRow);

const getFAQById = async (id) => {
  const faq = faqData.getById(id);
  return faq ? toRow(faq) : undefined;
};

/* ---------------------------------------------------------------------------
 * Ba thao tác ghi: cố ý KHÔNG hỗ trợ.
 *
 * Ném lỗi rõ ràng thay vì im lặng trả về thành công. Nếu để chúng "làm như"
 * đã lưu, quản trị viên sẽ gõ nội dung mới, thấy báo thành công, rồi tải lại
 * trang và thấy nội dung cũ — không hiểu vì sao. Thà báo thẳng.
 * ------------------------------------------------------------------------- */
const NOT_EDITABLE =
  'Nội dung FAQ được quản lý trong mã nguồn (src/api/faqs/faqs.data.js) ' +
  'chứ không nằm trong cơ sở dữ liệu. Hãy sửa tệp đó rồi triển khai lại.';

const createFAQ = async () => {
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, NOT_EDITABLE);
};

const updateFAQ = async () => {
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, NOT_EDITABLE);
};

const deleteFAQ = async () => {
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, NOT_EDITABLE);
};

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};
