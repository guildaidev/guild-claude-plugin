# Style routing v2

Choose by content, not interface location. Apply exactly one guide to each passage:

1. Purely technical application-internal explanations use ASD-STE100 and
   [asd-ste100-v1.md](asd-ste100-v1.md) only.
2. Application effects on the world or human experience use Economist and
   [economist-v1.md](economist-v1.md) only, even inside technical disclosures.
3. Apply [sdlc-v2.md](sdlc-v2.md) afterward in either route.

Never combine guides or use the other as fallback. Economist copy does not inherit
ASD word limits. Unclear routing requires clarification, not guessed approval.
Meaning and evidence override style. Preserve attribution, negation, scope,
quantities, timing, order, causation, status and genuine uncertainty. A request is
not a completed effect. Run completion is not world-effect success. Preserve
verbatim artifacts, quotations, proper names, IDs, URLs and code. SDLC directives
override the selected guide. Record justified exceptions without inventing facts.

Exact rule_versions:

```json
{"asd_ste100":"issue-9-structural-v1","economist":"cfb132d62447b959dea5a49940e28da89e1ba75b-summary-v1","sdlc":"scenario-run-v2"}
```

Recording both reference versions does not apply both guides to a passage.

For snapshot 1.10, `suggested_feedback.explanation` is the human-readable
application-change instruction. Route it to ASD-STE100, not Economist. Keep it
separate from `suggested_feedback.text`, the technical Claude Code prompt.
`concern.explanation` describes behavior relative to the application goal; route
that passage by its content as above. Review all three fields separately.

## Human timeline meaning

Apply [../timeline-content.md](../timeline-content.md) before style polishing.
Goal-relevant external source interactions/read-selection actions integral to the
application goal use Economist, even without a write; internal scaffolding belongs
in technical detail, not extra events. Brief outcome-first descriptions omit
return-value jargon, repeated qualified actor IDs and irrelevant test qualifiers.
Do not remove real expectation mismatches or uncertainty to make copy smoother.
Preserve source-backed identity/time/claims, distinct artifact stages and safe links.
Minimal rows do not require repeated “Source unavailable” or “Evidence has
limitations” labels. Keep material business limitations in human terms, never
invent a success icon or completed effect. Generation internals stay private in
chat, UI, evidence, feedback and prompts; style routing cannot authorize exposing
them. No new rule-version/schema fields are introduced by this content guidance.
For any artifact content change, paired source-backed before/after versions may
use diff-style green additions/red removals, with Added/Removed or +/− labels rather
than color alone. Preserve verbatim bytes, context, order and meaning; style never
authorizes an invented version/readback or a claim of implemented diff capability.
