const { state } = require('./shared');
test('file B đọc token do file A đặt', () => {
  console.log('  >>> state.token ở file B =', JSON.stringify(state.token));
  expect(state.token).toBe('ABC');
});
