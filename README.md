<div align="center">

# Trail.

### Leave the worry at the trailhead.

A calm companion for hiking with people you care about. Find a trail, share your live
location with your party, and let everyone stop wondering whether you are okay.

<br>

![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

![Reanimated](https://img.shields.io/badge/Reanimated-4.1-001A72?style=for-the-badge&logo=react&logoColor=white)
![Google Maps](https://img.shields.io/badge/Maps-1.20-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-tested-C21325?style=for-the-badge&logo=jest&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

</div>

---

## Contents

- [The problem](#the-problem)
- [Where the idea came from](#where-the-idea-came-from)
- [What it does](#what-it-does)
- [Demo video](#demo-video)
- [Built with](#built-with)
- [Run the demo](#run-the-demo)
- [How it is put together](#how-it-is-put-together)
- [Testing](#testing)
- [Deliberate simplifications](#deliberate-simplifications)
- [What is next](#what-is-next)
- [Conclusion](#conclusion)
- [Acknowledgements](#acknowledgements)
- [Licence and author](#licence-and-author)

## The problem

Time on a trail is one of the best ways to lower stress. A hum of small worries chips
away at exactly the reset you came for.

> Am I still on the path? Is everyone in my group okay? Have I had enough water?
> Is my family worrying about me?

Trail's job is to quietly absorb that load, so the hike can do what hiking is for.

## Where the idea came from

Three cards, drawn at random in week one. Rather than fight them, Trail makes all three
pull in the same direction.

| Card                          | How Trail answers it                                                                                                                                                                      |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reduce Stress**             | The lens for every decision. The app never shouts, never nags, and does less rather than more.                                                                                            |
| **Geolocation**               | The engine. Live party positions on a shared map, updated every ten seconds with a heartbeat so nobody's dot goes quietly stale.                                                          |
| **No Traditional UI Buttons** | Gesture first. Swipe to save a trail, swipe to remove one, flick between screens. A real button appears only where a tap has to be unambiguous: start a hike, save a trail, end tracking. |

On that last one: there is a tab bar, and that is a deliberate call. Gestures are the
shortcut, the tab bar is the map. An app people open one-handed on a mountain does not
get to hide its navigation, and Usability matters as much to me as the constraint does.

## What it does

**Find a trail.** Swipe up to save, down to skip. Every trail has a photo, a distance,
an elevation gain, a difficulty and a drawn route on a map.

**Keep your notes.** Save a trail and write yourself a note on it. Bring the 3L bladder,
water at the halfway hut. Swipe left to remove one, with four seconds to undo.

**Hike together.** Start a hike, share a six character code, and everyone who joins
appears on the same map. Markers update with each live fix, and each
person leaves a fading breadcrumb trail behind them. If somebody has not checked in for
a while their avatar dims and their row reads "last seen 4m ago" rather than pretending
the pin is current.

**Stay looked after.** The Today screen shows your party, your water, and an alerts strip
that stays empty when nothing is wrong. When something is, it says so plainly: Sam has
not checked in for two minutes. Nadia's battery is at 12%.

**Drink water.** Calm reminders while a hike is running, on your own schedule. "Time for
water", not "REMINDER: HYDRATE!".

**Make it yours.** Email sign up with a password reset, a three slide onboarding that
shows once per account, and a profile photo you can change.

## Demo video

<!-- TODO: add the demo recording here, as a link or an embedded video. -->

_Coming soon._

## Built with

|                                                                       | What                                        | Why                                                                                                              |
| :-------------------------------------------------------------------- | :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| <img src="https://cdn.simpleicons.org/expo/000000/FFFFFF" width="18"> | **Expo SDK 54 + React Native 0.81**         | Cross platform from one codebase, and Expo Go means anyone can run this from a QR code with no native build.     |
| <img src="https://cdn.simpleicons.org/typescript/3178C6" width="18">  | **TypeScript, strict**                      | Compile time safety against the shapes coming back from Firestore.                                               |
| <img src="https://cdn.simpleicons.org/firebase/FFCA28" width="18">    | **Firebase Auth**                           | Email and password, with sessions persisted so you do not sign in twice.                                         |
| <img src="https://cdn.simpleicons.org/firebase/FFCA28" width="18">    | **Cloud Firestore**                         | Real time listeners are what make a shared party map work at all.                                                |
| <img src="https://cdn.simpleicons.org/firebase/FFCA28" width="18">    | **Firebase Storage**                        | Profile photos, with size and content type enforced in the rules.                                                |
| <img src="https://cdn.simpleicons.org/googlemaps/4285F4" width="18">  | **react-native-maps**                       | Trail routes, live party positions, breadcrumb trails.                                                           |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="18">       | **Reanimated 4 + Gesture Handler**          | One library earns two requirements: it powers the gesture first constraint and the brief's interactive tweening. |
| <img src="https://cdn.simpleicons.org/expo/000000/FFFFFF" width="18"> | **expo-location / notifications / battery** | Foreground tracking, local reminders, battery in the party list.                                                 |
| <img src="https://cdn.simpleicons.org/jest/C21325" width="18">        | **Jest + Firebase Rules Unit Testing**      | Unit tests for the pure logic, and the security rules tested against the emulator in CI.                         |

## Run the demo

> **Ready to run.** The committed `frontend/.env` is intentional for assessment: it contains
> Firebase’s public mobile/web client configuration, so a lecturer can clone and test
> the real app without having to create a Firebase project first. It contains no
> service-account credential, private key, or production secret.

You need **Node 22+** and **Expo Go** on your phone.

```bash
git clone https://github.com/victordupreez0/Trail.git
cd Trail
cd frontend
npm install
npm start
```

Scan the QR code with Expo Go, on the same WiFi as your computer. That is the whole
setup. The checked-in `frontend/.env` contains the demo Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDO8uv6YKp7nmV_CHTTlRddZi-1sTtX4No
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=trail-e33af.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=trail-e33af
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=trail-e33af.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1010115514705
EXPO_PUBLIC_FIREBASE_APP_ID=1:1010115514705:web:cbda63f6cbda61419b8370
```

The app talks to a database that is already seeded with trails and has its rules
published.

### Demo admin account

Use this shared account to open **Profile → Admin → Manage trails** during the demo:

```text
Email:    admin@gmail.com
Password: admin123
```

This is a hand-in-only account. Do not reuse its password anywhere else.

On WiFi that blocks phone to laptop traffic, which is most campus networks, use
`npm run start:tunnel` instead.

> **Why committing `.env` is normally bad practice:** It is. This exception exists
> solely to make the assessment demo reproducible. Firebase web API keys are public
> client identifiers; access is enforced by the Firestore and Storage rules in
> `backend/`. No service-account key, Admin SDK credential, or private secret is in
> this repository. For any real project, `frontend/.env` stays untracked.

<details>
<summary><b>Running it against your own Firebase instead</b></summary>

<br>

In the [Firebase console](https://console.firebase.google.com): create a project, add a
**Web app**, enable **Email/Password** under Authentication, create a **Cloud Firestore**
database, and create a **Storage** bucket.

Replace the six demo values in `frontend/.env` with the matching Web app values from
your Firebase project settings.

Publish the rules. This step is not optional: Firestore denies every read and write by
default, so without it nothing saves and the app looks broken.

```bash
cd frontend
npx firebase login
npx firebase --config ../firebase.json deploy --only firestore:rules,firestore:indexes,storage
npm run seed   # needs GOOGLE_APPLICATION_CREDENTIALS pointing at a service account key
```

</details>

### Trying the live map on your own

A shared party map needs more than one person on it. `backend/simulate-hiker.ts` is a
test harness that walks simulated hikers along a trail route, writing positions to
Firestore every five seconds, so the live map can be demonstrated with a single phone.

Start a hike in the app, then run this from `frontend/` with the invite code shown on
the Party tab:

```bash
npm run simulate -- --code=ABC123
```

The script writes with the Admin SDK, so it needs Google credentials for the project:
either `GOOGLE_APPLICATION_CREDENTIALS` pointing at a service account key, or
`gcloud auth application-default login`.

The hikers follow your hike's trail. If you are not near that trail, they walk the same
route starting from where you are, so everyone fits on one map. After 30 seconds one of
them goes quiet for three minutes, so the stale alert fires at about the two minute mark
and clears when they come back. Ctrl-C cleans up after itself.

Optional flags: `--members=2`, `--trail=<id>`, `--speed=3`, `--quiet-after=30` and
`--quiet-for=180`, both in seconds.

### Other commands

```bash
cd frontend
npm run typecheck     # tsc, strict
npm run lint          # eslint
npm test              # unit tests
npm run test:rules    # security rules against the Firestore emulator (needs Java 21)
```

## How it is put together

```
frontend/     self-contained Expo app
  app/          screens, one file per route (expo-router)
  src/          components, screens, hooks, Firebase, state and theme
  assets/       icons, splash art and bundled trail photos
  video/        place the demo recording here
backend/      security rules, rules tests, seed and simulation scripts
docs/         the brief, my annotated pitch, design spec
```

### Data model

```
users/{uid}                        displayName, email, photoURL, hydrationGoalMl,
  └── savedTrails/{trailId}          waterMl, reminder settings
                                     savedAt, notes

trails/{trailId}                   name, difficulty, distanceM, elevationGainM,
                                     location, path

groups/{groupId}                   name, trailId, ownerId, memberIds[], active,
  └── positions/{uid}                inviteCode, startedAt, endedAt
                                     position, accuracy, batteryLevel, moving, updatedAt

inviteCodes/{CODE}                 groupId, active
```

That last collection is there for a specific reason. A group can only be read by its
own members, so somebody joining by code cannot query groups by `inviteCode`, because
they are not a member yet. `inviteCodes` is a small public mirror that gets them from a
code to a group id without opening the group itself up to the world.

```mermaid
erDiagram
    USERS ||--o{ SAVED_TRAILS : keeps
    TRAILS ||--o{ SAVED_TRAILS : "appears in"
    USERS ||--o{ GROUPS : owns
    USERS }o--o{ GROUPS : "is a member of"
    TRAILS ||--o{ GROUPS : "is hiked by"
    GROUPS ||--o{ POSITIONS : tracks
    USERS ||--o{ POSITIONS : reports
    GROUPS ||--|| INVITE_CODES : "is joined with"

    USERS {
        string uid PK
        string displayName
        string email
        string photoURL
        number hydrationGoalMl
        number waterMl
        string waterDate
        boolean remindersEnabled
        number waterIntervalMin
        number restIntervalMin
        timestamp createdAt
    }
    SAVED_TRAILS {
        string trailId PK
        timestamp savedAt
        string notes
    }
    TRAILS {
        string id PK
        string name
        string difficulty
        number distanceM
        number elevationGainM
        string region
        string description
        string photoUrl
        map location
        array path
    }
    GROUPS {
        string id PK
        string name
        string trailId FK
        string ownerId FK
        array memberIds
        boolean active
        string inviteCode FK
        timestamp startedAt
        timestamp endedAt
    }
    POSITIONS {
        string uid PK
        string displayName
        map position
        number accuracy
        number batteryLevel
        boolean moving
        timestamp updatedAt
    }
    INVITE_CODES {
        string code PK
        string groupId FK
        boolean active
    }
```

### Security

Location data deserves rules you can actually trust, so they are tested rather than
assumed. `backend/rules.test.ts` runs eighteen cases against the Firestore emulator in
CI, covering things like: a non-member cannot read a group, a member cannot write
somebody else's position, and only a hike's owner can retire its invite code.

## Testing

**135 unit tests** in 16 suites and **18 security rules tests** against the Firestore
emulator, run in CI on every pull request and every push to `main`.

| Scope                                    | Statements | Branches | Functions | Lines  |
| :--------------------------------------- | :--------- | :------- | :-------- | :----- |
| `src/lib`, every file                    | 80.55%     | 76.63%   | 70%       | 80.79% |
| Whole app, every file in `app` and `src` | 39.8%      | 30.57%   | 36.55%    | 40.09% |

The second row is low because most screens are drawn by native maps, gestures and
animation, which unit tests cannot exercise. Those are checked by hand on a phone. The
screen level tests cover what can break quietly: the swipe deck, notes, app state and
the Party screen.

To reproduce the numbers from `frontend/`:

```bash
npm test -- --coverage
```

```bash
npm test -- --coverage "--collectCoverageFrom=src/**/*.{ts,tsx}" "--collectCoverageFrom=app/**/*.tsx"
```

## Deliberate simplifications

I would rather name these than have them look like bugs.

- **Tracking is foreground only.** Background location needs a custom native build, and
  staying on Expo Go so anyone can run this from a QR code was worth more to me.
- **Only the hike owner can end a hike.** The rules let a person add their own uid to a
  group and never remove one, so there is no leave path to offer without loosening them.
- **Trail routes are simplified polylines**, not recorded GPX tracks.

## What is next

Plant and bird identification from a photo, offline trail maps, and a full survival tips
library.

## Conclusion

### What went well

TODO

### What I would do differently

TODO

### What I learned

TODO

## Acknowledgements

- **Trail photography** from [Unsplash](https://unsplash.com), used under the Unsplash
  licence. Images are bundled locally so they render with no network on the mountain.
- **Icons** from [Ionicons](https://ionic.io/ionicons) via `@expo/vector-icons`.
- **[Expo](https://docs.expo.dev)** and **[React Native](https://reactnative.dev)**
  documentation, which is where the app icon, splash screen and notification work came
  from.
- **[Firebase documentation](https://firebase.google.com/docs)**, particularly the
  security rules guide and the rules unit testing library.
- **[Reanimated](https://docs.swmansion.com/react-native-reanimated/)** and
  **[Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** docs
  by Software Mansion, for the gesture and animation work.
- **Trail data** for the Cape Town routes cross referenced against
  [SANParks](https://www.sanparks.org) and public trail guides.
- **AI tools:** [Claude Code](https://claude.com/claude-code) by Anthropic, used for the
  final bug audit, fixes, tests and documentation.
  <!-- TODO: list any other AI tools you used, and for what. -->
- **DV300 lecturer:** Tsungai Katsuro.

## Licence and author

Released under the [MIT Licence](LICENSE).

Built by **Victor du Preez**: [victor.dupreez0@gmail.com](mailto:victor.dupreez0@gmail.com)
· [LinkedIn](https://www.linkedin.com/in/victor-du-preez-47475a321)

---

<div align="center">

**Victor du Preez** · Student 241250<br>
Interactive Development 300 · Semester 2 · Theme 3<br>
Open Window · 2026

</div>
