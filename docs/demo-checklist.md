# Demo checklist

Everything that needs a real phone. The code, typecheck and tests were all checked without
one, so anything about feel, maps or notifications is only proven once you've done this.

## Carry on from your PC

If the repo is already on that PC:

```bash
git fetch origin
```

```bash
git switch feature/trail-polish
```

```bash
git pull --ff-only
```

```bash
cd frontend
```

```bash
npm ci
```

```bash
npm start
```

If it isn't there yet, start with these two, then run `npm ci` and `npm start`:

```bash
git clone -b feature/trail-polish https://github.com/victordupreez0/Trail.git
```

```bash
cd Trail/frontend
```

Scan the QR code with Expo Go on the same WiFi. On WiFi that blocks phones from reaching
the computer, use `npm run start:tunnel`.

Rules tests need Java 21 on that PC:

```bash
winget install EclipseAdoptium.Temurin.21.JDK
```

## Before the demo

1. Set up simulator credentials on the PC you'll present from, either a service account key
   in `GOOGLE_APPLICATION_CREDENTIALS` or `gcloud auth application-default login`. It won't
   run without them, and it writes to the live project, so try it once beforehand.
2. Sign in and open the Party tab. If an old hike is showing, end it. Old demo hikes left
   running can hide a new one.
3. On the You tab, set **Water every** to **1**. That option only exists when running from
   `npm start`.
4. To see the intro again, use **Intro: Show again** on the You tab.

## Test the demo journey, in order

Tick each one on your own phone.

- [ ] **Sign in.** A wrong password shows a message. The right one moves on with no flicker.
- [ ] **Onboarding.** Appears after first sign-in. Swipe through and the hills drift. **Get
      started** lands on Today. Signing in again doesn't show it.
- [ ] **Discover: save.** Swipe up. The next card appears with no flash of the old card. Do
      it 5 times and check no trail was skipped: the "left" count drops by one each time.
- [ ] **Discover: skip and tap.** Swipe down to skip. Tap a card to open it. Swipe sideways
      on a card and the tab changes without the card moving.
- [ ] **Discover: end.** Reach the end and tap **See skipped trails again**.
- [ ] **Note.** On Saved, tap the pencil and type. "Saved" appears. The keyboard doesn't
      cover the text. Type again and leave at once, then come back: the note is there.
- [ ] **Start a hike.** Name it, pick a trail, tap **Start hike**, then **Start anyway** when
      told you're not at the trailhead. Allow notifications and location. You land on Party.
- [ ] **Back button.** On Party, Android back or an iOS swipe doesn't reveal a second copy of
      the app.
- [ ] **Share the code.** Tap the invite code. The share sheet opens with the code in it.
- [ ] **Second hiker.** Run `npm run simulate -- --code=YOURCODE` from `frontend/`. Sam and
      Nadia appear within about 10 seconds, close to you, with avatars showing their initials.
- [ ] **Live map.** Markers glide rather than jump. Breadcrumb lines grow behind them. Drag
      the map sideways: it pans and the tab doesn't change. Tap the locate button to reframe.
- [ ] **Stale alert.** About 2.5 minutes after starting the simulator, "Sam hasn't checked in
      for 2 minutes" appears on Party and Today, and Sam's marker dims. It clears when Sam
      returns.
- [ ] **Water reminder.** About a minute after starting the hike, a calm notification arrives.
      Tap the bottle on Today and the water rises.
- [ ] **End hike.** Tap **End hike**, confirm. The summary appears with the time, trail length
      and party size. **Done** returns to Party, showing no active hike.
- [ ] Press Ctrl-C in the simulator terminal.

## Check once outside the demo

- [ ] Remove two saved trails within 4 seconds, by swipe and by the bin button. Both stay gone.
      Undo works on the most recent one.
- [ ] Turn location off for Expo Go during a hike. The banner appears. Turn it back on in
      Settings and return: tracking resumes without a restart.
- [ ] Turn on airplane mode and swipe a card, then turn it off again. Nothing crashes.
- [ ] Create a new account. The name shows on Today straight away, not "Hiker".
- [ ] Change your photo on the You tab.
- [ ] Sign in as the demo admin and create, edit and delete a test trail.
- [ ] Log out and in again.
- [ ] Turn on your phone's Reduce Motion setting. Cards and markers stop animating.
- [ ] Open Safety and tap the rescue number. Check that number is still current before relying
      on it. It wasn't changed or verified in this work.

## Couldn't be verified without a device

- How the swipe deck, card change and tab swiping feel, especially sideways drags.
- Whether saved-row swipes compete with tab swiping. The bin button is there either way.
- Map rendering, marker gliding, marker initials and breadcrumb visibility.
- Whether notifications arrive in Expo Go on your phone and OS version.
- The keyboard staying clear of notes on your phone's screen size.
- The sign-in, intro and app redirects and fades on a real launch.
- Photo upload, the share sheet, phone dialer and Settings links.
- The simulator against the live project. It was only run against the local emulator.

## Screenshots and GIFs to capture

Save them in `docs/media/` with these names, then add them to the README.

### Screenshots

| File                 | What to show                                                   |
| :------------------- | :------------------------------------------------------------- |
| `01-login.png`       | Sign in screen, empty                                          |
| `02-onboarding.png`  | Onboarding, middle slide                                       |
| `03-today-rest.png`  | Today with no hike running                                     |
| `04-today-hike.png`  | Today during a hike: hero photo, water bottle, party           |
| `05-discover.png`    | Discover with a card on top                                    |
| `06-trail.png`       | Trail detail: photo, stats and route map                       |
| `07-saved-note.png`  | Saved with a note open                                         |
| `08-new-hike.png`    | New hike screen with a trail selected                          |
| `09-party-map.png`   | Party: map with 3 markers and breadcrumbs, invite code visible |
| `10-stale-alert.png` | Party or Today showing the stale alert, with a dimmed marker   |
| `11-reminder.png`    | Water reminder notification on screen                          |
| `12-summary.png`     | Hike summary                                                   |
| `13-profile.png`     | You tab: goal and reminder settings                            |
| `14-safety.png`      | Safety screen                                                  |
| `15-admin.png`       | Admin screen, signed in as the demo admin                      |

### GIFs

| File               | What to record                                        |
| :----------------- | :---------------------------------------------------- |
| `swipe-save.gif`   | Swiping 3 cards up and down on Discover               |
| `note.gif`         | Opening a note, typing, seeing "Saved"                |
| `share-code.gif`   | Starting a hike and tapping the invite code           |
| `live-map.gif`     | 15 seconds of markers gliding and breadcrumbs growing |
| `water-bottle.gif` | Tapping the bottle so the water rises                 |
| `end-hike.gif`     | End hike, confirm, and the summary animation          |
