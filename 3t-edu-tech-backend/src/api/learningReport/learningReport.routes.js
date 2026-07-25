const express = require('express');
const learningReportController = require('./learningReport.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', learningReportController.getLearningReport);

module.exports = router;
