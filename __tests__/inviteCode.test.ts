import { makeInviteCode } from '../src/lib/inviteCode';

test('an invite code is 6 characters drawn from A-Z0-9', () => {
  for (let i = 0; i < 20; i++) {
    expect(makeInviteCode()).toMatch(/^[A-Z0-9]{6}$/);
  }
});
