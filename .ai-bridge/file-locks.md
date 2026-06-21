# Sango File Locks

Use this file to avoid agents overwriting each other.

## Current Locks

### Antigravity Local Art/UI Agent

Allowed:

- `public/assets/generated/`
- `public/assets/generated/manifest.json`
- `.ai-bridge/assets/pending/`
- `.ai-bridge/assets/in_progress/`
- `.ai-bridge/assets/completed/`
- `.ai-bridge/assets/failed/`
- `.ai-bridge/assets/schema.md`
- `.ai-bridge/workers/heartbeats/`
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
- `.ai-bridge/schemas/`
- `docs/AUTOMATED_DEVELOPMENT.md`
- `skills/threejs-game/`

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
- `docs/`
- `skills/`

Avoid during Antigravity art pass:

- `public/assets/generated/`
- `.ai-bridge/assets/in_progress/`
- `.ai-bridge/workers/heartbeats/*.json` owned by another active worker

### ChatGPT Remote Reviewer

Allowed:

- Read all files on GitHub.
- Comment through issues, review notes, or plan/status changes when explicitly requested.

Locked:

- Local-only uncommitted files unless the local agent has pushed them.

## Lock Rules

- If a file is locked for your role, do not edit it.
- If a locked file must change, update `.ai-bridge/current-plan.md` first with the reason and next owner.
- New image needs must be expressed as `AssetRequest` files in `.ai-bridge/assets/pending/`; agents must not overwrite in-progress asset outputs.
- `provider=auto` pending requests remain `owner=unassigned` until claimed by a worker with a matching heartbeat.
- Antigravity must update `public/assets/generated/manifest.json` with `mime` and `sha256` whenever a generated asset changes.
- Agents must work on `agent/<task-id>-<owner>` branches and open PRs; do not directly push `main`.
- Generated build/test output must not be committed:
  - `dist/`
  - `artifacts/`
  - `test-results/`
  - `playwright-report/`
  - `node_modules/`
