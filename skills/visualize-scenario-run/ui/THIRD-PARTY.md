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

Other bundled libraries retain their own licenses (class-variance-authority is
Apache-2.0; the other listed runtime libraries are MIT). The compose-refs npm
tarball omits its license file, so its shared radix-ui/primitives WorkOS MIT
license is collected from react-slot. `build.mjs` collects
their complete installed license notices into `dist/THIRD-PARTY-LICENSES.txt`
and appends them as inert comments to both JavaScript bundles, including the
browser bundle embedded in each standalone review file.
