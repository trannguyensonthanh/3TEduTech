# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/jobs/progressReminderJob.js'
s = read(p)

# 1. Tach vi tu quyet dinh ra ham thuan
OLD = """    const daysBetween = (later, earlier) =>
      (later - earlier) / (1000 * 60 * 60 * 24);

    const studentsToRemind = result.recordset.filter((row) => {
      // Khóa chưa có bài học, hoặc thực chất đã học xong → không nhắc.
      if (row.TotalLessons === 0 || row.CompletedLessons >= row.TotalLessons) {
        return false;
      }

      const lastActiveDate = row.LastActivity
        ? new Date(row.LastActivity)
        : new Date(row.EnrolledAt);
      if (daysBetween(now, lastActiveDate) < INACTIVE_DAYS_THRESHOLD) {
        return false;
      }

      // Đang trong thời gian chờ giữa hai lần nhắc → bỏ qua.
      if (row.LastRemindedAt) {
        const sinceLastRemind = daysBetween(now, new Date(row.LastRemindedAt));
        if (sinceLastRemind < REMIND_COOLDOWN_DAYS) return false;
      }

      return true;
    });"""
NEW = """    const studentsToRemind = result.recordset.filter((row) =>
      shouldRemind(row, now)
    );"""
s = sub(s, OLD, NEW, 'khoi filter')

# 2. Chen ham thuan truoc triggerAIProgressReminders
ANCHOR = "const triggerAIProgressReminders = async () => {"
PURE = '''/** Số ngày giữa hai mốc thời gian, có phần lẻ. */
const daysBetween = (later, earlier) =>
  (later - earlier) / (1000 * 60 * 60 * 24);

/**
 * Một dòng ghi danh có đủ điều kiện để nhắc hay không.
 *
 * [TÁCH RA 20/08/2026] Trước đây đây là một hàm ẩn danh nằm trong
 * `triggerAIProgressReminders`, nên muốn kiểm thử phải có cơ sở dữ liệu thật,
 * phải có AI Service, và — nguy hiểm nhất — phải chấp nhận việc job GỬI EMAIL
 * THẬT cho mọi học viên đủ điều kiện. Không ai dám chạy một phép thử như vậy,
 * nên phần logic quyết định "ai bị làm phiền" là phần DUY NHẤT trong job chưa
 * bao giờ được kiểm.
 *
 * Tách ra thành hàm thuần (không đọc CSDL, không gọi mạng, nhận `now` từ ngoài
 * thay vì tự gọi `Date.now()`) thì kiểm được toàn bộ ranh giới bằng dữ liệu
 * dựng sẵn, chạy trong vài mili giây, không gửi đi một email nào.
 *
 * @param {object} row  Một dòng của truy vấn bên dưới. Cần các trường:
 *   TotalLessons, CompletedLessons, LastActivity, EnrolledAt, LastRemindedAt.
 * @param {Date} now    Thời điểm coi là "bây giờ".
 * @returns {boolean}
 */
const shouldRemind = (row, now) => {
  // Khóa chưa có bài học, hoặc thực chất đã học xong → không nhắc.
  if (row.TotalLessons === 0 || row.CompletedLessons >= row.TotalLessons) {
    return false;
  }

  /* Chưa từng xem bài nào thì lấy mốc ghi danh làm mốc hoạt động.
     Nếu không, người mua khóa rồi bỏ luôn — đúng nhóm cần nhắc nhất — sẽ có
     LastActivity là null và không bao giờ lọt vào danh sách. */
  const lastActiveDate = row.LastActivity
    ? new Date(row.LastActivity)
    : new Date(row.EnrolledAt);
  if (daysBetween(now, lastActiveDate) < INACTIVE_DAYS_THRESHOLD) {
    return false;
  }

  // Đang trong thời gian chờ giữa hai lần nhắc → bỏ qua.
  if (row.LastRemindedAt) {
    const sinceLastRemind = daysBetween(now, new Date(row.LastRemindedAt));
    if (sinceLastRemind < REMIND_COOLDOWN_DAYS) return false;
  }

  return true;
};

const triggerAIProgressReminders = async () => {'''
s = sub(s, ANCHOR, PURE, 'neo triggerAIProgressReminders')

# 3. Export them
s = sub(s, """module.exports = {
  scheduleProgressReminders,
  triggerAIProgressReminders,
};""",
"""module.exports = {
  scheduleProgressReminders,
  triggerAIProgressReminders,
  /* [THÊM 20/08/2026] Ba thứ dưới đây được phơi ra CHỈ để kiểm thử được phần
     logic quyết định mà không cần CSDL, không cần AI, và không gửi email thật.
     Mã sản phẩm không nên gọi tới chúng từ nơi khác. */
  shouldRemind,
  buildFallbackMessage,
  INACTIVE_DAYS_THRESHOLD,
  REMIND_COOLDOWN_DAYS,
};""", 'module.exports')
write(p, s)
print('progressReminderJob.js OK')
