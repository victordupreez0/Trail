# Trail

A mobile app for hikers: find a trail, share your live location with your hiking party,
and stay looked-after on the mountain, without the app itself getting in the way. Think
Life360, but scoped to a single hike.

This is my submission for DV300 (Interactive Development), Semester 2, Theme 3. The
brief locks the stack to React Native + TypeScript + Firebase, so that's what this is
built on.

## Concept

Three ideas from my original pitch shaped most of the decisions below:

- **Do less, not more.** A hike is already calm; I didn't want the app fighting that.
  The onboarding carousel (`app/onboarding.tsx`) opens on this line directly.
- **Live location as peace of mind.** Your phone already knows where you are. The point
  of the app is turning that into "my group can see I'm okay" without anyone having to
  send a text.
- **Gesture-first, buttons only where it matters.** Discovering trails is a swipe deck
  (up to save, down to skip), moving between the five main screens is a horizontal
  pager you can flick through, and a proper button only shows up where a tap needs to be
  unambiguous: starting a hike, saving a trail, ending tracking.

## Project layout

```
app/        Expo Router screens, one file per route
src/        components, screens, static data, theme, Firebase client
backend/    Firestore security rules, rules tests, and the trail seed script
assets/     icons, splash, bundled trail photos
docs/       the assignment brief and my original pitch deck
```

The app is plain Expo at the repo root, since that's where Expo expects it to live.
`backend/` holds everything Firestore-side: the security rules, their test suite, and
the script that seeds the trail catalog into Firestore.

## Running it

```bash
npm install
npm start
```

Scan the QR code with the Expo Go app on your phone (same WiFi as your computer).
`npm start` figures out my machine's LAN address itself so the QR code is scannable; on
networks that block phone-to-laptop traffic (most campus WiFi), use
`npm run start:tunnel` instead.

Auth and saved trails need a Firebase project. Create a `.env` file at the repo root
with:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

filled in from your Firebase project's web app config (console → Project settings →
Your apps). Then enable Email/Password sign-in under Authentication → Sign-in method,
create a Firestore database, and publish `backend/firestore.rules` under Firestore
Database → Rules in the console (or `npx firebase deploy --only firestore:rules` if
you've got the CLI logged in). Without the rules published, Firestore's default denies
every read and write, so saving a trail won't do anything.

Profile photo upload needs `backend/storage.rules` published too, separately, under
Storage → Rules in the console (or `npx firebase deploy --only storage`). Publishing
the Firestore rules does not publish these; they're a different product with its own
rules file and its own place in the console.

Other useful commands: `npm run typecheck`, `npm run lint`, `npm test`, and
`npm run seed` to push the trail catalog into Firestore (uses the Admin SDK, needs
`GOOGLE_APPLICATION_CREDENTIALS` pointed at a service account key).

### Testing the live map

The live map needs a second moving hiker to actually demonstrate, and this project has
one physical phone. `npm run simulate -- --group=<groupId> --members=2 --trail=lions-head`
uses the Admin SDK to make one or two fake party members walk the trail's route,
writing real `groups/{id}/positions/{uid}` documents every 5 seconds, so the map,
staleness handling, and battery/check-in alerts all have something real driving them.
It is a test harness, not a hidden feature: it needs the same credentials as
`npm run seed`, adds the simulated members to the group's `memberIds` for the duration,
and removes them again (and deletes their position docs) on Ctrl+C.

## Screens

Twelve screens, all navigable:

| Route                   | Screen       | What it does today                                                   |
| ----------------------- | ------------ | -------------------------------------------------------------------- |
| `app/onboarding.tsx`    | Onboarding   | Three-slide intro to the concept                                     |
| `app/(auth)/login.tsx`  | Login        | Real Firebase email/password sign-in, with error messages            |
| `app/(auth)/signup.tsx` | Sign up      | Real Firebase account creation, sets your display name               |
| `app/(app)/index.tsx`   | App shell    | Horizontal pager across the five screens below, plus a tab bar       |
| ...Today                | Dashboard    | Active hike card, party size, water and trail stats                  |
| ...Discover             | Swipe deck   | Swipe up/down through the 24-trail catalog, tap for more detail      |
| ...Saved                | Saved trails | Firestore-backed, syncs live, survives closing the app               |
| ...Party                | Groups       | Active group, member list, map with static positions along the trail |
| ...You                  | Profile      | Your info, settings                                                  |
| `app/trail/[id].tsx`    | Trail detail | Full trail info, map with the route drawn, save toggle               |
| `app/group/create.tsx`  | Create group | Form, modal presentation                                             |
| `app/group/join.tsx`    | Join group   | Invite-code form, modal presentation                                 |
| `app/safety.tsx`        | Safety       | Static hiking and location-sharing tips                              |

## Why I built it this way

- **Expo SDK 54, not the newest one.** Apple's App Store review of the Expo Go app lags
  new SDK releases by months, so pinning to whatever's actually published avoids "this
  project needs a newer Expo Go" errors on a real phone.
- **Expo Router** for file-based navigation, mostly because it gives an auth stack and
  modals almost for free, and the file layout in `app/` doubles as the route map.
- **A pager instead of a tab bar** for the main shell (`app/(app)/index.tsx`), because
  the pitch was built around swiping between screens, not tapping icons. There's still a
  visible tab bar underneath, since a gesture with no visible fallback isn't
  discoverable.
- **react-native-maps** for the trail routes and party positions. It ships inside Expo
  Go, so no custom dev build is needed just to see a map.
- **gesture-handler + reanimated** power the swipe deck (`src/components/SwipeDeck.tsx`)
  and are how the gesture-first idea and the animation requirement both get covered by
  the same feature.
- **Firebase**, because the brief requires it. Auth and saved trails are wired up for
  real (`src/lib/auth.ts`, `src/state/AppState.tsx`); the rest of the app still runs on
  the static data in `src/data/`, see the table below for exactly what's real.
- **React Context, no Redux.** State is small enough right now (a user, some saved
  trail ids, an active group) that a reducer library would just be overhead.

## Data model (Firestore)

`users/{uid}/savedTrails` is the one collection actually wired to the UI right now. The
rest is designed and covered by rules tests, but nothing in the app writes to it yet.

```
users/{uid}
  displayName, email, photoURL, hydrationGoalMl, activeGroupId, createdAt

users/{uid}/savedTrails/{trailId}
  savedAt, notes

trails/{trailId}
  name, difficulty, distanceM, elevationGainM, region,
  description, photoUrl, location: { latitude, longitude }, path: { latitude, longitude }[]

groups/{groupId}
  name, trailId, ownerId, memberIds[], active, inviteCode, startedAt, endedAt

groups/{groupId}/positions/{uid}
  position: { latitude, longitude }, accuracy, batteryLevel, moving, updatedAt

inviteCodes/{code}
  groupId, active
```

`savedTrails` sits under `users` since it's a natural one-to-many and keeps the rules
simple. Party positions live under their group rather than in their own top-level
collection, so a single listener can return the whole party at once, and the rules can
pin a write to whoever made it. `inviteCodes` is a small top-level mirror of
`{code: groupId}`: `groups/{gid}` is member-read-only, so someone joining by invite
code (who is by definition not yet a member) can't query groups directly by code
without it. More detail in `docs/specs/2026-08-03-trail-design.md`, my original design
doc for this.

## Security rules

This app shares your location, so the Firestore rules aren't an afterthought, they're
the actual thing standing between "my party can see me" and "anyone can see me." They
have their own test suite, `backend/rules.test.ts`, run against the Firebase emulator in
CI.

- `users/{uid}` and `users/{uid}/savedTrails/**`: only that user can read or write it.
- `trails/**`: any signed-in user can read, nobody can write from the client (the seed
  script uses the Admin SDK, which bypasses rules entirely).
- `groups/{gid}`: members can read, any signed-in user can create one, only the owner
  can update it, except joining, which can only add the caller's own uid to the member
  list.
- `groups/{gid}/positions/{uid}`: group members can read, and you can only write your
  own position, and only while you're still a member.
- `inviteCodes/{code}`: any signed-in user can read or create one; only the owner of
  the group it points at can update it (to deactivate the code when a hike ends), and
  even then only the `active` field can move.

Storage has its own rules file, `backend/storage.rules`, covering `avatars/{uid}`: any
signed-in user can read (they're profile photos, not secrets), only the account
matching `{uid}` can write its own, capped at 5MB and image content types only.

## What's actually working vs mocked

I'd rather be upfront about this than dress it up. Two things are wired to real
Firebase right now, auth and saved trails; everything else in the app still runs on the
static data in `src/data/`.

| Working                                            | Static for now                        | Not built yet                      |
| -------------------------------------------------- | ------------------------------------- | ---------------------------------- |
| Navigation across all 12 screens                   | Group membership and party positions  | Live position sharing (10s target) |
| Firebase email/password auth, session persists     | Water/hydration stat on the dashboard | Background location tracking       |
| Saved trails, real Firestore CRUD, survives reload |                                       | Local hydration/rest reminders     |
| Swipe-to-save/skip gesture (has a unit test)       |                                       |                                    |
| Trail search, maps, drawn routes                   |                                       |                                    |
| Firestore security rules (tested in CI)            |                                       |                                    |

## Where this is headed

Roughly the plan I pitched at the start, five slices:

| Slice | Scope                                                           | Where it's at                                       |
| ----- | --------------------------------------------------------------- | --------------------------------------------------- |
| 0     | Repo setup, CI, Firestore rules + tests, design tokens          | Done                                                |
| 1     | Firebase Auth, onboarding, session persistence                  | Done                                                |
| 2     | Trail seed, swipe discovery, saved-trails CRUD                  | Done                                                |
| 3     | Groups, background tracking, live party map                     | UI's there, live tracking and sync are next         |
| 4     | Calm dashboard, hydration/rest notifications, animation polish  | Dashboard UI's there, notifications are next        |
| 5     | Safety content, real app icon, accessibility pass, a demo video | Safety screen and icons are there, the rest is next |

## Conventions

Trunk-based: short-lived `feat/*` / `fix/*` / `chore/*` branches that merge straight
into `main`. Commits follow
[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
`chore:`, and so on), enforced by a commit-msg hook, and a pre-commit hook runs ESLint
and Prettier on whatever's staged.

## Docs

- [`docs/specs/2026-08-03-trail-design.md`](./docs/specs/2026-08-03-trail-design.md): my
  original design doc, with the full reasoning behind the architecture and what I
  deliberately left out.
- `docs/`: the assignment brief and my pitch deck.

## License

[MIT](./LICENSE)
