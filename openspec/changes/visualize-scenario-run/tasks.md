## 1. Contracts and integration boundaries

- [ ] 1.1 Reconcile current `agent-development`/README and overlapping PR #15/#19 changes without overwriting concurrent work; record the chosen run-review integration point and verify existing skill behavior remains intact.
- [ ] 1.2 Define versioned evidence bundle and render snapshot contracts from the working document and spec, including multi-session, provenance, gaps, fact-check revision binding, intent IDs and unknown states; verify representative valid and invalid fixtures against them.
- [ ] 1.3 Document the local renderer runtime, package location, host limitations and MCP-only exception in README; verify the plugin package contains the required assets without modifying the existing untracked harness implicitly.

## 2. Editorial and verification workflow

- [ ] 2.1 Add parent handoff instructions for collecting and sanitizing evidence without specifying how the run executes; verify a fixture handoff carries every required category and reports missing coverage.
- [ ] 2.2 Add visualization editor instructions for selection, narrative, inline artifacts, uncertainty and supporting detail; verify downstream relevance, multiple top-level sessions and noise exclusion with fixtures.
- [ ] 2.3 Add distinct fact-check agent instructions and claim-level findings contract for independent authorized read-only calls, observed time, sources, conflicts and gaps; verify fixture traces contain separate source reads and no writes.
- [ ] 2.4 Bind review to the factual snapshot revision and implement editorial recheck/repair flow with bounded retries; verify changed factual content triggers recheck and unchanged factual content does not.

## 3. Renderer and presentation

- [ ] 3.1 Implement deterministic snapshot and reference validation with structured field-level errors and a success artifact path; verify malformed and valid fixture cases in unit tests.
- [ ] 3.2 Render a self-contained story-first HTML artifact with inline artifacts, expandable detail, origin/gap notices and allowed feedback intents; verify deterministic output, unknown/partial states, escaping, safe links and absence of fixture secrets.
- [ ] 3.3 Provide copy-to-chat feedback containing the correct snapshot/run/scenario and optional event IDs; verify a user can copy an intent after editor closure without an assertion that an action occurred.
- [ ] 3.4 Add host-aware presentation instructions for successful paths and honest failure reporting, with browser presentation in terminal and sidebar only where verified; verify failure and fallback paths using controlled host stubs.

## 4. Evaluation and host gates

- [ ] 4.1 Build fixture evaluations for simple success, relevant downstream session, editorial correction, renderer repair, and post-closure feedback including manual and host-specific automatic variants; verify independent checker fixture calls and expected artifacts in each applicable case.
- [ ] 4.2 Build fixture evaluations for attempt versus effect, contradiction, unavailable verification, current state versus causation, relevant omission/noise, partial failure, ambiguous ordering, and render/presentation failure; verify each expected uncertainty and failure outcome.
- [ ] 4.3 Run deterministic tests and the available safe fixture workflow; record passes, failures and limitations without labeling synthetic results real or running live application workflows.
- [ ] 4.4 Define and, only when separately authorized and host access is available, run real-host acceptance for opening HTML and post-closure feedback; document actual supported hosts and mark automatic transport unsupported until parent-bound delivery is proven. Treat MCP channels as a candidate only, not a required implementation.
- [ ] 4.5 Validate plugin packaging and instructions with applicable local checks; document results and any unverified host combinations for review.
