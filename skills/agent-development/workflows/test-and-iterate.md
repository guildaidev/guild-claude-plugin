# Test the exact candidate and iterate

Before execution, require discovery of `guild_start_profile_agent_test_session`
and a passed candidate validation. If that tool is absent or unknown, report
the server requirement and stop. The old `guild_start_agent_test_session`
is not a fallback and cannot accept the required profile binding.

## Start once, send once, observe the receipt

1. Call `guild_start_profile_agent_test_session` with the selected
   `workspace_id_or_name`, exact `agent_version_id`, and required profile UUID
   as `profile_id`. A validated source version can remain unpublished.
2. Verify the returned `profile_id`, workspace reference and
   `agent_version_override.id` match the intended profile, workspace and
   candidate version. If missing or mismatched, stop before sending input and
   report the binding failure. Retain actual returned identifiers.
3. `guild_send_session_message` with `session_id` and agreed test `content`.
   Keep its returned `id` as `user_event_id` and `wait_after_event_id` unchanged
   as `after_event_id`.
4. `guild_wait_for_session` with those exact three fields. Omit
   `timeout_seconds` for the normal server window. On `wait_complete: false`
   without required action, or a disconnected wait, renew only the same wait
   and receipt. With native MCP Tasks, recover that observation task. Never
   restart a build, session or send because observation expired.

A send receipt does not prove message consumption; waits report
`message_consumed: unconfirmed`. Do not loop over status/events or shell
sleeps. Read `guild_get_session_events` once when needed for actual output or
action details; use returned event IDs and types. Cancellation of a wait stops
observation only and is not proof that execution was interrupted.

## Required action stays attached to its session

When `status: ACTION_REQUIRED`, inspect `action.type`, its real event and task
reference. Report actual input or connection requirements without fabricating
fulfillment:

- **`user_input`:** show the agent's question naturally. If the user already
  supplied the answer, use it; otherwise wait for their answer. Send the answer
  with `guild_send_session_message` to the **same session**. Wait with that
  answer's new receipt, replacing the earlier receipt. Don't start another
  test to answer a `ui_prompt`.
- **`credentials`:** preserve the real credential-request `action.event.id`.
  Use `guild_get_integration_connect_url` for the requested integration with
  that `event_id`, without `owner_id`, `workspace_id` or `workspace_agent_id`.
  This preserves the session request and exact auth configuration. Fulfilled
  requests can legitimately reconnect. Follow the browser/manual/admin handoff
  and observe the same session after fulfillment. Text such as "connected"
  does not fulfill a credential hook. If the event is unavailable, retrieve
  its actual details or report the block; do not invent a request ID.
- **`agent_install`:** explain the actual dependency and required owner action.
  Don't install a production dependency or pretend text fulfills its hook.

On missing or ambiguous credentials, profile membership denial, policy denial,
failed validation or runtime error, show the exact actionable failure and known
evidence. Don't switch credentials, sibling profiles or installed workers to
get a passing result. The session's candidate identity and selected profile
also constrain child agents; installing a child cannot widen that ceiling.

## Review and revise

Read `result-artifact.md` and emit the actual result even when it failed or
needs action. Show the output for review and accept normal feedback.

- Revise behavior by configuring or creating a version on the **same private
  agent ID**, preserving source identity. Validate the new exact version and
  create a **fresh test session** under the selected profile.
- A different test input also uses a fresh session, even at the same version.
  The answer to an active agent question is the same-session exception above.
- Correct profile/connection configuration through its supported setup path.
  Before deliberately rerunning, inspect partial effects and ask how to proceed
  when the prior run may have written externally. Don't replay effects to
  recover an unknown outcome. A new profile requires a new test session.

Keep completion, successful behavior and user acceptance separate. Do not infer
acceptance from a completed wait, validation pass or absence of further errors.
