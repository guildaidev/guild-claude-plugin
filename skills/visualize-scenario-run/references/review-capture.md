# Completed review transport adapter (private)

`scripts/review-capture.mjs` is a pure, bounded format adapter. It reads supplied
strings only. It does not dispatch, discover paths, read files, wait, poll, execute
source content, call models/sources, write output or repair a review. Its parsing
success is **not dispatch proof**, file authentication, independent fact checking,
review approval or permission to render. Normal 1.10 rendering, closed draft 1.4,
optional genuine private reviews, strict source binding, sequential copy/facts,
two-copy/three-render limits and existing agent/model/tool restrictions stay intact.

## Actual retained failure

Read-only format evidence comes from session
`7e163dd8-e5f2-46d6-aba6-6ded349906fc`, CLI version `2.1.312`:

- Editor `agent-a1c8142b2480b2ddb.jsonl:75–76`, `100–101`, `134–135`: native
  `Agent` dispatches and `user.tool_result` launch metadata bind the copy/fact
  child IDs to exact `tool_use_id`, parent identity and original task prompt.
- Copy children `agent-af35e5af087dfaf18.jsonl:34–35` and
  `agent-a8b27298378cbeb6d.jsonl:34–35`: final assistant message has
  `stop_reason:"tool_use"` and exactly one `SubagentHandback` tool. The complete
  review is its **string** `input.message`, also echoed under `wireToolInputs`.
  The following **user** row has the matching `tool_result`,
  `sourceToolAssistantUUID`, `parentUuid`, `toolEndsTurn:true`, and
  `toolUseResult:{success:true,message:"Report delivered to your caller."}`.
  Its tool-result text is exactly the JSON encoding of that success record.
- Editor `:86`, `:105`, `:140`: native user-message forwarding frames name the
  child in `<agent-message from="…">`, mark it as model output and indent every
  report line by two spaces. A frame-looking substring inside source text is not
  an identity record. The adapter compares the entire known frame and exact body;
  it does not recursively search strings or arbitrarily extract object fields.
- Editor `:110` carries a native completed task notification bound to the same
  child and dispatch tool ID. A notification alone is not a full review. A task
  can later resume, so completion must bind an exact hand-back and receipt.
- Editor `:89–90`, `:108–126`: capture repeatedly returned the generic
  `input_output` error. Some earlier attempts also used an incorrectly ordered
  positional CLI signature; path troubleshooting followed. Even the exposed real
  transcript cannot satisfy the old parser: its final semantic row is **user**,
  not assistant `end_turn`. `nativeReview` in `review-io.mjs:65–80` intentionally
  accepts only the latter shape. Re-running it cannot fix this format mismatch.
- Editor `:154–155` uses the same turn-ending hand-back/receipt for its own
  narrative report. That prose is not review JSON and must not be captured as one.
- Fact child `agent-a2c96c8629a012a54.jsonl:79–80` uses this same transport but
  explicitly reports missing read clocks. Capture preserves its null clocks,
  capability diagnostic and findings; this **does not make it a valid factual
  review**. Existing validators still reject invalid clocks/extra fields.

The expected benefit is avoiding approximately **25–40 seconds** of repeated
format/path troubleshooting. This is an estimate, **not a new measured native
latency result**. No model re-review is needed merely to translate a completed
supported transport.

## APIs and closed packet

```js
import { captureLegacyReview, readReviewCapturePacket, ReviewCaptureError }
  from './review-capture.mjs';

const originalReview = captureLegacyReview(explicitCompletedJsonlText, agentId);
const { review, reviewText, provenance } = readReviewCapturePacket(packetText, binding);
```

`captureLegacyReview(text, agentId)` preserves the existing `nativeReview`
selection/identity/closure policy, including its whole-JSON fence handling. It
adds bounded input and safe typed diagnostics, not a relaxed tool-result fallback.
Existing `review-io.mjs` is unchanged; parent-owned integration is separate.

`readReviewCapturePacket` accepts a JSON **string** with exactly these fields:

```json
{
  "capture_version": "1.0",
  "format": "native-handback",
  "transcript": "THE EXPLICITLY SUPPLIED COMPLETE CHILD JSONL",
  "correlation": "THE EXPLICITLY SUPPLIED COMPLETE PARENT JSONL"
}
```

The other supported format is `forwarded-handback`. It requires the same child
hand-back/receipt proof **and** the exact parent forwarding frame. A forwarding
frame, async receipt, task notification, arbitrary tool JSON or naked review
object alone is insufficient. There is no arbitrary field-grep, auto-detection,
legacy-on-error fallback, guessed transcript path or compact-alias expansion.

Pass an independent binding object containing:

| Field | Required value |
| --- | --- |
| `status` | Exactly `completed`; never an async launch or progress state |
| `kind` | `copy` or `fact` |
| `sessionId` | Native parent/child session identity |
| `parentAgentId` | Exact native parent agent ID, or explicit `null` for the root |
| `agentId` | Exact native child agent/task ID |
| `reviewerId` | Expected logical reviewer/checker ID, not the native child ID |
| `candidateDigest` | Expected current candidate's exact lowercase SHA-256 digest |
| `dispatchUuid`, `dispatchToolUseId` | Exact parent dispatch row/tool IDs |
| `launchUuid` | Exact native launch-receipt row ID |
| `completionUuid`, `handbackToolUseId` | Exact final child hand-back row/tool IDs |
| `receiptUuid` | Exact successful turn-ending child receipt row ID |
| `forwardUuid` | Exact parent forwarding row ID; required for forwarded format |

The adapter verifies the dispatched restricted role, parent/session/child identity,
launch metadata, original child root-task text, exact final hand-back and successful
closure. It rejects mixed-agent transcripts, later child rows/API requests, repeated
hand-backs, duplicate semantic UUIDs, second task roots, mismatched wire echoes,
later same-role dispatches/resumes and matching non-completed task notifications.
It never falls back to an earlier response. It checks the expected logical reviewer
and candidate digest without editing either. A first-copy response becomes
historical when a second copy is dispatched; it cannot masquerade as current.

`reviewText` is the **unmodified** original `SubagentHandback.input.message`
string, including whitespace/fences. `review` is exactly its parsed JSON object;
no verdict, finding, clock, digest, rule or prose changes occur. The private
`provenance` records matched IDs, completion shape and SHA-256 hashes of report,
child transcript and parent correlation text. It explicitly marks records as
caller-supplied, not authenticated, and requires review validation before writing.
Do not put any of this provenance in public UI, prompts or user-facing chat.

## Trust boundary and parent integration

Only after supported **native completion**, consume explicitly exposed complete
records once. Retain the expected target, dispatch identity and completion receipt
in the parent; do not derive authority from a review's self-asserted fields. If
native metadata is not available, retain a capability limitation instead of
inventing correlation. A caller-provided file, wrapper or JSON packet can be forged
or truncated; checking its shape/hashes cannot authenticate the file, prove native
dispatch, detect an omitted resume/cancellation or establish currentness. The
parent is responsible for trusted acquisition, complete current record scope,
authorization and rejecting cancelled/superseded targets before invocation.

The adapter supports the **observed** async-launch/turn-ending-hand-back shape,
not hypothetical synchronous receipts, arbitrary future host envelopes, redacted
or truncated record sets, all possible cancellation-event schemas, or unsupported
forwarding variants. Unknown variants fail capture; keep the original private
response and diagnostic without repeated troubleshooting or a formatting-only
model call. No need to read or execute retained scripts/configuration.

Wave-2 parent-owned integration should explicitly select this packet adapter or
the unchanged legacy path. Do not downgrade a failed packet to another format.
Then validate the returned review against the **current unchanged candidate**:

```js
const captured = readReviewCapturePacket(packetText, trustedBinding);
const checked = kind === 'copy'
  ? validateCopyReview(candidate, captured.review, { requirePass: false })
  : validateFactualReview(candidate, captured.review);
if (!checked.ok) return checked; // No output/approval and no repair.
await writeFile(newOutputPath, `${JSON.stringify(captured.review, null, 2)}\n`,
  { flag: 'wx', mode: 0o600 });
```

This adapter writes nothing. Candidate preflight, optional compact expansion (if
separately supported), existing copy/fact validators, secret-safe diagnostics,
private `wx` output and CLI wiring remain parent-owned. Preserve the original
response and all historical records; invalid private review is not a normal-1.10
render gate. Capture never consumes/refunds/resets a copy claim or changes tools.

## Bounds, diagnostics and verification

Hard bounds: packet 24 MiB; each JSONL string 10 MiB/50,000 nonempty rows; report
2 MiB; parsed nesting depth 100. Source strings never become code or file paths.
Only known top-level record shapes are considered; nested source text, API-request
blobs, quoted frames, thinking and arbitrary tool outputs cannot supply a report.
Both naked JSON objects and an entire `json` code fence are accepted as the final
report; prefixes, multiple objects, partial JSON, arrays and primitives fail.

`ReviewCaptureError` has a stable `code` and fixed safe `message`; `toJSON()` emits
only those two. Codes: `format`, `bounds`, `json`, `identity`, `correlation`,
`incomplete`, `superseded`, `tools`, `review`, `stale`. No source content, paths,
secrets or parser exceptions are included. Caller filesystem errors need equally
safe diagnostics. These codes distinguish transport failure from later validator
failure; neither is fabricated approval.

Run `node --test skills/visualize-scenario-run/tests/review-capture.test.mjs` for
synthetic format/security/legacy regressions. The separate retained test is opt-in:
provide four **explicit** paths via `REVIEW_CAPTURE_PARENT_JSONL` (the editor
JSONL), `REVIEW_CAPTURE_COPY1_JSONL`, `REVIEW_CAPTURE_COPY2_JSONL` and
`REVIEW_CAPTURE_FACT_JSONL`, then run `review-capture-retained.test.mjs` with Node's
test runner. Without these paths it skips, never discovers them. It compares both
native and forwarded results deeply against the already genuine original
hand-back JSON, preserves exact report bytes and rejects wrong bindings. First
copy is tested at its explicitly historical pre-second-dispatch boundary, and is
rejected against the full later parent record. These are retained-data/local
format tests, not fresh native dispatch, live source verification, quality approval,
user acceptance or a measured speed guarantee.
