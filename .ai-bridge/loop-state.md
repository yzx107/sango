# Sango Agent Loop State

This file is the shared state machine for low-interruption agent collaboration.

## State

- state: needs_review
- current_owner: ChatGPT Remote Reviewer
- next_owner: ChatGPT Remote Reviewer
- remote_reviewer: ChatGPT Remote Reviewer
- source_of_truth: GitHub main plus local `git status`
- last_validated_local_state: S0.1 orchestration hardening branch
- updated_at: 2026-06-21 23:17 Asia/Shanghai

## State Meanings

- todo: task is described but no agent has started.
- in_progress: current owner is actively changing files.
- needs_art: Antigravity should produce or revise art/UI assets.
- needs_dev: Codex should integrate, fix, or extend game code.
- needs_review: ChatGPT should review GitHub diff and status files.
- blocked: progress needs a user decision or missing external input.
- done: task is complete and validated.

## Current Sprint

Goal: Review S0.1 orchestration hardening without disturbing the working game loop.

Current review task:

1. ChatGPT or the user reviews the S0.1 PR.
2. If provider routing, queue validation, worker heartbeat, strict asset validation, and PR gate are acceptable, approve the PR.
3. If asset worker behavior needs changes after approval, set `state: needs_art` and assign Antigravity.
4. If scripts or CI need changes, set `state: needs_dev` and assign Codex.

Latest Codex validation:

```bash
npm run agent:loop -- --json
npm run agent:check
npm run queue:validate
npm run assets:validate
npm run build
npm test
```

Result: passed locally on 2026-06-21 for S0.1 branch.

Scope note: no gameplay source files were changed in this S0.1 pass.

## Automation Contract

- A green GitHub Actions run means the code can build, data is valid, browser flows pass, visual smoke tests pass, and canvas is nonblank.
- A green run does not mean the art direction is approved; ChatGPT or the user still reviews aesthetics.
- `npm run agent:check` fails only on missing protocol files or missing asset references. Known art-quality issues are warnings until Antigravity marks assets ready.
