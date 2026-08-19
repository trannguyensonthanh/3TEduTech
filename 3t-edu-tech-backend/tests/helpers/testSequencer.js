/**
 * helpers/testSequencer.js
 * ─────────────────────────────────────────────────────────
 * Đảm bảo các test file chạy theo đúng thứ tự alphabet (01, 02, 03...)
 * vì mỗi file phụ thuộc vào kết quả của file trước đó.
 */
const { default: Sequencer } = require('@jest/test-sequencer');

class CustomSequencer extends Sequencer {
  sort(tests) {
    return [...tests].sort((a, b) => (a.path > b.path ? 1 : -1));
  }
}

module.exports = CustomSequencer;
