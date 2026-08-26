# Trail — Foundation Design

## Context

Trail is a cross-platform mobile app: hikers discover trails, share live location with
their party, and stay looked-after on the mountain — through a quiet, gesture-first
interface. Think Life360, scoped to a hike.

This is the DV300 (Interactive Development 300, S2 Theme 3) graded submission. The brief
locks the stack to **React Native + TypeScript + Firebase** and grades 70% implementation /
15% concept / 15% project admin — where project admin is
explicitly _code quality, version control discipline, and documentation_. The pitch
(`docs/annotated-*.pdf`) fixes the concept: inspiration cards were **Goal** (do less —
protect the calm hiking already offers), **Device Interaction** (live location, trail
discovery, shared peace of mind), **Constraint** (gesture-first; clear CTAs only where
safety needs them).

This document is the design for the foundation slice: repo hygiene, branching,
conventions, CI, testing, and the architecture the five feature slices build on.

### Decisions

| Question      | Decision                                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| Live tracking | **Background** location (pocket / screen-off). Requires an Expo dev build, not Expo Go |
| Trail data    | Seeded Firestore set (~24 curated real trails) via a script                            |
| Branching     | Trunk-based — short-lived branches into a protected `main`, no `develop`               |

---

## Architecture

### Stack

| Concern         | Choice                                                     | Why                                                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Expo SDK 54 + React Native + **TypeScript strict**         | Mandated by brief; Expo gives EAS builds for iOS from Windows. Pinned to 54, not the newest SDK — Apple's App Store review of Expo Go lags new SDK releases by months, and 54 is what the published Expo Go app actually runs |
| Build           | **EAS dev build** (`expo-dev-client`)                      | Background location + `react-native-maps` don't work in Expo Go                                                                                                                                                               |
| Navigation      | Expo Router (file-based)                                   | Expo default; auth stack + modals for free                                                                                                                                                                                    |
| Main shell      | `react-native-pager-view`                                  | Pitch: "pager, not a tab bar"                                                                                                                                                                                                 |
| Maps            | `react-native-maps`                                        | Trail + live party views                                                                                                                                                                                                      |
| Gestures/motion | `react-native-gesture-handler` + `react-native-reanimated` | Earns two rubric items: the gesture-first constraint **and** the required tweening / micro-interactions                                                                                                                       |
| Backend         | Firebase JS SDK — Auth + Firestore                         | Mandated. JS SDK avoids native config files                                                                                                                                                                                   |
| Live positions  | **Firestore only**, throttled writes                       | KPI is 10s; Firestore snapshot listeners hit that easily and it's one less service                                                                                                                                            |
| Reminders       | `expo-notifications` (local only)                          | No push server needed for hydration/rest nudges                                                                                                                                                                               |
| State           | Firestore listeners + React Context                        | No Redux/Zustand                                                                                                                                                                                                              |
| Package manager | npm (`legacy-peer-deps=true` — see `.npmrc`)               | Already present                                                                                                                                                                                                               |

### Data model (Firestore)

Refines the pitch's ERD: `savedTrails` is a subcollection (natural 1→\*, simpler rules),
and party locations live under their group (`groups/{id}/positions/{uid}`) instead of a
top-level collection — one listener returns the whole party, and rules can pin a write to
its own author.

```
users/{uid}
  displayName, email, photoURL, hydrationGoalMl, activeGroupId, createdAt

users/{uid}/savedTrails/{trailId}
  savedAt, notes                          ← the graded CRUD surface

trails/{trailId}
  name, difficulty, distanceM, elevationGainM, region,
  description, photoUrl, location: geopoint, path: geopoint[]

groups/{groupId}
  name, trailId, ownerId, memberIds[], active, inviteCode, startedAt, endedAt

groups/{groupId}/positions/{uid}
  position: geopoint, accuracy, batteryLevel, moving, updatedAt
```

### Security rules — the real trust boundary

This is a location-sharing app; rules aren't boilerplate here and have their own test
suite (`firestore/rules.test.ts`, run against the emulator):

- `users/{uid}` — read/write only by `uid`.
- `users/{uid}/savedTrails/**` — read/write only by `uid`.
- `trails/**` — read by any signed-in user; **no client writes** (seed script uses the
  Admin SDK, which bypasses rules).
- `groups/{gid}` — read by members only; create by any signed-in user; update restricted
  to `ownerId`, except joining, which may only append the caller's own uid to
  `memberIds`.
- `groups/{gid}/positions/{uid}` — read by group members; write only where
  `uid == request.auth.uid` and the caller is a member of the parent group.

### Background location (Slice 3)

`expo-location`'s `startLocationUpdatesAsync` + `expo-task-manager`. Config:
`timeInterval: 10_000`, `distanceInterval: 25` (a stationary phone shouldn't burn
writes), an Android foreground-service notification, iOS `UIBackgroundModes: ["location"]`
and an `NSLocationAlwaysAndWhenInUseUsageDescription` that says plainly what it's for.

Tracking starts on "start hike", stops on "end hike" — stopping must be reliable, so it
lives in one place both the UI and the background task route through.

### Auth persistence

Firebase JS SDK v11+ auto-persists sessions to AsyncStorage on React Native: Metro
resolves `firebase/auth`'s `"react-native"` package-export condition to a build that
handles this internally. `getReactNativePersistence(AsyncStorage)` — the older manual
pattern — is unnecessary and would be redundant with SDK 12 (installed here). `frontend/src/lib/firebase.ts`
just calls `getAuth(app)`.

---

## What's deliberately left out

- `develop` branch / GitFlow → trunk + short-lived branches
- Realtime Database → Firestore only (revisit at real scale)
- Redux / Zustand → React Context
- Detox / Maestro E2E → manual testing until it hurts
- Monorepo, Storybook, semantic-release, Docker → single app, no versioning needed

## Repo conventions

- **Branching**: trunk-based. `main` is protected (PR + green CI required, set up by repo
  admin in GitHub settings — not something a checked-in file can do). Short-lived
  `feat/*` / `fix/*` / `chore/*` branches, squash-merged.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/), enforced by
  a `commitlint` commit-msg hook.
- **Pre-commit**: `lint-staged` runs ESLint + Prettier on staged files.
- **CI** (`.github/workflows/ci.yml`): typecheck → lint → format check → unit tests →
  Firestore rules tests (via `firebase emulators:exec`), on every PR and push to `main`.
- Full detail in `CONTRIBUTING.md`.

## Slices 1–5 (shape only — each gets its own design before it's built)

Mapped to the pitch's W3→W7 roadmap:

| Slice | Scope                                                                                           | Rubric hook                                    |
| ----- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1     | Firebase Auth (email/password), gentle onboarding carousel, session persistence                 | Authentication, Onboarding                     |
| 2     | Trail seed + search/discovery swipe cards (up = save, down = skip), saved-trails CRUD           | **CRUD KPI**, gesture-first constraint         |
| 3     | Groups (create, invite code, join), background tracking, live party map                         | **10s position KPI**, core concept             |
| 4     | Calm dashboard (trail + party + water), hydration/rest local notifications, reanimated polish   | Dashboard Summary, tweening/micro-interactions |
| 5     | Safety content, real icon + splash, accessibility pass, EAS build profiles, README + demo video | OS Compatibility, Documentation                |

Accessibility isn't a Slice 5 afterthought where it's structural: the pitch commits to a
one-handed thumb-zone layout, sunlight contrast, large tap targets, haptic gesture
confirmation, and a reduced-motion option. Thumb-zone spacing and contrast are already in
the Slice 0 theme tokens (`frontend/src/theme/`); reduced-motion lands with reanimated in Slice 4.

## Verification

Foundation is done when:

1. From `frontend/`, `npm run typecheck && npm run lint && npm run format:check && npm test` are green
   locally, and `npm run test:rules` is green in CI (needs a JRE locally — see README).
2. A PR from `chore/project-foundation` shows CI green; `main` rejects a direct push
   once branch protection is turned on (see `CONTRIBUTING.md`).
3. A non-conventional commit message is rejected by the commit-msg hook.
4. `npx expo run:android` (or an EAS dev build) launches the app to a placeholder screen
   with the splash showing first.
5. From `frontend/`, `npm run seed` populates `trails/` and is safe to run twice.
6. Rules tests prove: a non-member cannot read `groups/{gid}/positions/**`, and a member
   cannot write another member's position doc.

The 10-second position KPI is verified in Slice 3, with two dev builds (phone + emulator)
in one group, plus a unit test on the throttle logic.
