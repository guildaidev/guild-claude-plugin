---
type: regex
target:
  source: file
  path: verification.json
pattern: '"ok"\s*:\s*true'
match: contains
---
