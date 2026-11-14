# SDLC copy directives v2 — always last

- SDLC-1: Only state what actually happened. A request, acceptance, present state,
  completed effect and run completion are different facts. Preserve uncertainty.
- SDLC-2: Describe the human experience in short, full sentences. Say “The
  `market-monitor` agent started.” and “The session ended.” Do not say “top-level
  Guild test session”, narrate connection plumbing, or assert a trigger that the
  evidence does not establish. Session level, platform and runtime status belong
  in Evidence and technical details unless needed to explain a real failure.
- SDLC-3: Use supplied names as inline-code names followed by agent/workspace.
  Never manufacture a missing fully qualified name. Use a supplied channel name
  with #, not an API channel ID. Do not invent Slack sender names or avatars.
- SDLC-4: Describe the supported effect, not its protocol. With evidence of a
  successful post: “The `market-monitor` agent successfully posted the Berlin
  comparison to the Slack channel #rental-market-intel.” Keep connection names,
  API `ok` fields and message timestamps in technical evidence. A request alone
  permits “asked Slack to post”, not “successfully posted”. A successful post
  does not establish that anyone read it, nor that a daily schedule is installed.
- SDLC-5: Each displayed detail must explain the workflow goal, result or a
  consequential failure. Keep technical IDs and engineering provenance disclosed.
  Missing context is not permission to guess or add clutter to the main story.
- SDLC-6: Keep the relevant business artifact inline in its familiar service
  presentation. Safely format captured Markdown without rewriting its words.
  A sent Slack message is a message, not an “After” panel. Do not add detached
  source-offer cards: retain supporting source pages in technical evidence.
  Review authored captions, not captured message text, payloads, IDs or code.
- SDLC-7: Preserve timeline inclusion: top-level session boundaries and relevant
  world effects only. Reads, reasoning and child lifecycle are supporting detail.
  Copy review does not select or add events or UI. Simplifying a session sentence
  does not change which session was selected or its factual metadata.
- SDLC-8: Below an event description/inline artifact, only “Possibly incorrect
  behavior” and “Evidence and technical details” accordions are permitted.
  Actual failure/conflict warrants a concern; mere qualification is not failure.

Meaning/evidence override style. Apply these directives after exactly one selected
guide: Economist for world/human experience OR ASD for purely internal technical
explanations, never both. Unnecessary test jargon and API narration in human-facing
event copy are required SDLC findings, not optional cosmetic advice. Explain a
necessary exception. Ambiguous meaning blocks safe wording; do not guess.
