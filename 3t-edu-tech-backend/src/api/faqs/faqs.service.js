/* ============================================================================
 * [SỬA 18/08/2026] GỌI AI SERVICE PHẢI ĐI QUA `aiClient`
 *
 * Bản cũ dùng `axios.post(url, ...)` trần, KHÔNG kèm header
 * `x-internal-api-key`. Từ Level 3, AI Service từ chối mọi request thiếu khóa
 * đó bằng 401 — nghĩa là toàn bộ việc đồng bộ FAQ sang RAG đã chết ngay khi
 * bạn đặt INTERNAL_API_KEY.
 *
 * Và nó chết ÂM THẦM: hai hàm dưới đều bắt lỗi rồi chỉ ghi log, nên giao diện
 * vẫn báo "lưu thành công" trong khi chatbot không hề biết tới câu hỏi mới.
 *
 * `aiClient` là điểm DUY NHẤT trong backend được phép gọi AI Service, và nó tự
 * gắn khóa. Xem ghi chú đầu tệp src/services/aiClient.js.
 * ========================================================================== */

const httpStatus = require('http-status').status;
const faqRepository = require('./faqs.repository');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
/* ============================================================================
 * [SỬA 18/08/2026] `toCamelCaseArray` KHÔNG TỒN TẠI — GET /v1/faqs LUÔN TRẢ 500
 *
 * ★ Đây là lỗi CÓ SẴN TỪ TRƯỚC, chỉ vừa mới lộ ra.
 *
 * `src/utils/caseConverter.js` chỉ export ba hàm: toCamelCaseObject,
 * toPascalCaseObject, toSnakeCaseObject. KHÔNG hề có toCamelCaseArray. Phép gán
 * hủy cấu trúc ở dòng này vì thế cho ra `undefined`, và lời gọi bên dưới đổ
 * ngay: "TypeError: toCamelCaseArray is not a function".
 *
 * ★ VÌ SAO MÃI TỚI GIỜ MỚI THẤY — MỘT LỖI CHE MẤT MỘT LỖI
 *
 * Trước đây `faqRepository.getAllFAQs()` chạy `SELECT * FROM FAQs`, mà bảng đó
 * không tồn tại trong bất kỳ migration nào. Nó ném "Invalid object name 'FAQs'"
 * và luồng thực thi KHÔNG BAO GIỜ chạm tới dòng gọi hàm bên dưới. Cả hai lỗi
 * cùng cho ra HTTP 500, nên sửa xong lỗi thứ nhất thì lỗi thứ hai bước ra thế
 * chỗ — với đúng mã trạng thái cũ. Nhìn từ ngoài trông hệt như "đã sửa mà không
 * ăn thua".
 *
 * ★ KHÔNG cần viết hàm mới: `toCamelCaseObject` XỬ LÝ ĐƯỢC CẢ MẢNG.
 *   `convertObjectKeys` bên trong nó có nhánh `Array.isArray(data)` và tự đệ quy
 *   xuống từng phần tử. Đã kiểm chứng bằng dữ liệu thật của faqs.data.js.
 *
 * ⚠️ Tên khóa sau khi chuyển: `FaqID` → `faqId` (chữ `d` THƯỜNG), không phải
 *    `faqID`. Giao diện đọc `faq.faqID` sẽ nhận `undefined` và hiển thị ô trống.
 * ========================================================================== */
const { toCamelCaseObject } = require('../../utils/caseConverter');
const aiClient = require('../../services/aiClient');

const syncFaqToAi = async (faq) => {
  if (!faq.IsActive) return; // Only sync active FAQs
  
  const text = `Q: ${faq.Question}\nA: ${faq.Answer}`;
  const sourceName = `FAQ-${faq.FaqID}`;
  
  try {
    await aiClient.postIngest('/api/ingest/text', {
      text,
      source_name: sourceName,
      collection: 'master_knowledge',
      metadata: { type: 'faq', FaqID: faq.FaqID },
    });
    logger.info(`Đã đồng bộ FAQ-${faq.FaqID} sang AI Service.`);
  } catch (error) {
    /* Không ném lỗi ra ngoài: FAQ đã lưu vào CSDL thành công rồi, hỏng bước
       đồng bộ RAG không được làm hỏng cả thao tác lưu. Nhưng PHẢI ghi log đủ
       chi tiết — 401 ở đây nghĩa là khóa nội bộ lệch nhau. */
    logger.error(
      `Đồng bộ FAQ-${faq.FaqID} sang AI Service thất bại ` +
        `(HTTP ${error.response?.status || '?'}): ${error.message}`
    );
  }
};

const removeFaqFromAi = async (faqId) => {
  const sourceName = `FAQ-${faqId}`;
  try {
    await aiClient.deleteIngest(
      `/api/ingest/collection/master_knowledge/source/${encodeURIComponent(sourceName)}`
    );
    logger.info(`Đã gỡ FAQ-${faqId} khỏi AI Service.`);
  } catch (error) {
    logger.error(
      `Gỡ FAQ-${faqId} khỏi AI Service thất bại ` +
        `(HTTP ${error.response?.status || '?'}): ${error.message}`
    );
  }
};

const getAllFAQs = async () => {
  const faqs = await faqRepository.getAllFAQs();
  return toCamelCaseObject(faqs);
};

const getFAQById = async (id) => {
  const faq = await faqRepository.getFAQById(id);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ không tồn tại.');
  }
  return toCamelCaseObject(faq);
};

const createFAQ = async (faqData) => {
  const newFAQ = await faqRepository.createFAQ(faqData);
  await syncFaqToAi(newFAQ);
  return toCamelCaseObject(newFAQ);
};

const updateFAQ = async (id, faqData) => {
  const existingFAQ = await faqRepository.getFAQById(id);
  if (!existingFAQ) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ không tồn tại.');
  }

  const updatedFAQ = await faqRepository.updateFAQ(id, faqData);

  // Always remove the old one, and then sync if it's active
  await removeFaqFromAi(id);
  if (updatedFAQ.IsActive) {
    await syncFaqToAi(updatedFAQ);
  }

  return toCamelCaseObject(updatedFAQ);
};

const deleteFAQ = async (id) => {
  const existingFAQ = await faqRepository.getFAQById(id);
  if (!existingFAQ) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ không tồn tại.');
  }

  await faqRepository.deleteFAQ(id);
  await removeFaqFromAi(id);
};

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};
