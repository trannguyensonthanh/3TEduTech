/* ============================================================================
 * chat.repository.js
 * [THÊM 17/08/2026 — LEVEL 3]
 *
 * Tầng dữ liệu cho ChatSessions / ChatMessages (tạo bởi V7__chat_history.sql).
 *
 * NGUYÊN TẮC: Backend Node.js SỞ HỮU lịch sử hội thoại. AI Service giữ nguyên
 * trạng thái STATELESS — nó chỉ nhận câu hỏi + N lượt gần nhất do backend cung
 * cấp, không tự đọc/ghi cơ sở dữ liệu.
 *
 * Đây không phải lựa chọn thẩm mỹ mà là ràng buộc hạ tầng thật: Security Group
 * của RDS (sg-rds chỉ mở cổng 1433 cho sg-cpu-ec2) khiến AI Service trên GPU
 * EC2 #2 về mặt vật lý KHÔNG kết nối được tới cơ sở dữ liệu — và đó là thiết
 * kế đúng, không nên nới ra.
 * ========================================================================== */

const { getConnection, sql } = require('../../database/connection');
const logger = require('../../utils/logger');

const SESSION_COLUMNS = `
    s.SessionID, s.AccountID, s.Scope, s.CourseID, s.LessonID,
    s.Title, s.MessageCount, s.CreatedAt, s.LastMessageAt, s.IsArchived`;

/**
 * Tìm phiên chat đang mở của người dùng theo đúng NGỮ CẢNH.
 *
 * ★ ĐÂY LÀ HÀM SỬA LỖI CỐT LÕI CỦA LEVEL 3.
 * Trước đây chat tổng (MASTER) và trợ lý trong khóa học (COURSE) dùng CHUNG
 * một khóa localStorage nên lịch sử lẫn vào nhau: hỏi trợ lý khóa "Lập trình
 * Python" lại thấy AI nhắc tới cuộc trò chuyện tư vấn mua khóa học ở trang chủ.
 * Nay mỗi (AccountID, Scope, CourseID) là một phiên RIÊNG BIỆT ở tầng CSDL —
 * không còn cách nào lẫn được nữa.
 *
 * @param {number} accountId
 * @param {string} scope - MASTER | COURSE | LESSON
 * @param {number|null} courseId
 * @returns {Promise<object|null>}
 */
const findActiveSession = async (accountId, scope, courseId = null) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('AccountID', sql.BigInt, accountId);
    request.input('Scope', sql.VarChar(20), scope);
    request.input('CourseID', sql.BigInt, courseId);

    /* Dùng "(s.CourseID = @CourseID OR (s.CourseID IS NULL AND @CourseID IS NULL))"
       chứ KHÔNG dùng "s.CourseID = @CourseID" đơn thuần.
       Với Scope = MASTER thì CourseID là NULL, mà trong SQL "NULL = NULL" cho
       kết quả UNKNOWN chứ không phải TRUE — nên phép so sánh thẳng sẽ không bao
       giờ khớp và hệ thống tạo phiên MASTER mới sau mỗi câu hỏi. */
    const result = await request.query(`
      SELECT TOP 1 ${SESSION_COLUMNS}
        FROM ChatSessions s
       WHERE s.AccountID = @AccountID
         AND s.Scope = @Scope
         AND (s.CourseID = @CourseID OR (s.CourseID IS NULL AND @CourseID IS NULL))
         AND s.IsArchived = 0
       ORDER BY s.LastMessageAt DESC;
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(
      `Error finding chat session (account ${accountId}, scope ${scope}, course ${courseId}):`,
      error
    );
    throw error;
  }
};

/**
 * Tạo phiên chat mới.
 * @param {object} data - { AccountID, Scope, CourseID, LessonID, Title }
 */
const createSession = async (data) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, data.AccountID);
  request.input('Scope', sql.VarChar(20), data.Scope);
  request.input('CourseID', sql.BigInt, data.CourseID ?? null);
  request.input('LessonID', sql.BigInt, data.LessonID ?? null);
  request.input('Title', sql.NVarChar(255), data.Title ?? null);

  const result = await request.query(`
    INSERT INTO ChatSessions (AccountID, Scope, CourseID, LessonID, Title)
    OUTPUT Inserted.*
    VALUES (@AccountID, @Scope, @CourseID, @LessonID, @Title);
  `);
  return result.recordset[0];
};

/** Tìm phiên theo ID (kèm AccountID để tầng service kiểm tra quyền sở hữu). */
const findSessionById = async (sessionId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('SessionID', sql.BigInt, sessionId);
    const result = await request.query(`
      SELECT ${SESSION_COLUMNS}
        FROM ChatSessions s
       WHERE s.SessionID = @SessionID;
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(`Error finding chat session ${sessionId}:`, error);
    throw error;
  }
};

/** Danh sách phiên của người dùng, lọc theo ngữ cảnh nếu có. */
const findSessionsByAccount = async (accountId, { scope, courseId } = {}) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('AccountID', sql.BigInt, accountId);

    let query = `
      SELECT ${SESSION_COLUMNS}, c.CourseName, c.Slug AS CourseSlug
        FROM ChatSessions s
        LEFT JOIN Courses c ON s.CourseID = c.CourseID
       WHERE s.AccountID = @AccountID AND s.IsArchived = 0`;

    if (scope) {
      request.input('Scope', sql.VarChar(20), scope);
      query += ' AND s.Scope = @Scope';
    }
    if (courseId) {
      request.input('CourseID', sql.BigInt, courseId);
      query += ' AND s.CourseID = @CourseID';
    }
    query += ' ORDER BY s.LastMessageAt DESC;';

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error(`Error listing chat sessions for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Lấy tin nhắn của một phiên, MỚI NHẤT trước rồi đảo lại.
 *
 * Vì sao không `ORDER BY CreatedAt ASC` rồi lấy TOP: cần N tin nhắn CUỐI CÙNG,
 * không phải N tin nhắn đầu tiên. Sắp xếp giảm dần + TOP N rồi đảo mảng trong
 * JavaScript là cách duy nhất dùng được index IX_ChatMessages_Session mà vẫn
 * lấy đúng phần đuôi.
 *
 * @param {number} sessionId
 * @param {number} limit
 * @returns {Promise<object[]>} Theo thứ tự thời gian tăng dần.
 */
const findRecentMessages = async (sessionId, limit = 50) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('SessionID', sql.BigInt, sessionId);
    request.input('Limit', sql.Int, limit);
    const result = await request.query(`
      SELECT TOP (@Limit)
             MessageID, SessionID, Role, Content, Intent,
             SourcesJson, UiWidgetJson, LlmProvider, LlmModel,
             TokensUsed, LatencyMs, CreatedAt
        FROM ChatMessages
       WHERE SessionID = @SessionID
       ORDER BY CreatedAt DESC, MessageID DESC;
    `);
    return result.recordset.reverse();
  } catch (error) {
    logger.error(`Error loading messages for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Ghi một tin nhắn và cập nhật phiên, TRONG CÙNG MỘT TRANSACTION.
 *
 * Hai câu lệnh phải đi cùng nhau: nếu chỉ chèn tin nhắn mà không cập nhật
 * MessageCount/LastMessageAt thì danh sách phiên sẽ hiện sai thứ tự và sai số
 * đếm — loại sai lệch tích tụ dần, không bao giờ tự lành.
 *
 * @param {object} data - { SessionID, Role, Content, Intent, ... }
 * @returns {Promise<object>}
 */
const createMessage = async (data) => {
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const insertReq = transaction.request();
    insertReq.input('SessionID', sql.BigInt, data.SessionID);
    insertReq.input('Role', sql.VarChar(10), data.Role);
    insertReq.input('Content', sql.NVarChar(sql.MAX), data.Content);
    insertReq.input('Intent', sql.VarChar(30), data.Intent ?? null);
    insertReq.input('SourcesJson', sql.NVarChar(sql.MAX), data.SourcesJson ?? null);
    insertReq.input('UiWidgetJson', sql.NVarChar(sql.MAX), data.UiWidgetJson ?? null);
    insertReq.input('LlmProvider', sql.VarChar(20), data.LlmProvider ?? null);
    insertReq.input('LlmModel', sql.VarChar(60), data.LlmModel ?? null);
    insertReq.input('TokensUsed', sql.Int, data.TokensUsed ?? null);
    insertReq.input('LatencyMs', sql.Int, data.LatencyMs ?? null);

    const inserted = await insertReq.query(`
      INSERT INTO ChatMessages (
        SessionID, Role, Content, Intent, SourcesJson, UiWidgetJson,
        LlmProvider, LlmModel, TokensUsed, LatencyMs
      )
      OUTPUT Inserted.*
      VALUES (
        @SessionID, @Role, @Content, @Intent, @SourcesJson, @UiWidgetJson,
        @LlmProvider, @LlmModel, @TokensUsed, @LatencyMs
      );
    `);

    const updateReq = transaction.request();
    updateReq.input('SessionID', sql.BigInt, data.SessionID);
    await updateReq.query(`
      UPDATE ChatSessions
         SET MessageCount  = MessageCount + 1,
             LastMessageAt = GETDATE()
       WHERE SessionID = @SessionID;
    `);

    await transaction.commit();
    return inserted.recordset[0];
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error saving chat message to session ${data.SessionID}:`, error);
    throw error;
  }
};

/** Đặt tiêu đề cho phiên (chỉ khi chưa có), sinh từ câu hỏi đầu tiên. */
const setSessionTitleIfEmpty = async (sessionId, title) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('SessionID', sql.BigInt, sessionId);
    request.input('Title', sql.NVarChar(255), title);
    await request.query(`
      UPDATE ChatSessions
         SET Title = @Title
       WHERE SessionID = @SessionID AND Title IS NULL;
    `);
  } catch (error) {
    // Tiêu đề chỉ để hiển thị cho đẹp — hỏng thì ghi log rồi thôi, tuyệt đối
    // không được làm hỏng luồng trả lời của AI.
    logger.warn(`Không đặt được tiêu đề cho phiên ${sessionId}: ${error.message}`);
  }
};

/**
 * Lưu trữ (ẩn) một phiên. KHÔNG xóa dữ liệu.
 * Giữ lại để phục vụ view vw_CourseChatInsights — thống kê "bài giảng nào gây
 * nhiều thắc mắc nhất" sẽ sai lệch nếu người dùng xóa được lịch sử thật.
 */
const archiveSession = async (sessionId) => {
  const pool = await getConnection();
  const request = pool.request();
  request.input('SessionID', sql.BigInt, sessionId);
  const result = await request.query(`
    UPDATE ChatSessions
       SET IsArchived = 1
    OUTPUT Inserted.SessionID
     WHERE SessionID = @SessionID AND IsArchived = 0;
  `);
  return result.recordset[0] || null;
};

module.exports = {
  findActiveSession,
  createSession,
  findSessionById,
  findSessionsByAccount,
  findRecentMessages,
  createMessage,
  setSessionTitleIfEmpty,
  archiveSession,
};
