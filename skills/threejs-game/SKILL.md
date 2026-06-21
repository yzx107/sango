---
name: sango-threejs-game
description: "Repository-local fork of the Three.js game workflow for Sango. Use this before external Three.js game skills when working in this repo."
---

# Sango Three.js Game Skill

This is the repository-local fork of the Three.js game workflow for Sango. It keeps the gameplay, rendering, UI, QA, and asset orchestration rules close to the project so local Codex, Antigravity, and ChatGPT agents can coordinate through GitHub and `.ai-bridge`.

## Required Reading

Before work:

1. `PROJECT_BRIEF.md`
2. `AGENTS.md`
3. `.ai-bridge/current-plan.md`
4. `.ai-bridge/loop-state.md`
5. `.ai-bridge/file-locks.md`

## Non-Negotiable Scope

- Keep Sango an original Three.js historical strategy game inspired by classic 8-bit Three Kingdoms strategy pacing.
- Do not copy commercial screenshots, ROM assets, sprites, maps, logos, original text, music, or exact UI layouts.
- Do not modify gameplay while executing orchestration-only tasks.
- Respect `.ai-bridge/file-locks.md`.

## Image and Asset Rule

This local fork intentionally removes any hard dependency on Gemini or any other image generation provider.

Codex must not directly call an image-generation API as part of this local skill flow. When a 2D asset is needed, Codex creates an `AssetRequest` JSON file under:

```text
.ai-bridge/assets/pending/
```

The request must validate against:

```text
.ai-bridge/schemas/asset-request.schema.json
```

Antigravity or another asset worker owns generation, editing, conversion, and manifest updates. Codex only validates and integrates completed assets.

## AssetRequest Minimum

```json
{
  "id": "asset-ruler-select-background-v2",
  "owner": "antigravity",
  "provider": "antigravity",
  "state": "pending",
  "type": "background",
  "purpose": "Original text-free retro strategy map background for ruler selection",
  "prompt": "Original 8-bit inspired ancient Chinese strategy map mood background, no readable text, no menu UI, no commercial game layout.",
  "targetPath": "public/assets/generated/backgrounds/ruler-select.png",
  "expected": {
    "mime": "image/png",
    "width": 1024,
    "height": 1024
  },
  "constraints": [
    "No readable English or Chinese text",
    "No commercial game screenshot imitation",
    "No logo"
  ],
  "createdAt": "2026-06-21T00:00:00.000Z"
}
```

## Queues

- Tasks: `.ai-bridge/tasks/{pending,in_progress,completed,failed}/`
- Assets: `.ai-bridge/assets/{pending,in_progress,completed,failed}/`
- Reports: `.ai-bridge/reports/{pending,in_progress,completed,failed}/`
- Reviews: `.ai-bridge/reviews/{pending,in_progress,completed,failed}/`

## Validation

Run:

```bash
npm run agent:loop
npm run agent:check
npm run assets:validate
npm run build
```

When gameplay, UI flow, or rendering changed, also run:

```bash
npm run validate:data
npm test
npm run verify:visual
npm run inspect:canvas
```

## Reporting

Every agent writes a short update to `.ai-bridge/agent-status.md` and, for structured reports, places JSON matching `.ai-bridge/schemas/agent-report.schema.json` under `.ai-bridge/reports/`.
