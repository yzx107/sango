# Sango File Locks

Use this file to avoid agents overwriting each other.

## Current Locks

### Antigravity Local Art/UI Agent

Allowed:

- `public/assets/generated/`
- `public/assets/generated/manifest.json`
- `src/styles.css`
- `.ai-bridge/agent-status.md`
- `.ai-bridge/loop-state.md`

Avoid unless explicitly requested:

- `src/ui/`

Locked:

- `src/game/`
- `src/data/`
- `src/render/`
- `tests/`
- `scripts/`

### Codex Game Development Agent

Allowed:

- `src/game/`
- `src/render/`
- `src/data/`
- `src/ui/`
- `tests/`
- `scripts/`
- `README.md`
- `PROJECT_BRIEF.md`
- `AGENTS.md`
- `.github/`
- `.ai-bridge/`

Avoid during Antigravity art pass:

- `public/assets/generated/`

### ChatGPT Remote Reviewer

Allowed:

- Read all files on GitHub.
- Comment through issues, review notes, or plan/status changes when explicitly requested.

Locked:

- Local-only uncommitted files unless the local agent has pushed them.

## Lock Rules

- If a file is locked for your role, do not edit it.
- If a locked file must change, update `.ai-bridge/current-plan.md` first with the reason and next owner.
- Generated build/test output must not be committed:
  - `dist/`
  - `artifacts/`
  - `test-results/`
  - `playwright-report/`
  - `node_modules/`
