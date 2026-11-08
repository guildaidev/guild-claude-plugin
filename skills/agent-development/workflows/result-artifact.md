# Present the actual result and accepted-version handoff

Emit a renderer-neutral v1 application artifact from the actual test session.
Kristof owns presentation independently of execution. In Code or Desktop chat,
show usable actual output in the conversation plus the structured envelope as
JSON when no renderer is available. No hook, local server, end-user file write
or persistent Guild Artifact entity is required.

## v1 result contract

A result for a real session has these required fields:

```json
{
  "schema_version": 1,
  "kind": "guild.agent-test-result",
  "agent_id": "actual candidate agent UUID",
  "agent_version_id": "actual tested version UUID",
  "workspace_id": "actual workspace UUID",
  "profile_id": "actual bound profile UUID",
  "session_id": "actual session UUID",
  "execution_status": "completed",
  "output": {"content_type": "text/plain", "content": "Actual session output"},
  "evidence": [
    {"type": "session_event", "event_id": "actual output event ID"},
    {"type": "send_receipt", "user_event_id": "actual send ID", "after_event_id": "actual wait_after_event_id"}
  ]
}
```

Replace example descriptions with returned values. Never emit placeholders as
evidence. Evidence entries carry available session event IDs, real send/wait
receipts, action task/event references, actual service receipts or accessible
output references. Preserve a `user_input` action's event/task reference and
answer receipt when available; distinguish initial input from its answer.
Include observed connection metadata with its actual confidence, such as
browser check required and user-confirmed setup, when relevant. Never invent
provider receipts, verified pins, citations or successful writes. Clearly label
local scripted fixtures and other evidence limits.

`execution_status` is exactly one of:

| Value | Evidence |
| --- | --- |
| `running` | Observation reports running or pending |
| `action_required` | Actual user input, credential or install action is open |
| `completed` | Actual root execution completed; output can still be unsatisfactory |
| `failed` | Actual execution or runtime failure |
| `interrupted` | Explicit evidence that execution was interrupted |

A cancelled or disconnected wait alone leaves the last observed execution
status; it does not establish `interrupted`. Report uncertainty alongside the
artifact. Failed and blocked sessions retain their real output/error evidence.
A setup/build failure before session creation is a setup failure with known
references and recovery instructions, **not** a fabricated session-result
artifact. If a returned session binding is incomplete, report the contract
failure and known references without inventing required IDs.

Preserve actual text or JSON content and an accurate content type:
`text/plain` for plain text, `text/markdown` for actual Markdown,
`application/json` for structured JSON. Keep JSON as its value, not a rewritten
summary. If no output exists, `output` is null; explain its absence in the conversation.
If the actual output is JSON null, retain the JSON content type and null content. For large output, use a real available reference in evidence;
do not invent a download or silently replace output with a summary.

## Review and explicit acceptance

Present the real output and material limitations first, then the envelope.
Ask for normal feedback on whether it meets the intended behavior. A completed
test can have a poor result. Acceptance is the user's separate explicit
decision, never an execution status or automatic production activation.

On feedback, return to the test module: same prototype identity, new version
when behavior changes, fresh test session and a new result. Resolve which
exact version was accepted if there are multiple candidates; never substitute
"latest" for that decision.

## Handoff to Logan after acceptance

Provide a concrete copyable handoff in the conversation, retaining:

- Accepted candidate agent ID and exact version ID, plus source agent/version
  or code reference when the prototype came from an existing agent.
- Exact test input, workspace/profile/session IDs, real send/wait receipt,
  result evidence and the user's explicit acceptance of that version.
- Required integrations, selected MEMBER/SHARED modes, browser setup or
  dedicated connection references, nonsecret variable names/values, observed
  credential confidence and any remaining connection/policy limitations.
- Remaining production gates: target workspace and connections, accepted
  version promotion/selection, install and auto-update choice, trigger or
  schedule setup, authorized smoke test and operation. Logan owns those gates.

Profile configuration remains live, so this evidence records the test's
observed setup, not a promise about future connections or production readiness.
Do not message Logan automatically. Prototype acceptance authorizes this
handoff record; installation, triggers and production writes need their own
explicit deployment request.
