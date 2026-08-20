const repository = require('./learningReport.repository');
/* [SỬA 19/08/2026] Dùng aiClient thay cho axios trần: aiClient tự gắn khóa nội
   bộ và luôn có thời gian chờ. Gọi axios trần vừa bị AI Service trả 401 kể từ
   khi bật khóa nội bộ, vừa không có timeout nên nếu AI Service treo thì yêu
   cầu báo cáo học tập treo theo vô hạn. */
const aiClient = require('../../services/aiClient');
const logger = require('../../utils/logger');
const { toCamelCaseObject } = require('../../utils/caseConverter');

const getLearningReport = async (accountId, fullName) => {
  const [
    overviewStats,
    courseProgress,
    quizPerformance,
    weeklyActivity,
    streak
  ] = await Promise.all([
    repository.getOverviewStats(accountId),
    repository.getCourseProgressDetails(accountId),
    repository.getQuizPerformance(accountId),
    repository.getWeeklyActivity(accountId),
    repository.getLearningStreak(accountId)
  ]);

  /* [SỬA 19/08/2026] Ánh xạ tên trường một cách TƯỜNG MINH thay vì dựa vào phép
     đổi sang kiểu lạc đà tự động.

     Truy vấn trả về TotalEnrolledCourses / TotalLearningTimeMinutes /
     AvgCompletionPercentage, đổi tự động sẽ ra totalEnrolledCourses /
     totalLearningTimeMinutes / avgCompletionPercentage — trong khi hợp đồng phía
     giao diện khai báo totalCourses / totalLearningMinutes /
     averageCompletionPercentage. Ba trong bốn chỉ số vì vậy hiện ra undefined.

     Viết tay phép ánh xạ ở đây để lệch tên bị phát hiện ngay tại chỗ, thay vì
     lặng lẽ trở thành undefined ở đầu bên kia. */
  const overviewCamel = toCamelCaseObject(overviewStats);
  const reportData = {
    overview: {
      totalCourses: Number(overviewCamel.totalEnrolledCourses ?? 0),
      totalCompletedLessons: Number(overviewCamel.totalCompletedLessons ?? 0),
      totalLearningMinutes: Math.round(
        Number(overviewCamel.totalLearningTimeMinutes ?? 0)
      ),
      averageCompletionPercentage: Math.round(
        Number(overviewCamel.avgCompletionPercentage ?? 0)
      ),
    },
    courseProgress: courseProgress.map(c => toCamelCaseObject(c)),
    quizPerformance: toCamelCaseObject(quizPerformance),
    weeklyActivity: weeklyActivity.map(w => toCamelCaseObject(w)),
    streak
  };

  let aiAnalysis = null;
  try {
    const AI_TIMEOUT_MS = 20000;
    
    const prompt = `Dưới đây là dữ liệu học tập của học viên ${fullName}:
- Tổng số khóa học đã đăng ký: ${overviewStats.TotalEnrolledCourses}
- Tổng số bài học đã hoàn thành: ${overviewStats.TotalCompletedLessons}
- Tổng thời gian học: ${overviewStats.TotalLearningTimeMinutes} phút
- Tỷ lệ hoàn thành trung bình: ${overviewStats.AvgCompletionPercentage}%
- Chuỗi ngày học liên tiếp (Streak): ${streak} ngày
- Điểm bài kiểm tra trung bình: ${quizPerformance.AverageScore}

Hãy phân tích dữ liệu trên và trả về kết quả dưới định dạng JSON với các trường sau (chỉ trả về JSON, không thêm văn bản khác):
{
  "overallAssessment": "Đánh giá tổng quan (2-3 câu tiếng Việt)",
  "strengths": ["Danh sách các điểm mạnh"],
  "areasForImprovement": ["Danh sách các điểm cần cải thiện"],
  "recommendations": ["Danh sách các đề xuất học tập"],
  "motivationScore": Điểm động lực (số từ 0-100)
}`;

    const aiResponse = await aiClient.post(
      '/api/chat/query',
      { query: prompt, chat_history: [], top_k: 1 },
      AI_TIMEOUT_MS
    );

    if (aiResponse.data && aiResponse.data.answer) {
      const answer = aiResponse.data.answer;
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    logger.error('Error fetching AI analysis for learning report', error);
  }

  return {
    ...reportData,
    aiAnalysis
  };
};

module.exports = {
  getLearningReport
};
