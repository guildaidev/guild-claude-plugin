# Operation timeline replay regression

This case captures the **behavior** established by the passing review-only CLI
replay, not its private transcript or generated copy. Every identity, source and
artifact here is fictional. Inputs contain only source records and the original
application specification: no authored timeline, bundle, draft, review, approval
or HTML. Existing `scenario1-checkpoint-a` fixtures and graders are unchanged.

## Regression boundaries

- Two goal-relevant queries, two explicitly requested internal transformations,
  creation and two content changes remain separate meaningful steps.
- Ordinary native source/child results establish execution even though no
  structured `process_result` was emitted. Never fabricate that console record.
- Exact actual initial `\n`, first-only text and later combined text establish
  both comparisons. A creation acknowledgment alone does not establish emptiness.
- Attach each diff to the content change, not a readback event. Validation remains
  private in all public surfaces; meaningful business uncertainty stays visible.
- Metadata-only acknowledgments contain no invented material gap. Submitted text
  and accepted requests are not themselves stored-state observations.
- Use the normal source-bound renderer and manual feedback UI. Genuine optional
  reviewer feedback stays private; unavailable tools/clocks are not forged passes.
- Continue the existing completed test. Start/send mocks deliberately fail;
  nothing calls a real source service or writes to an application.

`verify-review.mjs` follows the CLI's supported "run a verification command and
grade its output" pattern. It checks production validation, exact current renderer
bytes, pinned scope, seven distinct source-backed story units, two exact actual
version pairs, public prose and normal controls. A separate tool-use grader
witnesses the command. This helper is visible to the agent and is **not a
tamper-proof security boundary, independent live verification or user acceptance**.
The small LLM grader examines the public story, not a truncated middle trace.
Browser accessibility, context folding and copy interactions remain covered by
the repository's local browser regressions, not falsely inferred from file output.

## Isolation and clocks

Case-local Guild/GitHub mocks override inherited mocks. `--mocks record` does not
start those real servers; never add `--allow-real-servers`. The GitHub archive is a
fictional pinned capture, not a live Google Docs API. `read_metadata.observed_at`
is explicitly a synthetic fixed mock clock. Do not report it as a real platform
clock or invent a timestamp when the checker cannot access it.

`--scaffold` copies the verifier and raw fixtures into the fresh workspace. The
small shell script only copies these case-local files; it makes no network calls.
No random outcome is replayed: the recorded fixture already contains two sources.

## Optional paid native run — requires separate authorization

This case has been added and checked locally. **It has not been run as a paid
native eval.** After explicit authorization, from the plugin root:

```sh
CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=1800000 claude plugin eval . \
  --case operation-timeline-replay --runs 1 --ablation none \
  --mocks record --scaffold --no-publish --keep-temp --trust-plugin \
  --max-cost-usd 20 --allow-tools Write Edit 'Bash(node *)'
```

The cost option and model budget checks are not a hard billing cap. The semantic
grader can also incur judge cost. Do not start this command merely to validate the
case's files, and do not weaken older cases to make this regression pass.
