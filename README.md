# Trail

A cross-platform mobile app for hikers: discover trails, share live location with your
party, and stay looked-after on the mountain, through a calm, gesture-first interface.
Think Life360, scoped to a hike.

This is the submission for **DV300 (Interactive Development 300), Semester 2, Theme 3**.
The brief locks the stack to React Native + TypeScript + Firebase and grades 70%
implementation / 15% concept / 15% project admin, where project admin means code
quality, version control discipline, and documentation. This README is that
documentation.

## Concept

Three inspiration cards shaped every decision below:

- **Goal: do less.** Protect the calm a hike already offers, rather than adding another
  app to check. The onboarding carousel (`app/onboarding.tsx`) opens on this line
  directly: "Do less, not more."
- **Device interaction: live location, trail discovery, shared peace of mind.** A phone
  already knows where you are; the app's job is to turn that into "my party can see I'm
  safe" without anyone having to send a text.
- **Constraint: gesture-first, clear CTAs only where safety needs them.** Trail
  discovery is a swipe deck (swipe up to save, down to skip), navigation between the five
  main screens is a horizontal pager you can flick between, and buttons only show up
  where a tap needs to be unambiguous: starting a hike, saving a trail from its detail
  page, ending tracking.

## Run it

```bash
npm install
npm start
```

Scan the QR code with the **Expo Go** app on your phone (same WiFi as your computer).
`npm start` auto-detects your machine's LAN address so the QR code is scannable; if your
network blocks device-to-device traffic (common on campus/guest WiFi), use
`npm run start:tunnel` instead.

Auth and saved trails need a Firebase project: copy `.env.example` to `.env` and fill in
the six `EXPO_PUBLIC_FIREBASE_*` values from your project's web app config (Firebase
console → Project settings → Your apps). Enable Email/Password sign-in under
Authentication → Sign-in method, create a Firestore database, and deploy the rules:

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project <your-project-id>
```

Everything else in the app still runs on static in-app data (see
[What's real vs mocked](#whats-real-vs-mocked)).

## Screens

Twelve screens, navigable end to end on static data:

| Route                   | Screen       | What it does today                                                   |
| ----------------------- | ------------ | -------------------------------------------------------------------- |
| `app/onboarding.tsx`    | Onboarding   | Three-slide pager introducing the concept                            |
| `app/(auth)/login.tsx`  | Login        | Real Firebase email/password sign-in, with error handling            |
| `app/(auth)/signup.tsx` | Sign up      | Real Firebase account creation, sets display name                    |
| `app/(app)/index.tsx`   | App shell    | Horizontal pager across the five screens below, plus a tab bar       |
| ...Today                | Dashboard    | Active hike hero, party size, water and trail stats                  |
| ...Discover             | Swipe deck   | Swipe up/down through the 24-trail catalog; tap for detail           |
| ...Saved                | Saved trails | Firestore-backed: grid of saved trails, one-tap remove, syncs live   |
| ...Party                | Groups       | Active group, member list, map with static positions along the trail |
| ...You                  | Profile      | User info, settings list                                             |
| `app/trail/[id].tsx`    | Trail detail | Full trail info, map with route polyline, save toggle                |
| `app/group/create.tsx`  | Create group | Form UI, modal presentation                                          |
| `app/group/join.tsx`    | Join group   | Invite-code form, modal presentation                                 |
| `app/safety.tsx`        | Safety       | Static hiking and location-sharing guidance                          |

## Architecture

| Concern         | Choice                                                          | Why                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Expo SDK 54, React Native, TypeScript strict                    | Mandated by the brief; pinned to 54 (not the newest SDK) because Apple's review of the published Expo Go app lags new SDKs by months, and 54 is what Expo Go actually runs today                                                                                                                                                                         |
| Navigation      | Expo Router (file-based)                                        | Auth stack and modals for free; routes above map 1:1 to files in `app/`                                                                                                                                                                                                                                                                                  |
| Main shell      | `react-native-pager-view`                                       | The pitch calls for "a pager, not a tab bar"; the tab bar in `app/(app)/index.tsx` is a visible affordance for the same swipe                                                                                                                                                                                                                            |
| Maps            | `react-native-maps`                                             | Trail routes and party positions; works inside Expo Go, no dev build needed for this                                                                                                                                                                                                                                                                     |
| Gestures/motion | `react-native-gesture-handler` + `react-native-reanimated`      | Powers the swipe deck (`src/components/SwipeDeck.tsx`) and earns both the gesture-first constraint and the tweening rubric item                                                                                                                                                                                                                          |
| Backend         | Firebase JS SDK: Auth and saved-trails CRUD wired, rest not yet | `src/lib/auth.ts` wraps sign-in/sign-up/sign-out; `src/state/AppState.tsx` subscribes to `onAuthStateChanged` and to a live `onSnapshot` on `users/{uid}/savedTrails`, so a signed-in session and saved trails both survive an app restart with no persistence code of our own (the SDK persists sessions to AsyncStorage on React Native automatically) |
| State           | React Context                                                   | `src/state/AppState.tsx` holds the real Firebase user and saved trails, plus onboarding/active-group state in memory; groups get replaced by a Firestore listener in Slice 3, the screens consuming this context don't change when that happens                                                                                                          |
| Package manager | npm, `legacy-peer-deps=true`                                    | See `.npmrc`                                                                                                                                                                                                                                                                                                                                             |

Everything a screen needs comes from `src/data/{trails,groups,user}.ts`, static
TypeScript modules, not network calls. `src/data/trails.ts` is also imported by
`scripts/seed-trails.ts`, so the same 24-trail dataset that renders in the app today is
what gets written to Firestore once the backend is wired in.

## Data model (Firestore)

`users/{uid}/savedTrails` is wired to the UI; the rest is designed and rules-tested,
not yet wired.

```
users/{uid}
  displayName, email, photoURL, hydrationGoalMl, activeGroupId, createdAt

users/{uid}/savedTrails/{trailId}
  savedAt, notes                          <- the graded CRUD surface

trails/{trailId}
  name, difficulty, distanceM, elevationGainM, region,
  description, photoUrl, location: geopoint, path: geopoint[]

groups/{groupId}
  name, trailId, ownerId, memberIds[], active, inviteCode, startedAt, endedAt

groups/{groupId}/positions/{uid}
  position: geopoint, accuracy, batteryLevel, moving, updatedAt
```

`savedTrails` is a subcollection of `users` (a natural 1-to-many with simpler rules), and
party positions live under their group rather than in a top-level collection, so one
listener returns the whole party and rules can pin a write to its own author. Full
rationale in `docs/specs/2026-08-03-trail-design.md`.

## Security rules

This is a location-sharing app, so the Firestore rules are the actual trust boundary,
not boilerplate, and they have their own test suite (`firestore/rules.test.ts`, run
against the emulator in CI):

- `users/{uid}` and `users/{uid}/savedTrails/**`: read/write only by that `uid`.
- `trails/**`: read by any signed-in user, no client writes (the seed script uses the
  Admin SDK, which bypasses rules).
- `groups/{gid}`: read by members only; created by any signed-in user; updates
  restricted to the owner, except joining, which may only append the caller's own uid.
- `groups/{gid}/positions/{uid}`: read by group members, written only by that member
  about themselves.

## What's real vs mocked

Being upfront about this is more useful than dressing it up: two of the five slices
(Auth, and saved-trails CRUD) are wired to real Firebase; the rest of the app still runs
on static in-app data.

| Working                                                    | Static stand-in                      | Not built yet                      |
| ---------------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| Navigation across all 12 screens                           | Group membership and party positions | Live position sync (10s KPI)       |
| Firebase email/password auth, session persists             | Water/hydration stat                 | Background location tracking       |
| Saved trails: Firestore CRUD, persists across app restarts |                                      | Local hydration/rest notifications |
| Swipe-to-save/skip gesture (unit tested)                   |                                      |                                    |
| Trail search UI, maps, route polylines                     |                                      |                                    |
| Firestore security rules (rules-tested in CI)              |                                      |                                    |

## Roadmap

Mapped to the pitch's five-slice plan (`docs/specs/2026-08-03-trail-design.md`):

| Slice | Scope                                                                        | Status                                                                |
| ----- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0     | Repo, conventions, CI, Firestore rules + tests, design tokens                | Done                                                                  |
| 1     | Firebase Auth, onboarding, session persistence                               | Done: real sign-in/sign-up/sign-out, session persists across restarts |
| 2     | Trail seed, swipe discovery, saved-trails CRUD                               | Done: swipe gesture, saved trails persist to Firestore                |
| 3     | Groups, background tracking, live party map                                  | UI done, tracking and live sync next                                  |
| 4     | Calm dashboard, hydration/rest notifications, reanimated polish              | Dashboard UI done, notifications next                                 |
| 5     | Safety content, real icon/splash, accessibility pass, EAS builds, demo video | Safety screen and icons done, accessibility pass and demo video next  |

## Quality

| Command                           | Does                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| `npm start`                       | Start the Metro dev server (LAN QR fix baked in, see `scripts/start.js`) |
| `npm run start:tunnel`            | Same, via ngrok, for networks that block device-to-device traffic        |
| `npm run typecheck`               | `tsc --noEmit`                                                           |
| `npm run lint`                    | ESLint                                                                   |
| `npm run format` / `format:check` | Prettier                                                                 |
| `npm test`                        | Jest unit/component tests                                                |
| `npm run test:rules`              | Firestore security rules tests (needs the Firebase emulator)             |
| `npm run seed`                    | Seed Firestore with the curated trail set (Admin SDK, safe to run twice) |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, format check, unit tests, and
Firestore rules tests on every PR and push to `main`. Two unit tests exist so far:
`__tests__/decideSwipe.test.ts` tests gesture logic independent of the gesture handler
itself (`src/lib/swipe.ts`'s `decideSwipe` uses a `'worklet'` directive so it can run on
the UI thread, but stays a plain testable function in Node); `__tests__/authMessage.test.ts`
tests that Firebase's raw error codes map to sentences a user can read, from
`src/lib/authMessage.ts` (split out of `src/lib/auth.ts` so it is testable without
pulling in `firebase/auth`'s ESM build, which Jest can't parse).

## Conventions

- **Branching**: trunk-based, short-lived `feat/*` / `fix/*` / `chore/*` branches into a
  protected `main`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/), enforced by
  a commit-msg hook.
- **Pre-commit**: `lint-staged` runs ESLint and Prettier on staged files.

Full detail in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Docs

- [`docs/specs/2026-08-03-trail-design.md`](./docs/specs/2026-08-03-trail-design.md): the
  full design doc this README summarizes, architecture decisions, and what was
  deliberately left out.
- `docs/`: the assignment brief and the annotated pitch deck.

## License

[MIT](./LICENSE)
