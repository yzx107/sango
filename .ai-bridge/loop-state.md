# Sango Agent Loop State

This file is the shared state machine for low-interruption agent collaboration.

## State

- state: needs_review
- current_owner: ChatGPT Remote Reviewer
- next_owner: ChatGPT Remote Reviewer
- remote_reviewer: ChatGPT Remote Reviewer
- source_of_truth: Draft PR for RFC-0001 plus local `git status`
- last_validated_local_state: RFC-0001 documentation-only proposal
- updated_at: 2026-06-21 23:35 Asia/Shanghai

## State Meanings

- todo: task is described but no agent has started.
- in_progress: current owner is actively changing files.
- needs_art: Antigravity should produce or revise art/UI assets.
- needs_dev: Codex should integrate, fix, or extend game code.
- needs_review: ChatGPT should review GitHub diff and status files.
- blocked: progress needs a user decision or missing external input.
- done: task is complete and validated.

## Current Sprint

Goal: Review RFC-0001, the proposed AI-driven living Three Kingdoms open world direction, without disturbing the working game loop, generated assets, or Phase 1 acceptance.

Current review task:

1. ChatGPT Remote Reviewer reviews the Draft PR, RFC boundaries, and bridge state.
2. Antigravity reviews visual language, UX transition, and NPC intent/memory presentation through `.ai-bridge/reviews/pending/review-rfc-0001-antigravity-visual-ux.json`.
3. Codex technical feasibility review is recorded in `.ai-bridge/reviews/completed/review-rfc-0001-codex-feasibility.json`.
4. Project Owner decides whether to accept, revise, or reject the RFC.
5. If accepted, split Milestone 1 into a separate implementation task; do not implement open-world code from this PR.

Latest Codex validation:

```bash
npm run agent:loop -- --json
npm run agent:check
npm run queue:validate
npm run assets:validate
npm run build
```

Result: documentation-only RFC branch; no gameplay source files, tests, generated assets, or dependency files should change.

Scope note: this branch adds an RFC and review/status metadata only.

## Automation Contract

- A green GitHub Actions run means the code can build, data is valid, browser flows pass, visual smoke tests pass, and canvas is nonblank.
- A green run does not mean the art direction is approved; ChatGPT or the user still reviews aesthetics.
- `npm run agent:check` fails only on missing protocol files or missing asset references. Known art-quality issues are warnings until Antigravity marks assets ready.
