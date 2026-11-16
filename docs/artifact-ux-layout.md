# Changed-content review controls

This presentation-only update keeps the ordinary offline renderer, source-bound input, private review records, manual feedback workflow and document scrolling. It does not authorize a new application run, generation or approval.

## Resource links

Resource nouns come from validated destination routes and resource type, not narrative titles or a claimed provider. Native Google Docs/Sheets/Slides and supported message/issue routes keep their precise labels. Generic web documents—including Wikipedia and HTML pages—use **Open page**, across providers. Known file suffixes retain useful file nouns. Existing URL safety restrictions, new-tab behavior and `noopener noreferrer` remain.

Every external anchor ends with the genuine `lucide-react@1.73.0` external-link component (ISC): artifact controls, evidence links and safe Markdown links. The icon is decorative, so existing accessible link names remain unchanged. Its SVG is trusted packaged code, not an external image or executable source content.

## Actual React diff components

The artifact view uses the actual `Diff`, `Hunk` and `Decoration` exports from **react-diff-view@3.3.3** (MIT), composed with the existing local shadcn Card. It is not an official shadcn Diff component. The existing bounded, source-preserving `contentDiff()` algorithm remains unchanged; its rows are adapted directly, without serializing and reparsing a patch.

Only additions/removals are initially visible. Each complete unchanged region is retained under a native **Show N unchanged lines** disclosure, operable by mouse and keyboard without React hydration or new runtime state. Equal versions show **No content changes** with optional retained content. An unavailable baseline stays unavailable; a genuine empty baseline is not inferred or substituted. Existing empty-card suppression and red clearing edits remain.

Custom text tokens avoid the upstream empty-cell space substitution. Each source row also carries an escaped, inert JSON string in `data-source`: this preserves exact source reconstruction despite HTML parsers normalizing literal CRLF text. Trailing spaces, blank lines, CRLF and missing final newline remain testable. Full input snapshots and evidence are never rewritten. Source Markdown/code/HTML in a comparison is escaped text, never executable markup. Single-version Markdown retains the existing inert formatter.

The upstream static stylesheet is bundled into the existing hashed style block. Unified view wraps long lines. No virtual scroller, syntax worker, runtime font/style fetch or style injection is used. `optimizeSelection` is explicitly disabled because that optional upstream path writes inline styles. Green/red changes retain visible plus/minus markers and screen-reader labels; forced colors use system colors. `react-diff-viewer-continued` was rejected because its Emotion runtime styling conflicts with the unchanged hash-only CSP.

## Smaller controls

**Dismiss** remains a real button outside the concern summary, now using the genuine shadcn link variant and borderless underlined styling. Its handler, accessible name, local-memory scope, feedback/evidence preservation, focus transfer and reload behavior are unchanged.

The header now contains only the numeric animated badge and **Review prompt** button. The former visible `#prompt-summary` heading is removed, superseding that portion of the earlier header-layout guide. A hidden `#prompt-count-description` describes the button's current count, while the existing live announcement and reduced-motion animation behavior remain. No bottom bar or independent timeline scroller returns.

## Maintenance and checks

Both new direct dependencies are exactly pinned; the lockfile pins their transitive packages. `ui/build.mjs` collects complete installed license notices for the new packages and their runtime dependencies. Build and reproducibility checks run only in the UI maintainer package; standalone generated HTML needs no npm modules.

`tests/artifact-ux.test.mjs` covers real package reuse, source reconstruction, escaping, labels, icons and control markup. `tests/check-artifact-ux-browser.mjs` invokes the production renderer CLI on an explicitly supplied completed snapshot, writing a new private HTML file. It checks exact current-renderer bytes and unchanged input/original HTML, actual and synthetic source versions, keyboard disclosures, CRLF/whitespace/newlines, safe links, all control semantics, five desktop/mobile sizes, reduced motion, forced colors, document scrolling, strict hashed CSP, errors and absent HTTP requests. Its report and screenshots are presentation evidence, not a fresh native run or review approval.
