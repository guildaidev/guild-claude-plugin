# Header prompt state and document scrolling

The latest layout request supersedes the earlier fixed-footer and bounded-panel reference. The existing dark tokens and genuine packaged shadcn controls remain; there is one full renderer.

## Layout

- The application header contains the item count, **Claude Prompt** label and **Review prompt** button at the upper right. Narrow screens place this compact row above the complete application name and purpose, right-aligned within the header.
- There is no bottom prompt bar or reserved footer space. Only the native prompt dialog has its existing explanatory footer.
- The document owns scrolling. The queue, scenario introduction and timeline have no bounded height or independent vertical scroll area. Wheel input over the header, queue, steps or blank page space scrolls the same document. Native dialogs and textareas retain their own accessible scrolling.
- On screens wider than 600px, the application header stays visible only when its measured height is at most 160px and one quarter of the viewport. Taller headers and narrow/short windows use normal document flow. This prevents long names and purposes from covering the timeline. The scenario heading is not sticky, avoiding stacked headers. Narrow-screen users return to the prompt controls by normal document navigation; they are not persistently overlaid.
- Names, purposes and source content wrap rather than truncate. Keyboard focus uses document scrolling, with measured correction when the compact sticky header would cover a control. Native `scrollIntoView` and fragment targets also receive a safe margin based on the enforced maximum sticky-header height. No wheel interception or inline style injection is used.

## Preserved interfaces

`#prompt-count`, `#prompt-summary`, `#review-prompt`, `#prompt-review`, `#comment-composer`, `#copy-prompt`, `[data-queued]`, `[data-add-correct]`, `[data-add-fix]` and concern-dismissal selectors are unchanged. The former `.prompt-bar` is now `.prompt-state` inside `.top`. Internal `#cart-status` and `#cart-motion-status` IDs remain compatible, but no commercial wording or icon appears in the controls.

Feedback remains memory-only and manually copied. Correct-result presets, comments, supported technical fixes, deduplication, editing, removal, local concern dismissal, exact prompt composition and clipboard fallback are unchanged. Count animation still honors reduced motion. Source snapshots and private review records are not rewritten or reapproved by a presentation rerender. Hash-only CSP, offline assets and the no-network boundary remain.

## Verification

`tests/header-prompt-layout.test.mjs` checks markup, geometry policy and source immutability. `tests/check-header-prompt-browser.mjs` accepts an existing Playwright installation, a new private output directory and an optional exact snapshot JSON path. It verifies actual Chromium at 1728×873, 1280×900, 390×844, 390×560 and 320×560; wheel scrolling in four page regions; keyboard focus; native dialogs; zero/one/many feedback items; exact composed prompt and stubbed clipboard; manual fallback; edit/remove/dedupe; concern dismissal; reload; long copy; reduced motion; forced colors; HTTP; CSP errors and absent external requests. It saves screenshots and a machine-readable report and never overwrites the input snapshot. These are presentation checks, not native/model evaluations or user acceptance.
