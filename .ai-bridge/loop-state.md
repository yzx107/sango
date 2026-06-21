# Sango Agent Loop State

This file is the shared state machine for low-interruption agent collaboration.

## State

- state: needs_review
- current_owner: ChatGPT Remote Reviewer
- next_owner: decided by review outcome
- remote_reviewer: ChatGPT Remote Reviewer
- source_of_truth: GitHub main plus local `git status`
- last_validated_local_state: S0 orchestration bootstrap infrastructure
- updated_at: 2026-06-21 22:50 Asia/Shanghai

## State Meanings

- todo: task is described but no agent has started.
- in_progress: current owner is actively changing files.
- needs_art: Antigravity should produce or revise art/UI assets.
- needs_dev: Codex should integrate, fix, or extend game code.
- needs_review: ChatGPT should review GitHub diff and status files.
- blocked: progress needs a user decision or missing external input.
- done: task is complete and validated.

## Current Sprint

Goal: Review S0 orchestration bootstrap without disturbing the working game loop.

Current review task:

1. ChatGPT or the user reviews the automatic development infrastructure diff on GitHub.
2. If the queues, schemas, local skill fork, ownership rules, and `assets:validate` are acceptable, set `state: done`.
3. If asset worker behavior needs changes, set `state: needs_art` and assign Antigravity.
4. If scripts or CI need changes, set `state: needs_dev` and assign Codex.

Latest Codex validation:

```bash
npm run agent:check
npm run assets:validate
npm run build
```

Result: passed locally on 2026-06-21 for S0 infrastructure scope.

Scope note: no gameplay source files were changed in this S0 pass.

## Automation Contract

- A green GitHub Actions run means the code can build, data is valid, browser flows pass, visual smoke tests pass, and canvas is nonblank.
- A green run does not mean the art direction is approved; ChatGPT or the user still reviews aesthetics.
- `npm run agent:check` fails only on missing protocol files or missing asset references. Known art-quality issues are warnings until Antigravity marks assets ready.
