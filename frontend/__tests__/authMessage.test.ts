import { authMessage } from '../src/lib/authMessage';

test('a known Firebase error code maps to a human sentence', () => {
  expect(authMessage({ code: 'auth/wrong-password' })).toBe('Wrong email or password.');
});

test('an unknown code falls back to a generic message, not undefined', () => {
  expect(authMessage({ code: 'auth/some-new-code' })).toBe('Something went wrong. Try again.');
});

test('a non-Firebase error also falls back safely', () => {
  expect(authMessage(new Error('boom'))).toBe('Something went wrong. Try again.');
});
