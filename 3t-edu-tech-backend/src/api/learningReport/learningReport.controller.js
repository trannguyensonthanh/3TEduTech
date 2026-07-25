const httpStatus = require('http-status').status;
const learningReportService = require('./learningReport.service');
const { catchAsync } = require('../../utils/catchAsync');
const { getConnection, sql } = require('../../database/connection');

const getLearningReport = catchAsync(async (req, res) => {
  const accountId = req.user.id;
  
  // Get fullName
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);
  const result = await request.query('SELECT FullName FROM UserProfiles WHERE AccountID = @AccountID');
  const fullName = result.recordset[0]?.FullName || 'Học viên';

  const report = await learningReportService.getLearningReport(accountId, fullName);
  
  res.status(httpStatus.OK).json({
    status: 'success',
    data: report
  });
});

module.exports = {
  getLearningReport
};
