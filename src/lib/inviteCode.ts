// Split out from groups.ts so this pure function is testable without pulling in
// firebase/firestore's ESM build, which jest-expo's transformer can't parse (same
// reason authMessage.ts is split out of auth.ts).
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// No collision retry: 36^6 is ~2.2 billion codes, and the inviteCodes `create` rule
// turns a collision into a visible write failure rather than a silent overwrite of
// someone else's invite.
export function makeInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}
