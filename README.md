# Trail

A cross-platform mobile app for hikers: discover trails, share live location with your
party, and stay looked-after on the mountain, through a calm, gesture-first interface.

> Work in progress. Feature docs, screenshots, and the demo video land here in the final
> submission slice; see `docs/specs/` for the design in the meantime.

## Stack

- [Expo](https://expo.dev) (React Native + TypeScript, strict mode)
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- [Firebase](https://firebase.google.com) for Auth and Firestore
- [react-native-maps](https://github.com/react-native-maps/react-native-maps),
  [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) +
  [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)

Background location tracking requires a custom **Expo dev client**. This app does not
run in Expo Go.

## Setup

```bash
npm install
cp .env.example .env   # fill in your Firebase project's web config
npx expo run:android   # or: npx expo run:ios (macOS only)
```

## Scripts

| Command              | Does                                                           |
| -------------------- | -------------------------------------------------------------- |
| `npm start`          | Start the Metro dev server                                     |
| `npm run typecheck`  | `tsc --noEmit`                                                 |
| `npm run lint`       | ESLint                                                         |
| `npm test`           | Jest unit/component tests                                      |
| `npm run test:rules` | Firestore security rules tests (needs the Firebase emulator)   |
| `npm run seed`       | Seed the Firestore emulator/project with the curated trail set |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching, commit conventions, and the PR
flow.

## License

[MIT](./LICENSE)
