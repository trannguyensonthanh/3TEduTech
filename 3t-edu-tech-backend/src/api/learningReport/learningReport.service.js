const axios = require('axios');
const repository = require('./learningReport.repository');
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

  const reportData = {
    overview: toCamelCaseObject(overviewStats),
    courseProgress: courseProgress.map(c => toCamelCaseObject(c)),
    quizPerformance: toCamelCaseObject(quizPerformance),
    weeklyActivity: weeklyActivity.map(w => toCamelCaseObject(w)),
    streak
  };

  let aiAnalysis = null;
  try {
    const aiServicePort = process.env.AI_SERVICE_PORT || 2111;
    const aiServiceUrl = `http://edutech-ai-service-dev:${aiServicePort}/api/chat/query`;
    
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

    const aiResponse = await axios.post(aiServiceUrl, {
      query: prompt,
      chat_history: [],
      top_k: 1
    });

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
