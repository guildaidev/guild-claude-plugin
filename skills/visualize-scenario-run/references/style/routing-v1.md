# Style routing v1

Choose by the passage's meaning, not where it appears in the interface.

1. Purely technical explanations of highly technical processes internal to the
   application use `asd-ste100` and [asd-ste100-v1.md](asd-ste100-v1.md) ONLY.
2. Application effects on the world or human experience use `economist` and
   [economist-v1.md](economist-v1.md) ONLY, even inside a technical disclosure.
3. Apply [sdlc-v1.md](sdlc-v1.md) afterward in either route.

Never stack guides or fall back to the other guide. Economist passages do not
inherit ASD word limits. Ambiguous or inseparable mixed content needs author
clarification, not guessed routing. For example, an internal queue lease protocol
is technical; asking Slack to publish a message is a world-facing request.

Meaning and evidence are absolute constraints. Preserve actors, negation, scope,
quantities, timing, order, causation, status and uncertainty. Style cannot turn
“asked Slack to post” into “Slack posted”. Present state cannot prove this run
created it. Run completion does not prove its intended world effect succeeded.
Preserve verbatim artifacts, quotations, proper names, IDs, URLs and code.
SDLC directives override the selected guide. Record necessary exceptions.

Exact rule_versions for the review:

```json
{"asd_ste100":"issue-9-structural-v1","economist":"cfb132d62447b959dea5a49940e28da89e1ba75b-summary-v1","sdlc":"scenario-run-v1"}
```

These identifiers describe the available local reference set. Recording both
source versions does NOT mean applying both guides to each passage.
