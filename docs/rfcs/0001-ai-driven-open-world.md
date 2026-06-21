# RFC-0001: AI-Driven Living Three Kingdoms Open World

- Status: Proposed
- Task ID: RFC-0001-AI-OPEN-WORLD
- Owner: Codex Game Development Agent
- Reviewers: Antigravity Local Art/UI Agent, Codex Game Development Agent, ChatGPT Remote Reviewer, Project Owner
- PR type: Draft, documentation only
- Scope: Product direction, technical feasibility, visual/UX review prompts
- Non-goals for this PR: gameplay changes, asset changes, Phase 1 acceptance changes

## Summary

Sango should keep the current original Three.js Three Kingdoms strategy demo as its near-term foundation, then gradually explore a long-term product direction: an AI-driven living world where factions, cities, generals, rumors, relationships, and local scenes evolve from structured simulation rather than static scripts.

This RFC does not approve implementation work. It creates a shared review target so Codex can judge technical feasibility, Antigravity can judge visual and UX direction, and ChatGPT Remote Reviewer can help split future work into safer milestones.

The key idea is:

> AI may propose intent, dialogue, rumors, and narrative presentation, but the authoritative game state must stay deterministic, structured, validated, and testable.

## Product Vision

The long-term Sango experience should feel like a living Three Kingdoms strategy world:

- The national strategy map remains readable and turn-driven.
- Cities, roads, armies, resources, and faction pressure remain visible system objects.
- Important generals remember events, hold relationships, pursue goals, and react to changing circumstances.
- Players can eventually move between strategic command and selected local scenes, such as a city office, tavern, barracks, camp, or battlefield.
- History provides the starting conditions; the simulation, player, and AI-assisted narrative create alternate outcomes.

This is not a request to build a seamless third-person 3D China map now. The first useful milestone is a small, inspectable living-world kernel that proves the world can evolve for explainable reasons.

## Relationship To Current Phase 1

Phase 1 remains unchanged.

This RFC must not change:

- current gameplay behavior;
- art assets;
- ruler selection;
- city management;
- marching;
- battle settlement;
- existing tests;
- current Phase 1 acceptance criteria.

The current project should continue to prioritize the original retro strategy demo: stable build, reliable data, readable UI, safe generated assets, and clean agent collaboration.

## Design Principles

1. **Authoritative simulation first.** WorldState, rules, event logs, and validators own truth.
2. **AI proposes, rules dispose.** Model output can suggest actions, never directly mutate authoritative state.
3. **Small vertical slices beat broad promises.** Validate one city, a few generals, and one closed loop before scaling.
4. **Offline fallback is required.** The game must remain playable with deterministic stubs or rule-based agents when model calls are unavailable.
5. **Every major event needs a trace.** War, betrayal, alliance, recruitment, and rumor should have structured causes and logged outcomes.
6. **Originality remains non-negotiable.** No commercial game screenshots, ROM assets, exact UI layouts, copied maps, copied text, or copied values.

## Proposed World Model

The future world should separate four layers:

### Strategic Layer

- National map
- Cities
- Roads
- Armies
- Factions
- Economy
- Diplomacy
- Calendar and turn progression

### Character Layer

- Generals and key NPCs
- Location
- Loyalty
- ambition
- fear
- reputation
- relationships
- known facts
- memories
- active goals

### Local Scene Layer

- Parametric city scene templates
- Office, tavern, barracks, camp, road, and battlefield locations
- Local NPC presentation
- Interaction hotspots
- Scene state derived from WorldState

### Narrative Layer

- Dialogue
- letters
- rumors
- battle reports
- diplomatic messages
- chronicles
- summaries of why events happened

Only the first two layers need to exist for the first technical spike. Local scenes and narrative polish should wait until the living kernel is testable.

## AI Responsibilities

AI can help with:

- proposing NPC intent from a limited set of valid actions;
- generating dialogue, letters, rumors, and reports from verified world context;
- summarizing event logs into readable chronicles;
- selecting dramatic but rule-compatible story focus;
- assisting art or content ideation through the existing asset-review process.

AI must not:

- directly write authoritative WorldState;
- invent cities, generals, resources, or battles and persist them as fact;
- bypass movement, economy, diplomacy, time, or battle rules;
- decide battle math outside the rule engine;
- run every-frame NPC behavior;
- require online model access for core gameplay;
- generate copied commercial game UI, assets, names, layouts, or values.

## Structured Action API

All AI-driven behavior should pass through a small action interface before execution.

```ts
type WorldAction =
  | { type: 'TRAVEL'; actorId: string; destinationId: string }
  | { type: 'NEGOTIATE'; actorId: string; targetFactionId: string; proposalId: string }
  | { type: 'RECRUIT'; actorId: string; targetGeneralId: string }
  | { type: 'GOVERN'; actorId: string; cityId: string; policyId: string }
  | { type: 'MARCH'; armyId: string; targetCityId: string }
  | { type: 'INVESTIGATE'; actorId: string; subjectId: string };
```

Recommended execution path:

```text
WorldState snapshot
-> Observation projection
-> Goal and action proposal
-> Schema validation
-> Rule validation
-> Authoritative simulation
-> Event log append
-> Narrative rendering
```

This keeps generated language separate from game truth.

## Technical Architecture Direction

```text
Authoritative World Simulation
├── WorldState
├── Calendar / turn clock
├── Economy / population
├── factions / diplomacy
├── characters / relationships
├── armies / travel / battles
├── information / fog of war
└── event log

Agent Runtime
├── observation builder
├── goal planner
├── memory store
├── action proposal
├── action validator
├── model router
└── deterministic fallback

Narrative Layer
├── dialogue
├── letters
├── rumors
├── chronicle
└── event presentation

Three.js Client
├── strategic map
├── local scene shell
├── NPC presentation
├── interaction UI
└── performance budget
```

## Milestones

### Milestone 0: Finish Current Vertical Slice

- Keep Phase 1 acceptance stable.
- Preserve existing ruler selection, strategy map, city panel, marching, and battle loop.
- Keep agent workflow and asset validation green.
- Add no open-world code under this RFC.

### Milestone 1: Living World Kernel

- Create a deterministic world clock.
- Add structured event logging.
- Represent general location, goal, loyalty, relationship, and memory summary.
- Run multiple simulated months without LLM calls.
- Verify events are explainable and reproducible from a fixed seed.

Acceptance:

- Given a fixed seed and scenario, the world produces the same sequence of structured events.
- A reviewer can inspect why a general moved, negotiated, recruited, defected, or stayed idle.

### Milestone 2: Social Sandbox

- Build a small "council chamber" or panel-only prototype.
- Select three existing generals.
- Give each a goal and a few memories.
- Generate or stub one action proposal per turn.
- Validate actions with schema and rules.
- Show proposal, validation result, execution result, and reasoning.

Acceptance:

- AI or stubbed agents can suggest actions without breaking rules or inventing state.
- If model access is disabled, deterministic stubs pass the same tests.

### Milestone 3: Single-City Local Scene

- Add one original city scene template.
- Include three local places: office, tavern, barracks.
- Let the player enter from the strategic map.
- Use world state to determine who appears and what can be discussed.
- Return one validated outcome to the strategic layer.

Acceptance:

- The player can enter a city, speak to one character, trigger a validated result, and see the strategic state update.

### Milestone 4: Multi-City Expansion

- Parameterize city scenes.
- Add road or camp encounters.
- Add travel time and risk.
- Keep mobile and desktop performance budgets explicit.

### Milestone 5: AI Director

- Select story focus from existing world tensions.
- Generate quests or event chains as proposals.
- Keep all outcomes backed by structured causes and validators.
- Support historical and alternate-history modes.

## First Technical Spike

The first spike should be an "AI Council Chamber" prototype, not a 3D open world.

Suggested scope:

1. Use three existing generals from current data.
2. Build a read-only observation from current GameState or a new narrow WorldState fixture.
3. Give each general one goal and three memory entries.
4. Produce one schema-shaped WorldAction proposal per general.
5. Validate each action.
6. Execute only accepted actions through an authoritative simulator.
7. Append events to a structured log.
8. Render a small review UI or CLI report showing proposal, validation, result, and reason.
9. Provide deterministic stub behavior when no model is available.
10. Cover the flow with fixed-seed tests.

The spike succeeds only if the AI path is explainable, bounded, reproducible, and removable without breaking the base game.

## Codex Technical Feasibility Review

Codex preliminary review: feasible only if treated as a simulation-first architecture, not as an immediate content or 3D scope expansion.

Recommended technical constraints:

- Start with pure data and tests before UI.
- Add seeded RNG before any AI loop depends on randomness.
- Introduce EventLog as an append-only record before generating narrative text.
- Keep ActionValidator independent from model calls.
- Keep the model boundary replaceable with deterministic stubs.
- Avoid changing current GameState broadly until a narrow WorldState adapter proves value.
- Do not add model credentials, online services, or runtime dependencies in the first spike.

Main risks:

- Scope creep from "living world" into full 3D exploration too early.
- Generated dialogue contradicting authoritative state.
- Non-deterministic behavior making tests flaky.
- Browser performance pressure if local scenes are built before the data loop is stable.
- Asset direction drift if local scenes lose the current retro strategy identity.

Codex recommendation:

- Move forward with review and planning.
- Do not start implementation until the Project Owner accepts or revises this RFC.
- If accepted, create a separate implementation RFC or task for Milestone 1 only.

## Antigravity Visual And UX Review Request

Antigravity should review, without generating or replacing assets yet:

1. How can strategic and local layers share one original retro Sango visual language?
2. What should the first city scene abstractly look like so it supports strategy reading rather than cinematic realism?
3. How should the transition from map to local scene feel on desktop and mobile?
4. How can NPC memory, relationship, intent, and uncertainty be shown without crowding the existing UI?
5. Which parts of the current Phase 1 UI should remain visually sacred while exploring local scenes?

Review output should be comments or a follow-up review note. No `public/assets/**` changes are requested by this RFC.

## ChatGPT Remote Reviewer Request

ChatGPT Remote Reviewer should evaluate:

- whether the RFC respects `PROJECT_BRIEF.md` originality boundaries;
- whether the plan avoids changing current Phase 1 acceptance;
- whether the technical sequence is safely staged;
- whether the review requests are clear enough for Codex and Antigravity;
- which follow-up tasks should be split after the RFC decision.

## Open Questions

- Should Sango eventually support non-ruler player identities, or should ruler mode remain the only official path?
- Does the first local scene need direct character movement, or can it begin as an inspectable panel scene?
- How much generated text is acceptable before the UI feels unlike a crisp retro strategy game?
- Should model calls run client-side, server-side, or only through optional developer tooling?
- What is the minimum event-log schema needed before any AI proposal is useful?

## Decision Criteria

Accepting this RFC means:

- The long-term direction can include an AI-driven living world.
- The next implementation work should still be a small deterministic kernel.
- AI output must be structured, validated, logged, and degradable.
- Phase 1 remains protected until a later approved implementation task changes it.

Rejecting this RFC means:

- Sango should remain a tighter classic strategy demo without living-world AI as a product direction.

Revising this RFC means:

- Reviewers should propose narrower milestones, different AI boundaries, or a different visual/UX framing before any implementation starts.
