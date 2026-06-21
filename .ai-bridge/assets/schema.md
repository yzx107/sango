# Asset Request Notes

Machine-readable schema:

- `.ai-bridge/schemas/asset-request.schema.json`

To request a visual asset, create a JSON file in `.ai-bridge/assets/pending/` with the format `[asset-id].json`.

```json
{
  "id": "asset-ruler-select-background-v2",
  "owner": "antigravity",
  "provider": "antigravity",
  "state": "pending",
  "type": "portrait",
  "purpose": "Original 8-bit-inspired ruler portrait",
  "prompt": "Original retro pixel art portrait, no readable text, no commercial game layout.",
  "targetPath": "public/assets/generated/rulers/guanyu.png",
  "expected": {
    "mime": "image/png",
    "width": 1024,
    "height": 1024
  },
  "constraints": [
    "No logo",
    "No copied game screenshot"
  ],
  "createdAt": "2026-06-21T00:00:00.000Z"
}
```

The Art Worker (Antigravity) reads pending requests, generates or edits the asset, verifies the real image format, updates `public/assets/generated/manifest.json` with `mime` and `sha256`, and moves the request to `.ai-bridge/assets/completed/` or `.ai-bridge/assets/failed/`.
