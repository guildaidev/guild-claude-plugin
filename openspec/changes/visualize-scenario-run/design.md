## Context

The current checkout has a Guild agent-development skill whose test loop uses hosted Guild tools, but no ADLC run-review visualization or local renderer. README describes existing skills as MCP-only. An untracked `dev/skill-harness/` provides fictional source tools and a Claude SDK session, but explicitly is not native plugin discovery, renderer execution or end-to-end host testing; it is concurrent user work, not a dependency guaranteed to exist. `hooks/register.tsx` provides a Guild sessions pane, not evidence of a general HTML sidebar or parent-message bridge. See `proposal.md` for motivation and the capability spec for behavior.

The working design's top sequence and input bundle are authoritative: [implementation document](https://app.notion.com/p/415c3e1ce8dc816ca4afce26a6729fd8). Its later sequence and rules supersede the early generator TypeScript draft. [Product architecture](https://app.notion.com/p/414c3e1ce8dc80018091f454f386979b) supplies the broader teaching context, not a mandate to implement the whole ADLC lifecycle here.

## Goals / Non-Goals

**Goals:** Define a bounded vertical slice from supplied run evidence to verified, readable HTML and honest feedback handoff; make unavailable verification and host support observable.

**Non-Goals:** Running or emulating application tests, live eval/profile infrastructure, scenario management, comparison, golden-set writes, rerun execution, a general-purpose bridge, or claims of support for unverified hosts. No actual workflow execution is required to implement fixture-based tests.

## Decisions

1. **Separate collector, editor, checker and renderer.** The parent collects a sanitized bundle at run review. A dedicated visualization subagent selects and writes the story, sends candidate claims and evidence to a distinct checker, revises and repeats until final factual content has matching review, then runs the renderer and repairs errors. The checker makes its own authorized reads and records claim, source ID, observed time, finding and gap; it never writes. Bundle-only review is rejected because it cannot independently verify real-world effects. Synthetic sources remain explicitly synthetic. If reads fail, show the gap and qualify or omit the claim rather than block all useful output or imply confirmation.

2. **Versioned boundary data, not trace replay.** Use the document's `VisualizationEvidenceBundle` as the semantic starting point: workflow intended effect; scenario and run identity; actor/session IDs and session levels; occurrences with outcome, time bounds, relevance, relationships and evidence/artifact references; evidence provenance/completeness/redactions; coverage and origin; logical presentation target and allowed actions. Define a versioned render snapshot containing selected story events, inline artifacts, explicit uncertainty/verification findings, origin, IDs and action intents. Preserve uncertain order and causes. The checker review must bind to the factual revision (e.g. a digest or equivalent comparison); nonfactual renderer repairs need not repeat it. The script validates structure and internal references, not whether claims are true.

3. **Reconcile the obsolete draft, do not implement it literally.** The generator draft's decision/tool-call event types conflict with the timeline selection rules; sensitive content hidden behind a toggle is not sanitization; required timestamps/status and single-agent assumptions can fabricate certainty; and `window.postMessage` is not a parent route. Replace or adapt those fields, maintain explicit source/verification provenance and gaps, permit unknown/partial states and multiple sessions, and represent allowed intents separately from execution. No backward compatibility is promised for the unimplemented draft.

4. **Deterministic local HTML with strict boundaries.** Package a local script with the visualization skill, accepting a snapshot file and returning machine-readable success with artifact path or structured errors including field paths and repair guidance. Render escaped text and safe links, disallow executable untrusted markup and external resource loading by default, and never include secrets in the snapshot or output. Use bounded repair/presentation attempts and preserve safe diagnostics. Explain this explicit local executable/file exception in README rather than changing the existing two skills' MCP-only claim silently. Runtime choice and packaging must be documented and checked in each supported host.

5. **Presentation is not transport.** Successful renderer output is opened in a sidebar only if a real host capability is verified; otherwise use an available browser presentation and return its path. An action contains intent plus snapshot/run/scenario/event identifiers; no button performs a golden-set or rerun mutation. Default to copy-to-chat in a terminal browser and wherever a parent-bound bridge is unverified. Only enable an automatic adapter after a real-host test proves it reaches the original parent after editor closure. MCP channels are only a documented research-preview candidate with enablement/allowlisting restrictions, not a dependency or evidence of implementation. Pure postMessage is insufficient. No specific sidebar API is assumed.

6. **Tests distinguish simulation from host evidence.** Create repeatable fixtures for all 13 scenarios in the implementation document, including independent checker fixture calls and both post-closure variants. Deterministic unit tests cover schema, repair, escaping and output. Reuse the existing untracked harness only if it is available and suitable after coordinating its owner; do not rely on its save_artifact stand-in to prove host routing. Add separate real-host acceptance procedures for browser/sidebar presentation and any optional bridge; mark untested combinations unsupported, not passed.

## Risks / Trade-offs

- [Source access or history missing] → Preserve gaps and distinguish current state from causal history; never repeat a write.
- [Subagent/renderer host capabilities vary] → Gate on demonstrated support and report failures; fallback copy is explicit, not automatic.
- [Unsafe evidence or hostile HTML] → Sanitize before handoff/snapshot, escape at render, validate links and avoid executable source content.
- [Concurrent edits] → Rebase changes against current `agent-development` and README content, preserve untracked harness, and review overlapping PR #15/#19 changes before implementation.
- [Bounded retries exhaust] → Return structured diagnostics and useful safe artifact or path; never claim presentation succeeded.

## Migration Plan

Introduce new skill assets and tests without altering existing Guild workflow behavior until the run-review entry point is available. Update documentation to distinguish supported hosts and local execution. Disable the new review entry point or remove its packaged assets to roll back; do not migrate historical data or remove user evidence.
