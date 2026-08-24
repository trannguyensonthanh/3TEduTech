/* ============================================================================
 * aiGrouper.js
 * [THÊM 21/08/2026 — COURSE IMPORT, Giai đoạn B]
 *
 * Dùng AI để nhóm các bài học thành chương khi cấu trúc thư mục quá lộn xộn.
 *
 * ----------------------------------------------------------------------------
 * KHI NÀO CHẠY
 *
 * Chỉ khi `proposal.needsAiGrouping === true`, tức điểm tin cậy của Tier 0
 * (treeAnalyzer) dưới ngưỡng 0.75. Cấu trúc tốt → 0 token, 0 lời gọi LLM.
 *
 * ----------------------------------------------------------------------------
 * TRIẾT LÝ: AI LÀ PHỤ TÁ, KHÔNG PHẢI CHỈ HUY
 *
 * AI nhận bản nháp Tier 0 (đã có thứ tự, đã có tên bài) và CHỈ quyết định
 * việc NHÓM (bài nào vào chương nào, tên chương là gì). Nó KHÔNG được:
 *   - Đổi tên bài học (giảng viên đặt tên, AI không nên ghi đè)
 *   - Xóa bài học (hệ thống đã lọc rồi, AI không có quyền bỏ)
 *   - Thêm bài học mới (không có tệp thật thì không có bài)
 *
 * Nếu AI trả về kết quả bất hợp lệ hoặc thiếu bài, hệ thống GIỮ NGUYÊN
 * bản nháp Tier 0 và cảnh báo cho giảng viên tự chỉnh.
 * ========================================================================== */

const aiClient = require('../aiClient');
const logger = require('../../utils/logger');
const { truncate } = require('./treeAnalyzer');

/** Thời gian chờ tối đa khi gọi AI. */
const AI_GROUPING_TIMEOUT_MS = 30000;

/** Số ký tự tối đa lấy từ textContent mỗi bài để đút vào prompt. */
const TEXT_PREVIEW_CHARS = 200;

/**
 * Gom tất cả bài học từ mọi chương thành một danh sách phẳng,
 * đánh số index để AI tham chiếu.
 */
const flattenLessons = (proposal) => {
  const lessons = [];
  for (const section of proposal.sections) {
    for (const lesson of section.lessons) {
      lessons.push(lesson);
    }
  }
  return lessons;
};

/**
 * Xây prompt mô tả danh sách bài học cho AI.
 *
 * ⚠️ KHÔNG đưa toàn bộ textContent vào prompt — một khóa 50 bài × 20.000 ký
 * tự = 1 triệu ký tự, vượt xa cửa sổ ngữ cảnh. Chỉ lấy 200 ký tự đầu làm
 * gợi ý nội dung, đủ để AI đoán chủ đề mà không tốn quá nhiều token.
 */
const buildPrompt = (lessons, courseName) => {
  const lessonDescriptions = lessons.map((lesson, idx) => {
    const preview = lesson.textContent
      ? lesson.textContent.slice(0, TEXT_PREVIEW_CHARS).replace(/\n/g, ' ')
      : '(không có nội dung)';
    return `  ${idx}. "${lesson.lessonName}" [${lesson.lessonType}] — ${preview}`;
  }).join('\n');

  return `Bạn là trợ lý AI chuyên tổ chức cấu trúc khóa học trực tuyến.

Tôi có một khóa học tên "${courseName}" gồm ${lessons.length} bài học bên dưới. Các bài học này hiện đang KHÔNG có cấu trúc rõ ràng (chưa được chia thành các chương/phần hợp lý).

Hãy phân nhóm các bài học này thành các CHƯƠNG (Section) sao cho hợp lý về mặt nội dung và trình tự học.

DANH SÁCH BÀI HỌC (index. "tên" [loại] — nội dung tóm tắt):
${lessonDescriptions}

QUY TẮC:
1. Mỗi bài học PHẢI thuộc đúng MỘT chương, không được bỏ sót bài nào
2. Giữ nguyên thứ tự bài học trong mỗi chương (index nhỏ trước)
3. Tạo từ 2 đến 8 chương, mỗi chương nên có ít nhất 2 bài
4. Đặt tên chương ngắn gọn, rõ ràng, bằng tiếng Việt
5. KHÔNG đổi tên bài học, chỉ nhóm chúng lại

Trả về KẾT QUẢ dưới dạng JSON (chỉ trả JSON, không có văn bản khác):
{
  "sections": [
    {
      "sectionName": "Tên chương",
      "lessonIndices": [0, 1, 2]
    }
  ]
}`;
};

/**
 * Parse kết quả trả về từ AI.
 *
 * @returns {object|null} Mảng sections hoặc null nếu không hợp lệ
 */
const parseAiResponse = (answer, totalLessons) => {
  if (!answer) return null;

  // Tìm JSON trong câu trả lời (AI có thể kèm văn bản mở đầu/kết thúc)
  const jsonMatch = answer.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    return null;
  }

  // Kiểm tra tính hợp lệ: mỗi bài phải xuất hiện ĐÚNG MỘT LẦN
  const allIndices = new Set();
  for (const section of parsed.sections) {
    if (!section.sectionName || !Array.isArray(section.lessonIndices)) {
      return null;
    }
    for (const idx of section.lessonIndices) {
      if (typeof idx !== 'number' || idx < 0 || idx >= totalLessons) {
        return null;
      }
      if (allIndices.has(idx)) {
        // Bài bị trùng → AI nhóm sai
        return null;
      }
      allIndices.add(idx);
    }
  }

  // Kiểm tra xem có bài nào bị bỏ sót không
  if (allIndices.size !== totalLessons) {
    logger.warn(
      `[AI Grouper] AI trả về ${allIndices.size}/${totalLessons} bài — thiếu ${totalLessons - allIndices.size} bài.`
    );
    return null;
  }

  return parsed.sections;
};

/**
 * Xây lại proposal.sections từ kết quả AI.
 *
 * Giữ nguyên mọi thuộc tính của từng bài học (textContent, subtitlePath,
 * durationSeconds...), chỉ thay đổi cách nhóm và đánh số thứ tự.
 */
const rebuildSections = (aiSections, flatLessons) => {
  return aiSections.map((aiSection, sIdx) => ({
    sourceDir: '',
    order: sIdx,
    sectionName: truncate(aiSection.sectionName, 255),
    description: null,
    descriptionSource: 'ai',
    sectionOrder: sIdx,
    lessons: aiSection.lessonIndices.map((lessonIdx, lIdx) => ({
      ...flatLessons[lessonIdx],
      order: lIdx,
      lessonOrder: lIdx,
    })),
  }));
};

/**
 * ★ HÀM CHÍNH — Gọi AI để nhóm bài học khi cấu trúc không rõ ràng.
 *
 * @param {object} proposal - bản nháp từ analyzeTree() có needsAiGrouping = true
 * @returns {object} { success, llmCalls, tokensEstimated }
 */
const aiGroupLessons = async (proposal) => {
  const flatLessons = flattenLessons(proposal);

  if (flatLessons.length < 2) {
    // Quá ít bài, không cần nhóm
    logger.info('[AI Grouper] Bỏ qua: chỉ có 1 bài học.');
    return { success: false, llmCalls: 0, tokensEstimated: 0 };
  }

  const prompt = buildPrompt(flatLessons, proposal.courseName);

  try {
    logger.info(
      `[AI Grouper] Gọi AI để nhóm ${flatLessons.length} bài học ` +
        `(tin cậy Tier 0: ${proposal.confidence})...`
    );

    const aiResponse = await aiClient.post(
      '/api/chat/query',
      { query: prompt, chat_history: [], top_k: 1 },
      AI_GROUPING_TIMEOUT_MS
    );

    const answer = aiResponse.data?.answer?.trim();
    const aiSections = parseAiResponse(answer, flatLessons.length);

    if (!aiSections) {
      logger.warn(
        '[AI Grouper] AI trả về kết quả không hợp lệ. Giữ nguyên cấu trúc Tier 0.'
      );
      return { success: false, llmCalls: 1, tokensEstimated: prompt.length };
    }

    // ★ Thành công — ghi đè sections trong proposal
    const newSections = rebuildSections(aiSections, flatLessons);
    proposal.sections = newSections;

    // Cập nhật stats
    proposal.stats.totalSections = newSections.length;
    proposal.stats.totalLessons = flatLessons.length; // không đổi
    proposal.confidence = 0.9; // AI đã xử lý → nâng điểm
    proposal.needsAiGrouping = false; // đã xong
    proposal.aiEnriched = true;

    logger.info(
      `[AI Grouper] Thành công! Đã nhóm ${flatLessons.length} bài học ` +
        `thành ${newSections.length} chương.`
    );

    return { success: true, llmCalls: 1, tokensEstimated: prompt.length };
  } catch (error) {
    /* AI Service lỗi/timeout → KHÔNG LÀM HỎNG import.
       Giữ nguyên kết quả Tier 0 và để giảng viên tự chỉnh. */
    const detail = error.response?.data?.detail || error.message;
    logger.error(`[AI Grouper] Lỗi khi gọi AI: ${detail}. Giữ nguyên Tier 0.`);
    return { success: false, llmCalls: 1, tokensEstimated: prompt.length };
  }
};

module.exports = {
  aiGroupLessons,
  // Export cho kiểm thử
  buildPrompt,
  parseAiResponse,
  rebuildSections,
  flattenLessons,
  AI_GROUPING_TIMEOUT_MS,
  TEXT_PREVIEW_CHARS,
};
