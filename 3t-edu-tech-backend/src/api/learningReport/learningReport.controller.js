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
  
  /* [SỬA 19/08/2026] Trả thẳng dữ liệu, không bọc thêm lớp {status, data}.

     Mọi controller khác trong dự án đều dùng res.send(data), và apiHelper phía
     giao diện trả về nguyên thân phản hồi chứ không tự bóc trường `data`. Riêng
     điểm cuối này bọc thêm một lớp, nên giao diện nhận được {status, data} rồi
     đọc `report.overview` ra undefined và trang trắng. */
  res.status(httpStatus.OK).send(report);
});

module.exports = {
  getLearningReport
};
