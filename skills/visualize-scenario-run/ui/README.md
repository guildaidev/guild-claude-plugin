# Bundled shadcn/ui integration

This is a maintainer-only build package, not an application server or a plugin
installation step. Review generation still needs only Node.js 22+ and packaged
files. Do not run npm, fetch registry code, or build during narrative authoring.

## Architecture

- Genuine locally owned shadcn/ui new-york **Button**, **Card** and **Textarea**
  source is in `src/components/`, with attribution in `THIRD-PARTY.md`.
  Button uses React, Radix Slot and class-variance-authority; `cn` uses clsx and
  tailwind-merge. Tailwind 4 compiles the actual utility classes at build time.
- `src/server.jsx` renders all static action buttons, dialog inputs and the
  scenario queue card with React DOM's static renderer. Its bundled ESM output
  has no external npm dependency at review-generation time (Node built-ins only).
- `src/browser.jsx` mounts React/shadcn Card/Button feedback islands. User text
  is a React text child, never executable HTML. The existing pure feedback runtime
  still owns validation, identities, deduplication and exact prompt composition.
- Native `<dialog>` shells are intentionally **not** claimed to be shadcn Dialog.
  They retain browser focus trapping, modal inertness, Escape and nested editing.
  Radix Dialog's scroll-lock/runtime style injection would conflict with this
  artifact's hash-only CSP. Native dialogs plus genuine shadcn controls avoid
  weakening the policy. Evidence disclosures and service-artifact layout remain
  semantic native HTML, not imitation shadcn components.
- `render.mjs` embeds prebuilt CSS/JS and hashes their exact bytes in its CSP.
  No CDN, runtime import, font/image fetch, unsafe-inline, eval, storage, host
  bridge or model call is required. React's local MessageChannel scheduler is
  not cross-window feedback delivery. Registry URLs are provenance, not runtime
  resources. Inline script/style terminators are rejected by the build.
- The mechanical register animation is CSS-only and follows real count changes,
  not edits, cancelled drafts or deduplication. Reduced-motion disables it;
  a visually hidden live status provides the same information without motion.

## Reproduce or verify the build

From this directory, using Node.js 22+ and npm:

```sh
npm ci --ignore-scripts
npm run build
npm run check
```

`package-lock.json` pins the entire dependency tree. `check` rebuilds to memory
and a unique temporary directory, then compares each generated file byte for
byte. It never rewrites `dist`. Build tools may need network when dependencies
are first installed; that is a maintainer operation, not review/runtime behavior.
Ship `dist/server.mjs`, `dist/browser.js`, `dist/ui.css` and license notices with
the skill. Do not ship `node_modules`. Local tests also exercise a copied runtime
outside this repository, without installed npm modules or code generation.
