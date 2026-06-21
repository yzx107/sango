# Automated Development Loop

Sango uses GitHub and `.ai-bridge` files as the coordination plane for ChatGPT, Codex, and Antigravity. The goal is to reduce manual prompting by making the next owner, file scope, asset queue, and validation evidence explicit.

## Control Plane

- `PROJECT_BRIEF.md`: product goal, inspiration boundary, and anti-copying rules.
- `AGENTS.md`: agent roles, file ownership, and workflow rules.
- `.ai-bridge/current-plan.md`: current sprint plan and handoff notes.
- `.ai-bridge/loop-state.md`: current state machine.
- `.ai-bridge/file-locks.md`: file ownership rules.
- `.ai-bridge/workers/heartbeats/`: worker heartbeat declarations for capability and availability.
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
- `.ai-bridge/schemas/worker-heartbeat.schema.json`

The schemas describe the contract. They do not require a cloud service. Local scripts may validate the parts they need.

## Agent Responsibilities

### Codex

- Owns gameplay, Three.js integration, tests, CI, and automation scripts.
- Creates `AssetRequest` files when visual assets are needed.
- May generate or convert images only when the request selects `codex-native`, `openai-api`, or `procedural`, or when Codex claims a `provider=auto` request through a heartbeat.
- Validates completed assets with `npm run assets:validate`.

### Antigravity

- Owns local art/UI generation and conversion.
- Reads `.ai-bridge/assets/pending/*.json`.
- May claim `provider=auto` requests when its heartbeat advertises the needed provider and asset type.
- Writes generated files to `public/assets/generated/`.
- Updates `public/assets/generated/manifest.json` with file, purpose, size, format, mime, sha256, and prompt summary.
- Moves requests to completed or failed.

### ChatGPT

- Reviews GitHub state, issues, PRs, and `.ai-bridge` files remotely.
- Sets direction and asks for revisions through issues, reviews, or plan/status updates.

## Asset Flow

1. Codex or ChatGPT creates `.ai-bridge/assets/pending/asset-*.json`.
2. For `provider=auto`, the request starts with `owner=unassigned`.
3. A capable idle worker advertises itself in `.ai-bridge/workers/heartbeats/*.json`.
4. The worker claims the request by moving it to `in_progress` and setting `owner`, `claimedBy`, `claimedAt`, `heartbeatId`, and `selectedProvider`.
5. The worker creates or edits the asset.
6. The worker updates `public/assets/generated/manifest.json`.
7. The worker moves request to `completed` or `failed`.
8. Codex runs:

```bash
npm run assets:validate
npm run queue:validate
npm run build
```

9. If UI/render changed, Codex also runs browser verification.

Supported asset providers:

- `auto`
- `codex-native`
- `antigravity-native`
- `openai-api`
- `gemini-api`
- `procedural`
- `manual`

Current image output formats are PNG and JPEG. WebP is intentionally unsupported until a strict dimension parser is added.

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

## Queue Validation

`npm run queue:validate` verifies:

- Four queue families contain only JSON matching their schemas.
- Asset requests follow provider/owner rules.
- `provider=auto` pending requests use `owner=unassigned`.
- Claimed auto requests include heartbeat and selected provider fields.
- Worker heartbeat JSON matches declared capability schema.

## Local Skill Fork

Use the repo-local skill first:

```text
skills/threejs-game/SKILL.md
```

This fork removes Gemini as a hard dependency. All image needs become `AssetRequest` files. Codex and Antigravity can both act as image workers when their provider capability matches the request.

## Standard Commands

Start loop:

```bash
npm run agent:loop
```

Validate automation and assets:

```bash
npm run agent:check
npm run queue:validate
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

## PR Review Gate

Agents must work on branches named:

```text
agent/<task-id>-<owner>
```

They must open a PR and wait for remote review. Agents must not directly push to `main`.
