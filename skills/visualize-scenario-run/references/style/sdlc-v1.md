# SDLC copy directives v1 — always last

- SDLC-1: Only state what actually happened. A request, acceptance, present state,
  completed effect and run completion are different facts. Preserve uncertainty.
- SDLC-2: Use full actor/action/object sentences about consequential behavior.
  Name the actual application/service boundary. Do not narrate test machinery
  when it does not help explain the intended effect or observed result.
- SDLC-3: Use supplied fully qualified names as inline-code names followed by
  “agent” or “workspace”. Never manufacture a missing name or expand an ID into
  an unsupported name. Flag missing context without guessing.
- SDLC-4: Each displayed detail must explain the workflow goal, a result or a
  consequential failure. Put revision IDs and engineering provenance in evidence
  unless they are themselves necessary to the business story.
- SDLC-5: Keep relevant business artifacts visible and verbatim. Review authored
  captions and surrounding narrative, not captured messages, payloads or code.
- SDLC-6: Preserve timeline inclusion: top-level session boundaries and relevant
  world effects only; reads, internal reasoning and child lifecycle are supporting
  detail. Copy review does not select or add events or UI.
- SDLC-7: Below an event description/inline artifact, only “Possibly incorrect
  behavior” and “Evidence and technical details” accordions are permitted.
  Actual failure/conflict warrants a concern; mere qualification is not a failure.

Meaning/evidence override all style rules. These directives override the selected
guide. Explain necessary exceptions. Ambiguity blocks safe wording; do not guess.
