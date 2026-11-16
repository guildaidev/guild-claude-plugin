# Third-party code

The JavaScript components in `src/components/` are local JavaScript ports of the
official shadcn/ui **new-york** registry's Button, Card and Textarea components,
retrieved 14 November 2026. The component implementation, variant classes and
React/Radix composition are retained; local relative imports replace `@/lib/utils`.
Only Card (not unused Card subcomponents) is shipped.

- https://ui.shadcn.com/r/styles/new-york/button.json
- https://ui.shadcn.com/r/styles/new-york/card.json
- https://ui.shadcn.com/r/styles/new-york/textarea.json
- https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

## shadcn/ui license

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Diff and external-link icon

`artifact-diff.jsx` composes the actual `Diff`, `Hunk` and `Decoration` exports of
**react-diff-view 3.3.3** (MIT, Copyright 2017 Gray Zhang), not a local imitation or
an official shadcn Diff component. Its static stylesheet is compiled into ui.css.
The existing exact bounded comparison supplies rows directly: no patch-parser
roundtrip, syntax highlighting, workers, virtualization or optimized selection.
Unchanged material is retained inside native disclosures. The custom text-token
adapter preserves line endings/blank lines without upstream's empty-cell padding.

- https://github.com/otakustay/react-diff-view/tree/776e11d00cad4b611600b9a93e783b15d4f0b5a4
- https://github.com/otakustay/react-diff-view/blob/776e11d00cad4b611600b9a93e783b15d4f0b5a4/LICENSE

The external-link icon is the actual **lucide-react 1.73.0** `external-link`
component (ISC), bundled as trusted static SVG after link copy; no external image,
font, sprite or runtime icon loader is used.

- https://lucide.dev/guide/react/getting-started
- https://lucide.dev/icons/external-link

`react-diff-viewer-continued` was considered but not adopted because its Emotion
runtime styling does not fit this renderer's unchanged hash-only CSP.

Other bundled libraries retain their own licenses (class-variance-authority and
diff-match-patch are Apache-2.0; Lucide is ISC; the other listed runtime libraries
are MIT). The compose-refs npm
tarball omits its license file, so its shared radix-ui/primitives WorkOS MIT
license is collected from react-slot. `build.mjs` collects
their complete installed license notices into `dist/THIRD-PARTY-LICENSES.txt`
and appends them as inert comments to both JavaScript bundles, including the
browser bundle embedded in each standalone review file.
