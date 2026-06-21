# Sango Agent Loop State

This file is the shared state machine for low-interruption agent collaboration.

## State

- state: needs_review
- current_owner: ChatGPT Remote Reviewer
- next_owner: Codex and Antigravity review comments
- remote_reviewer: ChatGPT Remote Reviewer
- source_of_truth: GitHub PR for RFC-0001
- last_validated_local_state: RFC-0001 AI driven open world documentation proposal
- updated_at: 2026-06-21 23:40 Asia/Shanghai

## State Meanings

- todo: task is described but no agent has started.
- in_progress: current owner is actively changing files.
- needs_art: Antigravity should produce or revise art/UI assets.
- needs_dev: Codex should integrate, fix, or extend game code.
- needs_review: ChatGPT should review GitHub diff and status files.
- blocked: progress needs a user decision or missing external input.
- done: task is complete and validated.

## Current Sprint

Goal: Review RFC-0001, the proposed AI-driven living Three Kingdoms open world direction, without disturbing the working game loop or Phase 1 art/UI scope.

Current review task:

1. Codex comments on technical feasibility, migration path, and first spike scope.
2. Antigravity comments on visual direction, UX, and double-layer world presentation.
3. Project Owner decides whether to accept, revise, or reject the RFC.
4. ChatGPT Remote Reviewer summarizes review outcomes and splits follow-up implementation tasks.

Latest validation expectation:

```bash
npm run agent:check
npm run assets:validate
npm run build
```

Result: documentation-only RFC branch; no gameplay source files, tests, or generated assets should change.

Scope note: this branch adds an RFC and updates bridge state only.

## Automation Contract

- A green GitHub Actions run means the code can build, data is valid, browser flows pass, visual smoke tests pass, and canvas is nonblank.
- A green run does not mean the art direction is approved; ChatGPT or the user still reviews aesthetics.
- `npm run agent:check` fails only on missing protocol files or missing asset references. Known art-quality issues are warnings until Antigravity marks assets ready.
