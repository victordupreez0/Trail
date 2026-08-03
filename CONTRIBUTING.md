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
