// File: src/api/admin/admin.controller.js

const httpStatus = require('http-status').status;
const adminService = require('./admin.service');
const { catchAsync } = require('../../utils/catchAsync');

const getDashboardOverview = catchAsync(async (req, res) => {
  const data = await adminService.getDashboardOverview(req.targetCurrency);
  res.status(httpStatus.OK).send(data);
});

const getQuizScoreReport = catchAsync(async (req, res) => {
  const { courseId } = req.query;
  const data = await adminService.getQuizScoreReport(courseId || null);
  res.status(httpStatus.OK).send(data);
});

const getCourseEffectivenessReport = catchAsync(async (req, res) => {
  const data = await adminService.getCourseEffectivenessReport();
  res.status(httpStatus.OK).send(data);
});

const getEnrollmentStatsReport = catchAsync(async (req, res) => {
  const data = await adminService.getEnrollmentStatsReport();
  res.status(httpStatus.OK).send(data);
});

const getInstructorAnalytics = catchAsync(async (req, res) => {
  const { period } = req.query;
  const data = await adminService.getInstructorAnalyticsReport(
    req.user.id,
    period || 'monthly'
  );
  res.status(httpStatus.OK).send(data);
});

module.exports = {
  getDashboardOverview,
  getQuizScoreReport,
  getCourseEffectivenessReport,
  getEnrollmentStatsReport,
  getInstructorAnalytics,
};
