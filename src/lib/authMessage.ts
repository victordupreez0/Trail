// Split out from auth.ts so this pure function is testable without pulling in
// firebase/auth's ESM build, which jest-expo's transformer can't parse.
//
// Firebase error codes read like "auth/invalid-credential" and are not fit to show a
// user. Only the ones a login/signup form can actually trigger are mapped; anything
// else falls back to a generic sentence rather than the raw code.
const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/email-already-in-use': 'An account already exists for that email.',
  'auth/weak-password': 'Password needs to be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a bit.',
  'auth/network-request-failed': 'No connection. Check your WiFi and try again.',
};

export function authMessage(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return 'Something went wrong. Try again.';
}
