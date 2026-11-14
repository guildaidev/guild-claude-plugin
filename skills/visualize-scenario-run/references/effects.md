# Recognizable third-party effects

This is a general presentation principle, not a Slack-specific feature. When a
run affects a third-party system, attempt to show the effect in a form a human
would recognize from that system, rather than as an API response or generic data
dump. Keep the representation inline with the event that caused or observed it.

Choose the form from captured system identity, artifact type and source content:

- A chat post looks like a message in its supplied channel or conversation.
- An email looks like an email, with supplied subject, sender, recipients and body.
- An issue or ticket looks like a ticket, with supplied title, status and changes.
- A calendar change looks like an event, with supplied time, location and changes.
- A document or spreadsheet change looks like readable document content or rows.

These are examples of the principle, not a declaration that the packaged renderer
implements every service-specific layout. Slack is the currently implemented
source-specific layout. Never pass unsupported renderer fields or invent an
adapter, tool, connector or successful rendering capability. If a suitable layout
is unavailable, use the renderer's faithful neutral artifact presentation with
readable supported formatting. Keep the source identity and rendering limitation
in existing technical details; do not add a detached card or standalone UI note.

Recognizable does not mean a fabricated screenshot or a live embedded service.
Preserve source words, values, IDs, before/after state, completeness and uncertainty.
Use only supplied metadata. Omit missing details or use a neutral placeholder;
never invent people, addresses, branding, avatars, reactions, read receipts or
delivery confirmations. Identify the service from evidence, not a word in the
narrative. Do not load remote assets, execute source HTML or fetch extra data just
to imitate a service. Formatting is not proof that the effect completed.

Show a sent artifact directly, not an “After” panel. Retain a real before state
when a comparison matters, but do not manufacture one. Supporting source captures
remain internal evidence, not extra visible artifacts. The scenario remains a
header and timeline, with event-attached business artifacts and the two existing
concern/evidence disclosures. Presentation changes cannot rewrite reviewed copy
or restamp either review.
