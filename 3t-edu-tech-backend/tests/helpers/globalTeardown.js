/**
 * helpers/globalTeardown.js
 * ─────────────────────────────────────────────────────────
 * Chạy 1 lần sau khi toàn bộ test suite kết thúc.
 */
module.exports = async function globalTeardown() {
  console.log('\n🧹 Test suite hoàn tất. Xem kết quả ở trên.');
};
