## Why

People teaching an agentic application need to review what a particular scenario actually caused, rather than reconstruct its behavior from internal tool traces. A grounded, readable run narrative makes feedback possible while exposing uncertainty instead of presenting unsupported success or causation.

## What Changes

- Add a run-review visualization workflow: a parent supplies an evidence bundle, a visualization subagent edits a story and coordinates a distinct read-only fact-check agent, and a deterministic local renderer validates and produces HTML.
- Select only top-level workspace session boundaries, real-world agent actions, and goal-relevant external effects for the main timeline. Preserve source provenance, gaps, ambiguity, outcomes, and relevant artifacts.
- Present successful output in a supported host or a browser, and return its reference and verification summary to the parent. Support explicit copy-to-chat feedback where a verified parent-bound transport is unavailable; do not claim host APIs exist.
- Establish fixture-driven evaluation for the 13 documented scenarios and separate real-host presentation/transport verification from simulated evidence.
- Reconcile the working document's early renderer schema with its newer flow and safety decisions. Disclose the packaged local renderer as an exception to the existing skills' MCP-only description.

## Capabilities

### New Capabilities
- `scenario-run-visualization`: Evidence handoff, editorial selection, independent verification, deterministic rendering, presentation and parent-directed feedback intents for one run.

### Modified Capabilities

None; no existing OpenSpec capabilities are present.

## Impact

The Claude plugin will need visualization-specific skill/subagent instructions, a packaged local renderer and tests; `skills/agent-development/SKILL.md` and `README.md` need careful integration with concurrent changes. The existing untracked `dev/skill-harness/` is a possible fixture tool, not proof of host integration. No execution infrastructure, golden-set mutation, rerun handling, or production transport is added by this proposal. Host support and source-system read permissions must be verified rather than assumed.
