# Automated Development Loop

Sango uses GitHub and `.ai-bridge` files as the coordination plane for ChatGPT, Codex, and Antigravity. The goal is to reduce manual prompting by making the next owner, file scope, asset queue, and validation evidence explicit.

## Control Plane

- `PROJECT_BRIEF.md`: product goal, inspiration boundary, and anti-copying rules.
- `AGENTS.md`: agent roles, file ownership, and workflow rules.
- `.ai-bridge/current-plan.md`: current sprint plan and handoff notes.
- `.ai-bridge/loop-state.md`: current state machine.
- `.ai-bridge/file-locks.md`: file ownership rules.
- `.github/ISSUE_TEMPLATE/agent-task.yml`: GitHub task entrypoint.
- `.github/pull_request_template.md`: PR handoff and validation checklist.

## Queues

```text
.ai-bridge/tasks/pending/
.ai-bridge/tasks/in_progress/
.ai-bridge/tasks/completed/
.ai-bridge/tasks/failed/

.ai-bridge/assets/pending/
.ai-bridge/assets/in_progress/
.ai-bridge/assets/completed/
.ai-bridge/assets/failed/

.ai-bridge/reports/pending/
.ai-bridge/reports/in_progress/
.ai-bridge/reports/completed/
.ai-bridge/reports/failed/

.ai-bridge/reviews/pending/
.ai-bridge/reviews/in_progress/
.ai-bridge/reviews/completed/
.ai-bridge/reviews/failed/
```

## Schemas

- `.ai-bridge/schemas/task.schema.json`
- `.ai-bridge/schemas/asset-request.schema.json`
- `.ai-bridge/schemas/agent-report.schema.json`
- `.ai-bridge/schemas/review-request.schema.json`

The schemas describe the contract. They do not require a cloud service. Local scripts may validate the parts they need.

## Agent Responsibilities

### Codex

- Owns gameplay, Three.js integration, tests, CI, and automation scripts.
- Does not directly generate images.
- Creates `AssetRequest` files when visual assets are needed.
- Validates completed assets with `npm run assets:validate`.

### Antigravity

- Owns local art/UI generation and conversion.
- Reads `.ai-bridge/assets/pending/*.json`.
- Writes generated files to `public/assets/generated/`.
- Updates `public/assets/generated/manifest.json` with file, purpose, size, format, mime, sha256, and prompt summary.
- Moves requests to completed or failed.

### ChatGPT

- Reviews GitHub state, issues, PRs, and `.ai-bridge` files remotely.
- Sets direction and asks for revisions through issues, reviews, or plan/status updates.

## Asset Flow

1. Codex creates `.ai-bridge/assets/pending/asset-*.json`.
2. Antigravity moves it to `in_progress`.
3. Antigravity creates or edits the asset.
4. Antigravity updates `public/assets/generated/manifest.json`.
5. Antigravity moves request to `completed` or `failed`.
6. Codex runs:

```bash
npm run assets:validate
npm run build
```

7. If UI/render changed, Codex also runs browser verification.

## Asset Validation

`npm run assets:validate` verifies:

- Manifest JSON parses.
- Every manifest asset file exists.
- Magic bytes identify supported image type.
- MIME matches magic bytes.
- Dimensions match manifest.
- SHA-256 matches manifest.
- No unmanaged generated image exists outside manifest.
- Asset request target files are represented in manifest when completed.

## Local Skill Fork

Use the repo-local skill first:

```text
skills/threejs-game/SKILL.md
```

This fork removes Gemini as a hard dependency. All image needs become `AssetRequest` files for Antigravity or another asset worker.

## Standard Commands

Start loop:

```bash
npm run agent:loop
```

Validate automation and assets:

```bash
npm run agent:check
npm run assets:validate
```

Validate game:

```bash
npm run build
npm run validate:data
npm test
npm run verify:visual
```

Canvas verification:

```bash
npm run inspect:canvas
node scripts/inspect-threejs-canvas.mjs --mobile --out artifacts/canvas-inspection
```

## File Ownership Rules

Codex owns:

- `src/game/`
- `src/render/`
- `src/data/`
- `src/ui/`
- `tests/`
- `scripts/`
- `.github/`
- `.ai-bridge/`

Antigravity owns:

- `public/assets/generated/`
- `public/assets/generated/manifest.json`
- visual-only changes in `src/styles.css`

ChatGPT owns:

- remote review, issue text, PR review text, and direction.

If an agent needs to cross ownership boundaries, it must update `.ai-bridge/current-plan.md` first.
