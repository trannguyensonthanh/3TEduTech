const httpStatus = require('http-status').status;
const faqService = require('./faqs.service');
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

const uploadPdf = catchAsync(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new Error('Vui lòng cung cấp file PDF.');
  }
  
  if (file.mimetype !== 'application/pdf') {
    throw new Error('Chỉ hỗ trợ định dạng file PDF.');
  }

  const pdfParse = require('pdf-parse');
  const pdfData = await pdfParse(file.buffer);
  
  // Clean up some basic spacing if needed
  const text = pdfData.text.replace(/\n\s*\n/g, '\n\n').trim();

  res.status(httpStatus.OK).json({
    status: 'success',
    data: {
      text,
      fileName: file.originalname
    }
  });
});

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  uploadPdf,
};
