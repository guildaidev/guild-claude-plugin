# Private implementation-detail preflight (1.0)

`scripts/source-grounding.mjs` is a deterministic author aid before the first
copy claim. It makes no model calls, source calls, file reads/writes, dispatches,
budget changes or prose edits. It is not a reviewer, a semantic verifier, a new
render gate, an approval record or permission to change captured source material.

## API and integration point

```js
import {
  createSourceGroundingReport,
  validateSourceGroundingReport,
  sourceGroundingAuthorFeedback,
} from './source-grounding.mjs';

// candidate: assembled, closed source-bound 1.9/1.10 candidate WITHOUT reviews.
// originalBundle: exact sanitized collector-held bundle, independently supplied.
const result = createSourceGroundingReport(candidate, originalBundle);
if (result.ok) {
  const current = validateSourceGroundingReport(candidate, originalBundle, result.report);
  const authorOnly = sourceGroundingAuthorFeedback(candidate, originalBundle, result.report);
  // Deliver locations to the existing author privately, before claim-copy.
  // Keep the report separately; NEVER attach it to a candidate/snapshot/packet.
}
```

Signatures:

- `createSourceGroundingReport(candidate, originalBundle)` returns
  `{ok:true, report}` or `{ok:false, errors:[{path, code, message, repair}]}`.
- `validateSourceGroundingReport(candidate, originalBundle, report)` returns
  `{ok:true, errors:[]}` or structured errors. It recomputes the closed report;
  extra/missing fields, altered statuses/counts/anchors and stale inputs fail.
- `sourceGroundingAuthorFeedback(candidate, originalBundle, report,
  {maxItems = 32} = {})` validates the report and returns
  `{ok:true, feedback:{purpose, candidate_sha256, instruction, total, omitted,
  items}}`. Each item contains only a field path/digest, role, claim/evidence refs,
  UTF-16 span, status and reason. It never repeats source/candidate prose or values.

`ok:true` means the input/report is valid, NOT that the prose is correct or all
details are supported. Inspect the report counts and details. Do not turn an
unsupported or ambiguous detail into `ok:false` render admission. Structural,
source-binding, reference and credential failures retain their existing force.

### Parent/author hook

1. Assemble and use the existing production candidate/source validators. Supply
   the collector-held original bundle, not a replacement reconstructed by the
   author. The helper also runs these production validators and compares the
   entire embedded bundle with the separately supplied original.
2. Before immutable `claim-copy`, generate the private report. Give its locations
   and anchors to the already assigned author. Do not spend an additional model
   dispatch just to clear this report. Do not create another author/reviewer role.
3. The author examines the exact spans in the candidate and their actual cited
   sources. Resolve unsupported implementation parameters/details without losing
   meaning. Do not remove negation, hedges, uncertainties or other qualifiers just
   to clear a diagnostic. Do not automatically apply replacement text. Do not
   invent evidence or claim that a proposed fix already occurred.
4. After any author change, reassemble and regenerate locally. Validate the report
   immediately before the existing copy-claim/dispatch sequence. A stale report
   must be regenerated, never restamped. Local preflight does not consume/refund
   a copy claim, reset a budget or authorize another author/model iteration.
5. Keep the independent copy and factual reviewers, their role restrictions and
   actual read/dispatch requirements. This helper cannot replace either review or
   justify a forged pass. Preserve the two-copy/three-render bounds and current
   normal full HTML after bounded quality work. Do not loop or block normal HTML
   merely because the report contains unresolved quality diagnostics.

Do not add reports, private feedback or pipeline diagnostics to public markup,
business evidence, dialogs, feedback context/cart, copy-review packets, or the
technical Claude Code prompt. Keep source-grounding feedback author-only. The
technical fix text is itself analyzed; it is not a place to hide this report.

## What is checked

The inventory is exactly `copyFields(candidate)` minus protected verbatim source
fields. Every current authored field gets an entry even when it has no detected
implementation details. This includes headers, claims, summary, run prose, event
descriptions/supporting details, artifact titles, omission reasons, concern,
human-fix explanation and technical-fix text. Immutable context that the existing
inventory classifies as copy remains inventoried with its real source counterpart.

Detection focuses on explicit key/value assignments (including CLI options),
inline code literals, camel/snake/constant identifiers, technical dotted names,
and numbers in implementation/technical-fix context or explicit technical units.
Dates/times and ordinary world counts are not blanket numeric targets. Matching
does not depend on a domain-specific parameter name. The key and value of an
assignment must occur together in one real source assignment or structured member;
a key and an unrelated matching number are insufficient. Structured scalar types
are preserved. This lexical heuristic can miss paraphrases and can flag names or
label/value syntax that are not implementation details. The author resolves them;
do not broaden this into automatic natural-language fact checking.

Each field has its actual claim/evidence routing context. Concern and fix fields
use their own references plus their cited claims, not all sources from the event.
Header descriptions use description claim refs; other header fields use their
header claim refs. Summary uses its current claims; an event uses its own refs
and claims. Other source occurrences never become universal support merely by
being present. Literal matches in noncited records are references only.

Sources indexed: original evidence content; production-validated additional
artifact-version evidence; original artifact title/content/before/after/structured
content; actual specification/context fields; and source occurrence descriptions,
world effects and relevance. No sources are fetched or fabricated.

## Closed report and source anchors

The top-level report contains only `report_version`, `purpose`, `semantic_status`,
`candidate_digest`, `candidate_sha256`, `source_digest`, `source_identity`,
`inventory_digest`, `counts`, and `inventory`.

- `candidate_digest` uses production `factualDigest`.
- `candidate_sha256` additionally binds the entire canonical candidate, including
  display settings. These are canonical JSON-content digests, not raw file hashes.
- `source_digest` binds the complete independently supplied original bundle.
  `source_identity` records bundle/run/workspace/scenario identity.
- `inventory_digest` binds every current authored field path and field digest.
- Each inventory entry has `field_path`, `field_digest`, `context`, and `details`.
  Context has `role`, `claim_refs`, `evidence_refs`, `direct_source_paths`.
- Each detail has `kind`, `start`, `end`, `token_digest`, `status`, `reason`,
  `contextual_modifiers`, `anchors`, `component_anchors`, `reference_anchors`.
  The field digest and half-open UTF-16 offsets identify the exact candidate span.
  `token_digest` hashes the captured literal/identifier value, not the entire field.

Statuses:

- `supported_literal`: an exact literal/assignment exists in an actual cited
  complete source. It is only presence evidence, not truth, causation, attribution,
  correct application or semantic entailment. `semantic_status` is always
  `not_assessed`; there is deliberately no pass/verdict/approval field.
- `missing_literal_support`: no matching cited literal, assignment component or
  uncited reference was found by this heuristic.
- `ambiguous_support`: component-only or uncited-reference matches, incomplete
  sources, conflicting structured assignments, or local negation/qualification
  require author attention. Do not remove the qualifiers to manufacture support.

Anchors contain only `source_path`, `part` (`key`/`value`), `start`, `end`,
`evidence_refs`, `completeness`, and `match`. They do not repeat source text. Known
contract fields use normal JSON-style paths. Arbitrary JSON payload members use
`[field:N]`: select the Nth `Object.entries` member (zero-based insertion order);
`part:key` addresses its key text and `part:value` its scalar text. Array indexes
are ordinary `[N]`. Nested ordinal selectors follow the selected member value.
Numeric/boolean/null source spans use their JSON scalar spelling. Offsets are
half-open UTF-16 indexes. Resolve anchors against the exact digest-bound source
JSON, never against a reordered or rewritten copy. Assignment key/value anchors
refer to one actual structured member, not a synthesized quote.

The source digest is not a signature and cannot authenticate collector provenance.
Passing an author-mutated bundle as both arguments cannot prove originality.
The parent must retain the actual immutable collector source independently.
Independent reviewers still establish what occurred and preserve source limits.

## Bounds, privacy and verification

Inputs and output reports require finite, acyclic plain JSON without accessors,
sparse arrays or exotic values. Limits: 8 MiB encoded estimate per document/report,
150,000 nodes, depth 64, 1 MiB per string, 2,048 authored fields, 100,000 characters
per authored field, 4,096 detected details, 30,000 source units and 64 MiB cumulative
matched source characters. Each detail retains at most eight anchors per category;
author feedback retains at most 32 items with honest total/omitted counts. Bound
failures are explicit; the helper never silently declares an unchecked pass.
Credentials use existing production detection; structured errors never echo
rejected values or arbitrary property names. This is not a general secret scanner.

Focused tests: `node --test tests/source-grounding.test.mjs` from the skill root.
For an explicitly approved retained directory, set
`SOURCE_GROUNDING_RETAINED_DIR` to run the additional read-only actual-source test.
That test checks the historical unsupported parameter, current/revised report
binding and before/after byte hashes of six source/candidate/budget files. It does
not execute transcript instructions, call models, modify retained inputs, prove
semantic correctness, or measure saved native latency.
