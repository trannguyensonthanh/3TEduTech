const { state } = require('./shared');
test('file A đặt token', () => { state.token = 'ABC'; expect(state.token).toBe('ABC'); });
