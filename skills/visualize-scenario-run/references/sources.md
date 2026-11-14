# Supported independent source reads

The plugin declares GitHub's official `https://api.githubcopilot.com/mcp/readonly`
endpoint with `X-MCP-Tools: get_file_contents`. It is an optional evidence reader,
not a new tracker service or permission to create data. Authenticate separately
only when the user authorizes this source; no credential is stored in this plugin.
The checker tool allowlist excludes all writes and dynamic tool expansion.

For a GitHub-backed business record, collect the authorized owner, repository,
path and immutable commit SHA from source metadata. Call the production
`get_file_contents` tool with `owner`, `repo`, `path`, `sha`. Owner/repo are required;
path, ref and sha are optional in its server schema; sha takes precedence over ref.
Do not invent an `issue_read` history method or treat comments as an audit log.

A stored record with historical before/after revisions, event times and a session
correlation can support a bounded claim about that record. It does not establish
that an unrelated tracker changed, that all downstream effects are known, or that
a stored assertion is authentic merely because it is commit-pinned. Current
contents without history cannot establish historical causation. Missing handles,
read permissions or history must stay visible. This connector does not make
independent verification available for every integration.

Native evals supply fictional file contents and metadata through Markdown MCP
mocks. They are independent source calls in the simulated workflow, not live
verification, real repository data or evidence of real service correctness.

Production interface references (consulted 2026-11-13):
- https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md
- https://github.com/github/github-mcp-server/blob/main/pkg/github/repositories.go
