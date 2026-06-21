# Sango Agent Loop State

This file is the shared state machine for low-interruption agent collaboration.

## State

- state: needs_review
- current_owner: ChatGPT Remote Reviewer
- next_owner: Antigravity Local Art/UI Agent
- remote_reviewer: ChatGPT Remote Reviewer
- source_of_truth: GitHub main plus local `git status`
- last_validated_local_state: agent loop automation plus Antigravity art refresh
- updated_at: 2026-06-21 21:35 Asia/Shanghai

## State Meanings

- todo: task is described but no agent has started.
- in_progress: current owner is actively changing files.
- needs_art: Antigravity should produce or revise art/UI assets.
- needs_dev: Codex should integrate, fix, or extend game code.
- needs_review: ChatGPT should review GitHub diff and status files.
- blocked: progress needs a user decision or missing external input.
- done: task is complete and validated.

## Current Sprint

Goal: Finish the Sango Phase 1 art/UI baseline without disturbing the working game loop.

Current review task:

1. ChatGPT or the user reviews the latest Antigravity art refresh on GitHub.
2. If the portrait background inconsistency is acceptable, set `state: done`.
3. If the portraits need another art pass, set `state: needs_art` and assign Antigravity.
4. If code integration issues appear, set `state: needs_dev` and assign Codex.

Latest Codex validation:

```bash
npm run agent:check
npm run build
npm run validate:data
npm test
npm run verify:visual
npm run inspect:canvas
node scripts/inspect-threejs-canvas.mjs --mobile --out artifacts/canvas-inspection
```

Result: passed locally on 2026-06-21.

Visual note: ruler portraits no longer contain visible text and image files are true PNG. Some portrait backgrounds still vary between light and dark, so art direction review is still useful.

## Automation Contract

- A green GitHub Actions run means the code can build, data is valid, browser flows pass, visual smoke tests pass, and canvas is nonblank.
- A green run does not mean the art direction is approved; ChatGPT or the user still reviews aesthetics.
- `npm run agent:check` fails only on missing protocol files or missing asset references. Known art-quality issues are warnings until Antigravity marks assets ready.
