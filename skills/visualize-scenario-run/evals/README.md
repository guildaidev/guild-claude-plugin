# Native plugin evaluations

Use [Claude Code plugin evals](https://code.claude.com/docs/en/plugin-evals)
with Claude Code 2.1.269 or newer. Do not use a custom SDK session runner,
PTY controller, injected skill prompt, permission hook or custom report builder.
The native CLI owns isolation, plugin loading, MCP mocks, grading, baseline
comparison and reports. Use its `prompt.md`, `graders/*.md`, optional `case.yaml`
and Markdown MCP mocks when adding behavioral cases.

## Renderer unit coverage

The authoritative 13-case fixture matrix is `../tests/scenarios.mjs`. Run all
deterministic assertions from the plugin root:

```sh
node --test skills/visualize-scenario-run/tests/*.test.mjs
node skills/visualize-scenario-run/tests/run-fixtures.mjs /approved/NEW-fixture-output
```

The second command writes sanitized snapshots, 12 expected-success HTML artifacts
and a JSON report into a **new** directory. The thirteenth case intentionally
exhausts renderer retries and creates no HTML. It uses scripted editors and a
separate fake source reader; it is not model-driven independent verification.
The unit tests additionally exercise clipboard/manual selection after simulated
editor closure, parent-owned automatic bridge **stubs** for terminal browser,
Desktop, OpenCode and claude.ai, and observed/failed/dispatch-only opener stubs.
None enables or establishes a real transport or supported host.

Each adjacent case folder is an optional model-driven **replay/reporting smoke
test**, not a live application test or proof of editorial agent behavior. The
prompts ask the model to replay the deterministic fixture and describe evidence
and limitations. They refer to bundled code; no external data/scaffold is needed.
These replay cases do not establish native editor/checker behavior. Replace or
extend them with natural user prompts and native MCP mocks to measure that
behavior; do not treat a scripted fixture replay as an agent-quality result.

Optional Claude Code evaluation, only after approval of billed model usage and
local tool grants (from the plugin root):

```sh
claude plugin eval . --eval-dir skills/visualize-scenario-run/evals --allow-tools Write Edit Bash --runs 1 --no-publish --max-cost-usd 5
```

Do not use `--allow-real-servers` or `--mocks off`; no live Guild server is needed.
Review the tool grants and choose an explicit cost ceiling before running. The
CLI produces its own report; with/without-skill results measure replay/reporting
only. These optional model runs have **not** been run as part of deterministic
validation. Real-host acceptance is separately authorized in `../references/hosts.md`.
