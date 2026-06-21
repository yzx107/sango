# Summary

- 

# Agent Scope

- Owner:
- Loop state before:
- Loop state after:
- Allowed files touched:
- Next owner:
- Branch follows `agent/<task-id>-<owner>`: yes / no
- Direct `main` push avoided: yes / no

# Validation

- [ ] `npm run agent:loop -- --json`
- [ ] `npm run agent:check`
- [ ] `npm run queue:validate`
- [ ] `npm run assets:validate`
- [ ] `npm run build`
- [ ] `npm run validate:data`
- [ ] `npm test`
- [ ] `npm run verify:visual`
- [ ] Canvas inspection, if visual/Three.js work changed

# Asset Notes

- [ ] `public/assets/generated/manifest.json` is updated when generated assets change.
- [ ] New image needs were expressed as AssetRequest files under `.ai-bridge/assets/pending/`.
- [ ] `provider=auto` requests have a matching worker heartbeat when claimed.
- [ ] Manifest MIME, dimensions, and sha256 match the generated files.
- [ ] No commercial game screenshots, ROM assets, logos, original text, or exact UI copies were added.
- [ ] Image file extensions match real image encoding, or mismatch is explicitly recorded as a temporary issue.

# Handoff

- Updated `.ai-bridge/agent-status.md`: yes / no
- Updated `.ai-bridge/loop-state.md`: yes / no
- Open issues for the next agent:
