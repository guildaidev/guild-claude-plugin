// Deterministic, inert presentation of supplied content versions. No source I/O,
// normalization, narrative generation, inferred baseline or review mutation.
import { artifactDiffHtml } from '../ui/dist/server.mjs';
const lines = text => text.match(/[^\n]*\n|[^\n]+$/g) ?? [];

// Preserve every byte, including CRLF, whitespace and a missing final newline.
// Bound quadratic work. Large unrelated middles remain an honest replacement,
// rather than an approximate or truncated comparison.
export function contentDiff(before, after) {
  if (typeof before !== 'string' || typeof after !== 'string') throw new TypeError('Two explicit text versions are required.');
  // Also bound generated row count for very large captures. Show the complete
  // replacement, not millions of line wrappers or a misleading partial diff.
  if (before.length + after.length > 1_000_000) {
    if (before === after) return before ? [{ kind: 'context', text: before }] : [];
    return [...(before ? [{ kind: 'removed', text: before }] : []), ...(after ? [{ kind: 'added', text: after }] : [])];
  }
  const left = lines(before), right = lines(after), result = [];
  if (left.length + right.length > 10_000) {
    if (before === after) return before ? [{ kind: 'context', text: before }] : [];
    return [...(before ? [{ kind: 'removed', text: before }] : []), ...(after ? [{ kind: 'added', text: after }] : [])];
  }
  let prefix = 0, suffix = 0;
  while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix++;
  while (suffix < left.length - prefix && suffix < right.length - prefix && left[left.length - 1 - suffix] === right[right.length - 1 - suffix]) suffix++;
  const add = (kind, text) => result.push({ kind, text });
  left.slice(0, prefix).forEach(text => add('context', text));
  const a = left.slice(prefix, left.length - suffix), b = right.slice(prefix, right.length - suffix);
  if ((a.length + 1) * (b.length + 1) <= 1_000_000) {
    const width = b.length + 1, table = new Uint32Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? 1 + table[(i + 1) * width + j + 1] : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) { add('context', a[i++]); j++; }
      else if (i < a.length && (j === b.length || table[(i + 1) * width + j] >= table[i * width + j + 1])) add('removed', a[i++]);
      else add('added', b[j++]);
    }
  } else {
    a.forEach(text => add('removed', text));
    b.forEach(text => add('added', text));
  }
  left.slice(left.length - suffix).forEach(text => add('context', text));
  return result;
}

export function renderContentDiff(before, after) {
  const rows = contentDiff(before, after);
  return artifactDiffHtml({ before, after, rows });
}

export const diffStyle = `.content-diff{margin-top:12px;min-width:0;border:1px solid var(--line);border-radius:8px}.artifact-diff-card{border:0;border-radius:8px;background:transparent;box-shadow:none;min-width:0;--diff-background-color:transparent;--diff-text-color:var(--text);--diff-font-family:ui-monospace,SFMono-Regular,monospace;--diff-gutter-insert-background-color:#203c2d;--diff-gutter-delete-background-color:#49282c;--diff-gutter-insert-text-color:#b7dec0;--diff-gutter-delete-text-color:#f1b8b8;--diff-code-insert-background-color:#203c2d;--diff-code-delete-background-color:#49282c;--diff-code-insert-text-color:#b7dec0;--diff-code-delete-text-color:#f1b8b8}.diff-legend{display:flex;flex-wrap:wrap;gap:20px;padding:10px 12px;background:var(--bg);font-size:12px}.diff-key-removed{color:#f1b8b8}.diff-key-added{color:#b7dec0}.content-diff .diff-line{font-size:12px;line-height:1.7}.content-diff .diff-gutter-col{width:4ch}.content-diff .diff-gutter{padding:4px;color:var(--muted);font-variant-numeric:tabular-nums;cursor:default}.content-diff .diff-code{padding:4px 8px;overflow-wrap:anywhere;word-break:normal;min-width:0}.diff-marker{display:inline-block;width:2ch;font-weight:700;user-select:none}.diff-text{white-space:pre-wrap;overflow-wrap:anywhere;text-decoration:none;min-width:0}.diff-removed{background:#49282c;color:#f1b8b8;border-left:3px solid #d38c95}.diff-added{background:#203c2d;color:#b7dec0;border-left:3px solid #84b794}.diff-context{border-left:3px solid transparent}.diff-eol{display:block;color:var(--muted);font-size:11px;font-style:italic}.diff-empty{padding:8px 12px;font-size:12px}.content-diff .diff-context-disclosure{font-size:12px;user-select:text}.content-diff .diff-context-disclosure>summary{padding:8px 12px;color:var(--muted);width:100%;white-space:normal}.content-diff .diff-context-disclosure .diff{user-select:text}.content-diff .diff-decoration{font-family:inherit}@media(max-width:600px){.content-diff .diff-line{font-size:11px}.content-diff .diff-code{padding:4px}.content-diff .diff-gutter-col{width:3ch}.content-diff .diff-gutter{padding:4px 2px}}@media(forced-colors:active){.content-diff .diff-removed,.content-diff .diff-added,.content-diff .diff-gutter,.content-diff .diff-code{color:CanvasText;background:Canvas;border-color:CanvasText}.diff-key-removed,.diff-key-added{color:CanvasText}}`;
