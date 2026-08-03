# Contributing

## One-time repo setup (admin)

These are GitHub repo-settings changes, not something a CI file can do — do them once,
in the GitHub UI, under Settings:

1. **Branch protection** on `main`: Settings → Branches → require a pull request before
   merging, require the CI status check to pass, no direct pushes.
2. **Add the lecturer as a collaborator** (per the assessment brief).

## Branching

Trunk-based. `main` is always deployable and is protected — no direct pushes.

1. Branch off `main`: `feat/<slice-name>`, `fix/<bug>`, `chore/<task>`.
2. Keep it short-lived — one slice of work, one branch, one PR.
3. Open a PR into `main`. It merges once CI is green.
4. Squash merge, delete the branch.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by a commit-msg
hook:

```
<type>: <short summary>

feat:     a new feature
fix:      a bug fix
chore:    tooling, deps, config — no source change
docs:     documentation only
test:     adding or fixing tests
refactor: code change that's not a fix or a feature
```

Examples: `feat: add trail search swipe cards`, `fix: stop background tracking on group leave`.

## Tests

Co-locate tests next to the code they cover — **except under `app/`**. Expo Router
treats every file in `app/` as a route (its `require.context` only excludes `+api`,
`+html`, `+middleware`), so a `.test.tsx` there gets bundled into the production build
and pulls test-only packages along with it. Route component tests live in `__tests__/`
at the repo root instead (see `__tests__/index.test.tsx`).

## Before committing

A pre-commit hook runs ESLint + Prettier on staged files automatically. To run everything
by hand:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:rules   # needs the Firebase emulator running
```

## Pull requests

Use the PR template. Link the slice/issue it covers, describe what changed and how you
tested it. CI (typecheck, lint, tests, rules tests) must pass before merge.
