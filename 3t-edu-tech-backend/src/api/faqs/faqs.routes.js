const express = require('express');
const faqController = require('./faqs.controller');
const validate = require('../../middlewares/validation.middleware');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');
const faqValidation = require('./faqs.validation');
const { uploadAttachment, handleMulterError } = require('../../middlewares/upload.middleware');
const { cache } = require('../../middlewares/cache.middleware');

const router = express.Router();

router
  .route('/upload-pdf')
  .post(
    authenticate,
    authorize(Roles.ADMIN, Roles.SYSTEM_ADMIN),
    uploadAttachment.single('file'),
    handleMulterError,
    faqController.uploadPdf
  );

router
  .route('/')
  .get(cache(21600), faqController.getAllFAQs)
  .post(
    authenticate,
    authorize(Roles.ADMIN, Roles.SYSTEM_ADMIN),
    validate(faqValidation.createFAQ),
    faqController.createFAQ
  );

router
  .route('/:id')
  .get(validate(faqValidation.getFAQ), faqController.getFAQById)
  .put(
    authenticate,
    authorize(Roles.ADMIN, Roles.SYSTEM_ADMIN),
    validate(faqValidation.updateFAQ),
    faqController.updateFAQ
  )
  .delete(
    authenticate,
    authorize(Roles.ADMIN, Roles.SYSTEM_ADMIN),
    validate(faqValidation.deleteFAQ),
    faqController.deleteFAQ
  );

module.exports = router;
