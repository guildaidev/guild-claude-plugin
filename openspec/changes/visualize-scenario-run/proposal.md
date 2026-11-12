## Why

The user is teaching an agentic application how to do a job, much as a teacher does: by exercising it against concrete scenarios and giving feedback on what it should have done. Feedback is only useful if the user can see what a particular run actually caused in the world, in familiar terms, rather than reconstructing behavior from internal tool traces. A grounded, readable run narrative makes that feedback possible while exposing uncertainty instead of presenting unsupported success or causation.

This change is the first, narrow iteration of that larger direction. The broader product intent (scenario selection, before/after comparison, re-runs, and a user-verified golden set) remains the north star, but this change deliberately covers only reviewing one run's real-world effects.

## What Changes

- Add a run-review visualization workflow for one plain-English scenario: a parent supplies an evidence bundle identifying its trigger, initial conditions, intended world effect, relevant sandbox integrations, exact application version, and observed resulting state. A visualization subagent edits a story and coordinates a distinct read-only fact-check agent, and a deterministic local renderer validates and produces HTML.
- Make consequential before-and-after effects the main event: show what was created, modified, sent, or left unchanged through familiar artifacts such as messages, tickets, documents, and records. Select only top-level workspace session boundaries, real-world agent actions, and goal-relevant external effects for the main timeline; use progressive disclosure for technical details. Preserve source provenance, gaps, ambiguity, outcomes, and relevant artifacts.
- Distinguish sandbox observations from production effects, and observed evidence from possible downstream consequences or user-supplied inferences. Make consequential risks visible without asserting them as observed facts.
- Present successful output in a supported host or a browser, and return its reference and verification summary to the parent. Feedback is an intent for the parent to interpret, including whether it teaches the selected scenario or a general rule. Support explicit copy-to-chat feedback where a verified parent-bound transport is unavailable; do not claim host APIs exist.
- Establish fixture-driven evaluation for the 13 documented scenarios and separate real-host presentation/transport verification from simulated evidence.
- Reconcile the working document's early renderer schema with its newer flow and safety decisions. Disclose the packaged local renderer as an exception to the existing skills' MCP-only description.

## Capabilities

### New Capabilities
- `scenario-run-visualization`: Evidence handoff, editorial selection, independent verification, deterministic rendering, presentation and parent-directed feedback intents for one run.

### Modified Capabilities

None; no existing OpenSpec capabilities are present.

## Impact

The Claude plugin will need visualization-specific skill/subagent instructions, a packaged local renderer and tests; `skills/agent-development/SKILL.md` and `README.md` need careful integration with concurrent changes. The existing untracked `dev/skill-harness/` is a possible fixture tool, not proof of host integration. This proposal informs later scenario generation, comparisons, reruns, and promotion of user-approved sandbox examples into safely emulated regression evals, but does not implement them. No execution infrastructure, golden-set mutation, rerun handling, production transport, or an assertion that an emulated run proves a real integration works is added. Host support, source-system read permissions, and safe sandbox credentials/destinations must be verified rather than assumed.
