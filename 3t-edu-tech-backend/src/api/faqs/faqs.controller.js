const httpStatus = require('http-status').status;
const faqService = require('./faqs.service');
const faqDocumentService = require('./faqDocuments.service');
const { catchAsync } = require('../../utils/catchAsync');
const { clearCache } = require('../../middlewares/cache.middleware');

const getAllFAQs = catchAsync(async (req, res) => {
  const faqs = await faqService.getAllFAQs();
  res.status(httpStatus.OK).json({
    status: 'success',
    data: faqs,
  });
});

const getFAQById = catchAsync(async (req, res) => {
  const faq = await faqService.getFAQById(req.params.id);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: faq,
  });
});

const createFAQ = catchAsync(async (req, res) => {
  const faq = await faqService.createFAQ(req.body);
  await clearCache('cache:/v1/faqs*');
  res.status(httpStatus.CREATED).json({
    status: 'success',
    data: faq,
  });
});

const updateFAQ = catchAsync(async (req, res) => {
  const faq = await faqService.updateFAQ(req.params.id, req.body);
  await clearCache('cache:/v1/faqs*');
  res.status(httpStatus.OK).json({
    status: 'success',
    data: faq,
  });
});

const deleteFAQ = catchAsync(async (req, res) => {
  await faqService.deleteFAQ(req.params.id);
  await clearCache('cache:/v1/faqs*');
  res.status(httpStatus.NO_CONTENT).send();
});

/* ============================================================================
 * TÀI LIỆU CHÍNH SÁCH  [THÊM 18/08/2026]
 *
 * ★ `uploadPdf` CŨ ĐÃ BỊ THAY — và nó chưa từng chạy được.
 *
 * Bản cũ gọi `require('pdf-parse')` NGAY TRONG THÂN HÀM. Hai vấn đề:
 *
 *   1. `pdf-parse` KHÔNG có trong package.json. Endpoint ném
 *      MODULE_NOT_FOUND ở mọi lần gọi. Vì require nằm trong hàm chứ không ở
 *      đầu tệp, lỗi chỉ nổ lúc có người bấm nút — không phải lúc khởi động,
 *      nên nó nằm im cho tới khi ra mắt.
 *   2. Kể cả có cài, nó cũng chỉ TRẢ VỀ text rồi thôi: không lưu tệp gốc,
 *      không nạp vào ChromaDB, không ghi lại gì. Tức là chưa làm được đúng
 *      việc mà tính năng FAQ cần.
 *
 * Nay việc bóc text do AI Service (Python) đảm nhiệm — cùng một endpoint mà
 * luồng nhập khóa học đang dùng, đã có sẵn hàng rào bảo vệ RAM và chống XXE.
 * Backend Node không phải thêm một phụ thuộc đọc PDF nào.
 * ========================================================================== */

const uploadDocument = catchAsync(async (req, res) => {
  const doc = await faqDocumentService.uploadDocument(req.file, {
    title: req.body?.title,
    category: req.body?.category,
    // `req.user` do middleware `authenticate` gắn vào. Ghi lại ai tải lên để
    // sau này truy được nguồn gốc một chính sách sai.
    uploadedBy: req.user?.accountId ?? req.user?.AccountID ?? null,
  });

  await clearCache('cache:/v1/faqs*');
  res.status(httpStatus.CREATED).json({ status: 'success', data: doc });
});

const listDocuments = catchAsync(async (req, res) => {
  const documents = await faqDocumentService.listDocuments();
  res.status(httpStatus.OK).json({ status: 'success', data: documents });
});

const getDocumentText = catchAsync(async (req, res) => {
  const text = await faqDocumentService.getDocumentText(req.params.docId);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: { docId: req.params.docId, text },
  });
});

const deleteDocument = catchAsync(async (req, res) => {
  await faqDocumentService.deleteDocument(req.params.docId);
  await clearCache('cache:/v1/faqs*');
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  uploadDocument,
  listDocuments,
  getDocumentText,
  deleteDocument,
};
