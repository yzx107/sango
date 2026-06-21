# Sango Agent Loop State

This file is the shared state machine for low-interruption agent collaboration.

## State

- state: needs_review
- current_owner: ChatGPT Remote Reviewer
- next_owner: ChatGPT Remote Reviewer
- remote_reviewer: ChatGPT Remote Reviewer
- source_of_truth: GitHub main plus local `git status`
- last_validated_local_state: Antigravity provider=auto smoke asset verified by Codex
- updated_at: 2026-06-21 23:36 Asia/Shanghai

## State Meanings

- todo: task is described but no agent has started.
- in_progress: current owner is actively changing files.
- needs_art: Antigravity should produce or revise art/UI assets.
- needs_dev: Codex should integrate, fix, or extend game code.
- needs_review: ChatGPT should review GitHub diff and status files.
- blocked: progress needs a user decision or missing external input.
- done: task is complete and validated.

## Current Sprint

Goal: Review the completed provider=auto asset worker smoke test.

Current review task:

1. ChatGPT or the user reviews the completed provider=auto flow.
2. If the heartbeat, completed request, manifest, generated asset, and validation evidence are acceptable, approve the handoff.
3. If the asset needs art revision, set `state: needs_art` and assign Antigravity.
4. If automation or validation needs changes, set `state: needs_dev` and assign Codex.

Latest Codex validation:

```bash
npm run agent:loop -- --json
npm run agent:check
npm run queue:validate
npm run assets:validate
npm run build
npm test
```

Result: PR #1 merged on 2026-06-21; provider=auto request was claimed and completed by Antigravity.

Latest provider=auto smoke validation:

```bash
npm run queue:validate
npm run assets:validate
npm run build
npm run verify:visual
```

Result: passed locally on 2026-06-21. Note: generated PNG is RGB without alpha even though the original request asked for transparency.

Scope note: no gameplay source files were changed in this S0.1 pass.

## Automation Contract

- A green GitHub Actions run means the code can build, data is valid, browser flows pass, visual smoke tests pass, and canvas is nonblank.
- A green run does not mean the art direction is approved; ChatGPT or the user still reviews aesthetics.
- `npm run agent:check` fails only on missing protocol files or missing asset references. Known art-quality issues are warnings until Antigravity marks assets ready.
