# Private review codec 1.0

This is a lossless **JSON transport**, not a reviewer, source reader, dispatcher,
approval mechanism or new render contract. Current draft 1.4/snapshot 1.10,
source binding, optional private quality records, two copy calls, three renders,
Sonnet author/copy, Opus facts and all historical contracts remain unchanged.
The codec accepts packet 1.1 for candidates 1.7–1.10. It does not migrate older
records. Full expanded packets and responses remain valid compatibility inputs
to the existing pipeline. A malformed compact record remains malformed feedback;
never spend another dispatch merely to serialize it again.

## APIs and integration ownership

`scripts/review-codec.mjs` exports pure functions. It performs no file writes,
network calls, native dispatch or source reads.

```js
const compact = packReviewPacket(fullPacket, candidate);
const restored = expandReviewPacket(compact, candidate);
// deepStrictEqual(restored, JSON.parse(JSON.stringify(fullPacket)))

// The reviewer genuinely authored response; the native transport must establish
// final completion and actual agent identity BEFORE this deterministic step.
const record = expandReviewResponse(response, compact, candidate);
// Also accepts the matching original fullPacket as its second argument.

// Optional compatibility encoder for an ALREADY genuine, valid full record:
const wire = packReviewResponse(record, fullPacket, candidate);
// deepStrictEqual(expandReviewResponse(wire, fullPacket, candidate), record)

const schema = reviewResponseContract('copy'); // or 'fact'
const counts = reviewCodecByteCounts(fullPacket, compact, record, wire);
```

All pack/expand functions accept a final optional limits object. Limits may be
lowered, never increased beyond `REVIEW_CODEC_LIMITS`:

- `bytes`: 64 MiB UTF-8 JSON per value;
- `nodes`: 500,000 nodes per value; `depth`: 100;
- `references`: 50,000 dictionary definitions;
- `workBytes`: 32 MiB cumulative lexical/hash/comparison/expansion work;
- `workNodes`: 500,000 cumulative node/property visits.

Work limits are shared across **one entire public operation**, including internal
decode, preparation, canonical repacking and comparison. They do not reset at
each internal phase. The work-byte accounting charges processed JSON lexemes,
string comparisons, hashes and repeated expanded material; it also reserves
conservative ancestor-serialization work before calling the unchanged production
validators. Work limits can reject a value that is within the per-value byte/depth
limits. They are algorithmic resource limits, not a promise about total process
RSS or available Node heap. Other process inputs/runtime allocations are outside
this module's control.

Both encoded and expanded values are bounded. Exceeding any bound throws typed
`ReviewCodecError` with `code: "bounds"`, message `review_codec:bounds` and a safe
`toJSON()` diagnostic. It never truncates material, removes `private_context` or
reduces the coverage checklist. Non-JSON native
objects, Buffers, dates, accessors, sparse arrays, cycles and nonfinite numbers
are rejected, not coerced. Undefined object properties from the existing in-memory
packet builder are absent exactly as in its JSON file serialization. No Unicode,
line-ending, whitespace, source text or array-order normalization occurs.

Parent integration points (not modified by this module):

1. **Packet builder:** build the complete original packet first. Select the
   compact envelope explicitly/default it in the parent-owned `review-io.mjs`.
   Retain an explicit full-packet option for compatibility. Preserve the exact
   matching packet privately; do not regenerate it from changed guides later.
2. **Native instructions:** give the restricted reviewer that one saved packet,
   its `resolution` instructions and its `response_contract`. Read the complete
   dictionary/input/inventory, using additional bounded Read slices when needed.
   Read limits are not permission to skip material. Do not paste duplicate payloads
   into the delegation prompt. No shell, decompressor, eval or new source API is
   needed by the read-only reviewer. The factual agent still makes its own actual
   authorized source reads, with genuine observed timestamps and clock limitations.
3. **Capture:** after actual native final completion/identity validation, detect
   response `wire_version: "1.0"`. Load the exact supplied matching packet and candidate;
   call `expandReviewResponse`. It validates the expanded result through existing
   `validateCopyReview(..., {requirePass:false})` or `validateFactualReview`.
   Run the existing validators again before the capture module's exclusive private
   write. Do not edit, repair or restamp the record. Preserve the actual compact
   hand-back and native provenance privately as well. An ordinary full response
   goes through its original validators, not compact expansion.
4. **Wave 2:** test actual packet/capture wiring, native hand-back parsing and
   source-navigation/grounding extensions together. Additive original-packet
   extensions are retained losslessly and included in its manifest binding.
   This module does not integrate or claim independent dispatch proof.

An explicit file path, parsed assistant text or correct manifest ID is **not**
proof that a distinct agent dispatched, read the input or made source calls.
The parent-owned native capture module must establish that transport separately.
The codec cannot determine whether a plausible judgment or timestamp is genuine.
It never supplies missing ones.

## Readable packet wire contract

The envelope is closed; every listed property is required:

| Property | Meaning |
| --- | --- |
| `codec_version` | Exactly `"1.0"`. |
| `kind` | `"copy"` or `"fact"`. |
| `manifest_id` | SHA-256 of canonical manifest JSON. |
| `manifest` | Exact candidate/schema/packet/rule/inventory binding described below. |
| `resolution` | Complete literal reference-resolution instructions, included in every packet. |
| `response_contract` | Closed native JSON response descriptor in the existing contract vocabulary. |
| `dictionary` | Ordered `{id, value}` definitions with contiguous IDs `d0`, `d1`, … |
| `input` | Entire original packet with only documented lossless references/field aliases. |

Definitions are literal JSON, not compressed binary. A value
`{"$review_ref":"d3"}` means the **whole exact value** of definition `d3`, not
an excerpt, source fetch, executable instruction or hash-only substitute.
Definitions may reference only earlier definitions. Input may reference any
definition. Resolve in ascending numeric ID order, substitute whole values and
retain all array positions. Repeated subtrees/strings of at least 96 serialized
characters are dictionary candidates; smaller repeated values can remain inline
for readability. Large repeated material is physically stored once, not hidden
alongside an uncompressed duplicate original packet.

Duplicate detection uses incremental structural hashes, exact serialized lengths
and actual ordered-value equality. It retains hashes and references to original
JSON values, **not complete serialized strings for every subtree/unique ancestor**.
Canonical binding hashes stream the unchanged sorted-key JSON into SHA-256 rather
than build ancestor strings. JSON byte bounds are measured without serializing
the entire value. This removes depth-times-payload serialization retention without
changing field/claim aliases, dictionary order, canonical digests or wire versions.

Source objects that happen to contain either reserved key are escaped as
`{"$review_literal":[["key",value], ...]}`. This means an ordinary literal object
whose ordered key/value pairs are supplied; resolve values, never interpret keys.
For example, `{"$review_literal":[["$review_ref","ordinary source text"]]}`
recovers an ordinary source object, not a reference. This also preserves literal
`__proto__` keys safely. Duplicate literal keys are invalid.

For copy input only, each original `fields` entry becomes `{field_id, text}`.
Its exact path, whole-field UTF-8 digest and protected-source flag live once in
`manifest.fields`. Expansion restores the original complete inventory. Semantic
context, reference guides, rules, header policies and all extra packet content
remain in `input`/dictionary. The fact input retains the **entire exact candidate**,
including every field in `source_bundle`, with duplicated material referenced
losslessly rather than removed. Full source context is not replaced by hashes.

### Manifest

The manifest has `codec_version`, `kind`, `candidate_schema_version`,
`candidate_digest` (the original factual digest), `candidate_sha256` (canonical
**whole candidate**, including display), `packet_version`, `packet_sha256`,
`response_contract_sha256`, `fields`, `claims` and, for copy, `rule_versions`.

`fields` is an ordered array of closed entries:
`{id:"f1", field_path, field_digest, protected_source}`, then `f2`, etc.
`claims` is an ordered array `{id:"c1", claim_id}`, then `c2`, etc.
IDs are case-sensitive, contiguous, packet-local and never portable to a new
candidate. Every authored and protected field and every claim is included.

Hashing uses recursively key-sorted JSON objects, unchanged array order and JSON
string escaping, then UTF-8 SHA-256. The packet hash binds all exact guides,
requirements, schemas, policies, text, source/semantic context, packet extensions
and candidate path; rule identities and field inventories remain legible too.
The original factual digest is not recomputed into an old response as an approval.
Instead, the reviewer returns the packet's exact `manifest_id` as the response's
`manifest_digest`, alongside its unchanged top-level `candidate_digest` (copy) or
`factual_digest` (fact). Expansion checks both bindings against the retained packet;
it does not replace or restamp the returned candidate digest. Native transport can
correlate logical reviewer identity and candidate digest before expansion.

Expansion repacks canonically and compares the entire envelope. Unknown envelope,
manifest/control keys, changed payloads or descriptors, duplicate IDs, unused
definitions, unknown/forward/cyclic refs, bad field order and stale/mixed candidate
bindings fail. Original packet extension data is data, not a control schema; it
is preserved and hash-bound. Unkeyed hashes establish consistency, not authenticity:
an attacker replacing candidate, packet and response together is outside this
codec's trust boundary. Capture must use the original trusted private inputs.

## Native response contract

Return **one JSON object**, not a summary, patch, partial review or regenerated
candidate. The envelope and every nested record are closed. No keys are optional
except a copy finding's `suggestion`. The actual packet's `response_contract`
contains the executable descriptor; the original expanded contract remains the
validation target. Never copy example judgments as defaults.

### Copy

Required top-level keys:

`wire_version:"1.0"`, `kind:"copy"`, `manifest_digest`, `reviewer_id`, `candidate_digest`, `verdict`,
`passages`, `exemptions`, `findings`.

- `verdict`: genuine `pass`, `revise` or `blocked`, never derived by the codec.
- Each passage: `{field_id, guide, routing_reason, sdlc_review, exceptions}`.
  `guide` is `asd-ste100`, `economist` or `unresolved`; `sdlc_review` is
  `pass`, `revise` or `blocked`; `exceptions` is an explicit array of explanations.
- Each exemption: `{field_id, reason}`. Only protected source fields are exempt.
- Each finding: `{field_id, rule_group, rule_id, severity, explanation,
  semantic_risk}` plus optional `suggestion`. All meaning fields remain full text.
  Rule groups, required/advisory severity and none/possible/changes_meaning risk
  retain their original enums and semantics. Preserve every finding and its order.

Cover every authored field exactly once with a passage, and every protected field
exactly once with an exemption, including on revise/blocked. There is no wildcard,
range coverage, inferred passage, shared default judgment or implicit exemption.
Multiple separate findings for one passage remain separate findings. Expansion
substitutes only field path/digest and exact rule identities; the top-level
candidate digest and reviewer identity are the original returned values.
Exclusive ASD versus Economist routing, SDLC v2 afterward, human-fix ASD routing,
unresolved/blocked semantics, exceptions and semantic-risk rules are unchanged.

These are **schema-valid illustrative rows**, not a complete review or seeded
approval. Use the real manifest IDs and genuinely assess each real passage:

```json
{"field_id":"f12","guide":"unresolved","routing_reason":"The available context does not establish whether this is an internal operation or a completed external effect.","sdlc_review":"blocked","exceptions":[]}
```

```json
{"field_id":"f12","rule_group":"meaning","rule_id":"scope-clarification","severity":"required","explanation":"The text does not distinguish acceptance from an observed completed effect.","semantic_risk":"possible"}
```

### Factual

Required top-level keys:

`wire_version:"1.0"`, `kind:"fact"`, `manifest_digest`, `checker_id`, `factual_digest`, `checks`, `findings`.

- Each check: `{id, operation, source_id, observed_at, result}`. `operation` must
  still be explicitly `read`; result is `read` or `unavailable`. The checker must
  actually make each authorized read. Timestamp remains a genuine supported full
  UTC timestamp, not an event time or an invented midnight. No source IDs,
  read results, operation values or timestamps are generated during expansion.
- Each finding: `{claim_id, check_refs, finding, explanation, gaps}`. Here
  `claim_id` is the manifest alias `c1`, etc. `check_refs` are the check IDs actually
  authored in this response, **not** field/claim aliases. Every original claim
  needs exactly one complete finding; all qualifications and gaps remain full text.

Expansion restores the original claim IDs and each check's `checker_id` from the
genuine top-level checker identity. It preserves the returned top-level factual
digest unchanged after checking its binding. It adds no checks,
times, feedback, confirmations, gaps or missing judgment fields. A compact record
cannot repair invalid date-only timestamps, missing claims, wrong identities or
unsupported coverage. Distinct-agent/source provenance remains a native gate.

Schema-valid illustrative finding row, not factual verification:

```json
{"claim_id":"c3","check_refs":["read-history-3"],"finding":"inconclusive","explanation":"The independently read record shows current state, not when this run caused it.","gaps":["Historical causation is not established by this read."]}
```

## Measurements and tests

Earlier Wave 1 read-only measurement on retained session
`7e163dd8-e5f2-46d6-aba6-6ded349906fc/scratchpad/review/candidate2.json`, schema
1.10, using the **then-current** packet 1.1 guide bytes and `JSON.stringify` UTF-8 counts:

| Packet | Full bytes | Compact bytes | Reduction |
| --- | ---: | ---: | ---: |
| Copy | 125,797 | 107,588 | 14.47% |
| Factual | 163,775 | 104,573 | 36.15% |

At that measurement, both expanded packets deep-equaled the entire original JSON
packet and the retained candidate buffer was identical before/after. These are
historical counts, not fresh counts after parent integration/guide changes.
During the P2 memory follow-up, the unchanged retained candidate was rejected by
the current production validator with `$.session_evidence / time_binding`; the
codec did not bypass that check or rewrite retained evidence to remeasure it.
No retained source/packet is written.
The parent separately measured original packet construction at about 2.006/1.09
milliseconds. Neither those timings nor byte savings measure model latency.

A small earlier synthetic concern fixture (36 copy fields, five factual claims) measured
blocked-copy feedback at 9,031 → 5,531 bytes and qualified factual feedback at
2,238 → 2,177 bytes. These are **synthetic serializer measurements**, not genuine
review records or approval. Small packets can grow: that fixture's copy/fact
inputs are 42,031 → 46,560 and 26,842 → 34,143 bytes because the manifest/schema
cost exceeds the duplicated payload saved. The codec does not promise savings
for every input. Estimated total native savings of 30–60 seconds remain
**unmeasured**. No native/model/application run or speed claim follows.

Run deterministic tests with:

```sh
node --test skills/visualize-scenario-run/tests/review-codec*.test.mjs
```

The retained measurement is opt-in: set `REVIEW_CODEC_RETAINED_CANDIDATE` to one
exact authorized candidate path and run the same tests. There is no path discovery
or fixed private-path dependency. Tests cover complete packet/response deep equality,
Unicode/verbatim text, duplicated source bundles, reserved-key escaping, immutability,
bounds/amplification, stale/mixed bindings, aliases/unknown keys, all passage/claim
coverage, genuine-judgment field preservation and rejection by production validators.
They do not establish reviewer compliance, new native capture transport or measured
end-to-end latency. Integration and independent Wave 2 review remain parent-owned.

### Wave 2 P2 memory regression

The independent review found that the former dictionary implementation retained
the complete JSON serialization of **every** sufficiently large ancestor, even
unique ancestors. A 2 MiB string inside 70 unique `{nested: ...}` wrappers could
therefore abort Node with a 128 MiB heap despite fitting the published value bounds.
The fix uses structural fingerprints and streaming canonical hashing as described
above, plus cumulative work bounds and typed diagnostics on both pack and expand.

`review-codec-memory.test.mjs` runs real Node subprocesses with
`--max-old-space-size=128`, no services/models/files. A valid factual packet gets
the complete additional private payload. Each subprocess must either deep-round-trip
the **whole packet**, including exact candidate/source_bundle, or return typed
bounds failure. A signal, timeout, OOM abort, partial payload or untyped error fails
the test. One verified local run produced:

| Case | Full input bytes | Outcome | Process peak RSS (KiB) |
| --- | ---: | --- | ---: |
| 512 KiB string, 70 unique wrappers | 560,426 | Exact round trip | 61,504 |
| 2 MiB string, 70 unique wrappers | 2,133,290 | Exact round trip | 81,168 |
| Amplifying dictionary | 37,162 before replacement | Typed bounds failure during expansion | 56,016 |

RSS is an observed local subprocess estimate (`resourceUsage().maxRSS`), not a
portable memory ceiling or native performance measurement. The encoded amplification
case would resolve to 256 MiB of repeated text; it fails before canonical rebinding.

A current valid representative source-bound fixture with repeated exact material
still deep-round-trips, including all factual source_bundle bytes:

| Packet | Full bytes | Compact bytes |
| --- | ---: | ---: |
| Copy | 181,574 | 94,180 |
| Factual | 311,113 | 88,615 |

The tests also compare streamed SHA-256 against the original canonical algorithm,
including lone surrogates/control escapes, and prove that expansion's additional
decode/repack work consumes the same budget rather than resetting it. These tests
are deterministic local memory/codec evidence, not native reviewer compliance or
new approval. The 30–60 second native-savings estimate remains unmeasured.
