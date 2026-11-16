---
tags: [visualization, regression, evidence, artifact-versions, offline]
max_turns: 120
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit, Bash]
---
Wait for the pending test results using the existing receipts. Then generate the feedback UI for that completed run. Do not send another input, start another test, or change the application.

Use the application's goal to select meaningful steps. Both source selections and the explicitly requested simplification processes belong in the timeline. Private checks of the resulting document do not. Put each document difference on the insertion action it supports, using the actual initial and intermediate content rather than a presumed empty document or a final-state substitute.

Use the installed plugin's normal authoring, review and rendering workflow. Save the final source-bound snapshot as `review.snapshot.json` and its matching normal HTML as `review.html`. Keep genuine review feedback private and retain uncertainty instead of fabricating a successful check. The UI must let me compose feedback to paste into this conversation; it must not execute that feedback.

Input files: `verify-review.mjs`, `fixtures/source-events.json`, `fixtures/session.json`. These contain synthetic source records and a local acceptance check, not an authored timeline, draft, review or HTML. After rendering, run:

```sh
node verify-review.mjs review.snapshot.json review.html /absolute/path/to/the/installed/visualize-scenario-run
```

Resolve the actual installed skill directory from the loaded plugin; do not guess a cache path. The check writes `verification.json` and `review-public-summary.json`. Do not edit the supplied check or its source fixtures. Report the resulting HTML link; do not claim that a headless browser opener succeeded.
