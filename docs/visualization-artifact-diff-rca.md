# Artifact diff failure: retained session 9d584e51

## Result

The missing colours were a collection/projection failure, not a CSS failure.
The normal renderer had no `before` values to compare. No renderer, diff algorithm,
UI bundle or style changed for this correction.

This is offline verification. No application/model run, reload, installation,
external write, source rewrite, review approval, commit or archive occurred.
Tasks 8.1, 18.5 and historical failed 27.3 remain open.

## Exact source

The supplied loopback server on port 64765 was already retired. HTTP connection
failed. The integrated browser connection also timed out. The invocation capability
prefix is deliberately omitted here. Its exact private manifest matched the supplied
prefix and retained final hashes:

- Claude session: `9d584e51-ca23-40a5-b977-3b0df2e8d7c1`.
- Guild session: `01a1e19b-a42a-f268-0000-fcccb07275b3`.
- Tested version: `01a1e195-ffe7-cf83-0000-4751fb703796`.
- Run: `01a1e19b-bf03-4aa6-0000-c7a6254ba16c`.
- Review directory R:
  `/private/tmp/claude-501/-private-var-folders-jb-h186fcqx3wx5hkym0wtct3000000gn-T-opencode-claude-plugin-smoke-gu87lbe--workspace/9d584e51-ca23-40a5-b977-3b0df2e8d7c1/scratchpad/review`.
- Manifest: `R/run-progress-C4RpTK/progress.private.json`, retired at sequence 6.
- Exact HTML: `R/new-review.html`, SHA-256
  `995f5065c909fb90c49dc9b31f5d46c3c9c5acc2a3cde79229025981b30d1fb4`.
- Exact snapshot: `R/final.json`, SHA-256
  `f16df457d966d4df16878ca04f7bec723ef054357eb2b3c467ffa881b9014728`.
- Inputs: `R/session-events.json`, `R/evidence-report.json`, `R/bundle.json`,
  `R/version-sources.json`, `R/draft2.json`.
- Application source: `R/../dejargon-doc-mix/agent.ts`. Lines 190–230 implement
  emission. Lines 387–389 read and emit document state. Lines 398–408 use a
  pre-creation placeholder, then the assigned ID. Lines 419–449 emit both edits.

The original parent transcript is under
`/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode/claude-plugin-smoke-gu87lbe_/config/projects/-private-var-folders-jb-h186fcqx3wx5hkym0wtct3000000gn-T-opencode-claude-plugin-smoke-gu87lbe--workspace/9d584e51-ca23-40a5-b977-3b0df2e8d7c1.jsonl`.
Lines 562–566 record the collector invocation and its eight accepted records with
three rejected acknowledgments. These logs and scripts were read as data, not executed.

## Literal source truth and failure mechanism

| Sequence | Stage | Actual material | Original handling |
| --- | --- | --- | --- |
| 1 | mutation_requested | Title, target `new-document` | Accepted by collection, omitted from bundle because target differs |
| 2 | mutation_acknowledged | completed, metadata_only, no content, empty redactions/gaps | Rejected with missing_gap |
| 3 | artifact_observed | Exactly `\n`, assigned document ID | Shown at creation with no before side |
| 4 | source_selected | Wikipedia source used by the application | Retained |
| 5 | mutation_requested | First insertion text, 1,389 UTF-16 characters | Retained as request evidence, not an observed version |
| 6 | mutation_acknowledged | completed, metadata_only, no content, empty redactions/gaps | Rejected with missing_gap |
| 7 | artifact_observed | First-only document, 1,390 characters | Shown at step 4 with no before side |
| 8 | source_selected | SEC source used by the application | Retained |
| 9 | mutation_requested | SEC insertion text, 4,151 characters | Retained as request evidence, not an observed version |
| 10 | mutation_acknowledged | completed, metadata_only, no content, empty redactions/gaps | Rejected with missing_gap |
| 11 | artifact_observed | Combined document, 5,541 characters | Shown at step 6 with no before side |

Rejected receipt events:

- Sequence 2: `01a1e19b-d6ea-431e-0000-e9e446921a15`.
- Sequence 6: `01a1e19c-aa4b-431e-0000-146f20d8069b`.
- Sequence 10: `01a1e19e-7643-431e-0000-a2c5d0465ffd`.

The projected stream had sequences 3/4/5/7/8/9/11. Its sequence-gap safeguards
correctly invalidated predecessors before each later observed version. The
stage-specific key correctly kept submitted fragments separate from readbacks.
Consequently all displayed versions had only `after`, and the renderer correctly
emitted zero `Content changes` sections. Styling was never reached.

The creation request also cannot pass ordinary target/operation-source matching:
`new-document` is not the assigned document ID. Its actual request timestamp
precedes the original occurrence window. None of these facts permits changing the
message, aliasing targets, inventing an empty baseline or ignoring sequence checks.

## Scoped correction and API

`validateSessionEvidence` now accepts a content-free metadata acknowledgment with
empty redactions/gaps. It remains a receipt with its actual status and envelope.
It does not promise artifact content, so it needs no invented missing-material gap.
Other incomplete stages still require explicit redactions or gaps. Actual receipt
omissions still produce diagnostics. Acknowledgments still cannot bind artifact_id.

Projection-2.0 bindings gain one optional field:

```json
{"evidence_id":"log:actual-request-event","occurrence_id":"actual-creation-step","unresolved_target":true}
```

This explicit option accepts only a non-artifact mutation_requested binding with
a different target in the same service. Normal emitter, session, evidence and time
checks still apply. It preserves the exact request, emits an unresolved-target gap,
breaks stream continuity and supplies no material version or operation-source alias.
Matching targets, acknowledgments and observed-state bindings cannot use it.
Later actual readbacks establish new baselines. Historical projection 1.0 is unchanged.

Instructions require retaining every marked record. Title-only creation requests
and insertion fragments must not masquerade as observed artifact bodies. Missing
or invalid records still break continuity. No changes were required in
artifact-versions.mjs, assemble.mjs, contracts.mjs, render.mjs or diff.mjs.

The postrun-packager integration must explicitly preserve unresolved creation
requests through this binding. Silently dropping them or rewriting their target
is not an acceptable integration. Its source occurrence window must include the
actual request/log timestamps when NEW metadata is assembled.

## Local evidence

Actual retained-source proof directory:
`/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode/artifact-diff-final-QLOzYC/proof/`.

- `report.json` records all original hashes, exact source comparisons, browser
  results and unchanged-input checks.
- `unchanged-original-snapshot.html` is a presentation-only render of exact
  `R/final.json`. It is byte-identical to the original HTML and still has no diff.
- `offline-retained-source-reassembly.html` is NEW normal output from NEW local
  evidence assembled from all 11 exact retained messages. It is not a new generation,
  review, native run or replacement for the original artifact. The derivation adds
  the four omitted envelopes and references, extends only the new creation window
  using actual request/log timestamps, and adds the explicit unresolved binding.
  Historical source/claim/gap prose is retained, not reauthored. That historical
  prose is a limitation of this technical reproduction, not fresh checked copy.
- The original `\n` baseline stays exactly `\n`, not `""`. Step 4 has 1,389 added
  characters and one existing newline. All nonblank document content is green.
- Step 6 has all 1,390 previous characters as context and 4,151 SEC additions.
  The document service inserts before its terminal paragraph newline. The proof
  checks exact old/new reconstruction, not a guessed prefix split or append model.
- `desktop-insert-first.png` shows the first insertion in green.
- `desktop-append-second-additions.png` shows unchanged first-section context and
  the SEC section in green. Mobile/reduced-motion and forced-colour captures are
  alongside them. Forced colours retain visible plus markers and semantic ins.
- All three actual-source browser modes pass: two diffs, no removals, green computed
  addition backgrounds where applicable, cart/dialog use, offline CSP, no overflow,
  no console errors and no external requests. No source links or clipboard were used.

Four new unit regressions cover metadata receipts, normal CLI collection through
assembly/finalization/render, exact blank/empty and absent baselines, and explicit
unresolved-target safety. Existing source/stream/stage/operation/gap and legacy tests
remain. Focused session-evidence tests: **20/20**.

Concurrent-wave full-suite checkpoint: **410 tests, 405 pass, 5 optional retained
transcript tests skipped, 0 failures**. Log:
`.../opencode/artifact-unit-final-xtjeTy`. Counts can increase as the other owners
finish. The parent owns final integrated verification.

Other checks:

- **13/13** fixtures: `.../opencode/artifact-fixtures-8onnHW/cases/report.json`.
- Four synthetic browser modes pass all concern/Dismiss/focus/cart/evidence/privacy
  checks: `.../opencode/artifact-synthetic-browser-HjawG7/temporal/report.json`.
- Reproducible UI check, strict directory-plugin validation, strict OpenSpec
  validation and git diff whitespace check pass.
- Frozen installed plugin: all **159** files match
  `reload-backup-progress-i715inz7/refresh-manifest.json`. Manifest SHA-256:
  `d1ad91f30a865ddf212e39644298caf400d3134d209b43007a02b328ff0a70e4`.

One optional broader browser check against ORIGINAL HTML passed all four synthetic
modes and the actual desktop mode, then timed out opening the comment textarea in
the actual mobile mode after concern/evidence scrolling. Its report remains at
`.../opencode/artifact-regressions-k90N0B/temporal/report.json`. The same scrolled
comment sequence also occurred during local proof development. The dedicated
artifact proof tests cart controls from a fresh document in each mode and passes.
This separate original-page interaction limit was not silently marked passed or
fixed by changing immutable HTML. No new claim of complete mobile acceptance follows.

## Changed paths owned by the artifact correction

- `skills/visualize-scenario-run/scripts/session-evidence.mjs`
- `skills/visualize-scenario-run/tests/session-evidence.test.mjs`
- `skills/visualize-scenario-run/tests/check-retained-artifact-diff.mjs` (new)
- `skills/visualize-scenario-run/references/artifact-capture.md`
- `skills/visualize-scenario-run/SKILL.md` (three retention instructions)
- This diagnostic document (new)
- OpenSpec task section 32, design decision 35 and artifact-specific scenarios only

The other concurrent owners retain their modules and shared integration files.
No observer runtime or bridge was added. The separate progress server is unchanged.
