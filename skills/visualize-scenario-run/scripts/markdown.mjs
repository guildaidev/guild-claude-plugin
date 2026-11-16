// Small inert Markdown subset for captured business text. Never executes HTML,
// loads images, expands mentions, embeds services or fetches remote resources.
import { externalLinkIconHtml } from '../ui/dist/server.mjs';
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function safeLink(value) {
  try {
    if (/[\s\u0000-\u001f\u007f]/.test(value)) return false;
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}

function inline(text, depth = 0) {
  if (depth > 4) return esc(text);
  let html = '';
  for (let i = 0; i < text.length;) {
    if (text[i] === '\\' && /[\\`*_{}\[\]()#+.!>~-]/.test(text[i + 1] ?? '')) {
      html += esc(text[i + 1]); i += 2; continue;
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i + 1) { html += `<code>${esc(text.slice(i + 1, end))}</code>`; i = end + 1; continue; }
    }
    const image = text.startsWith('![', i);
    if (image || text[i] === '[') {
      const labelStart = i + (image ? 2 : 1), middle = text.indexOf('](', labelStart);
      const end = middle < 0 ? -1 : text.indexOf(')', middle + 2);
      if (end >= 0) {
        const destination = text.slice(middle + 2, end);
        html += !image && safeLink(destination)
          ? `<a href="${esc(destination)}" target="_blank" rel="noopener noreferrer">${inline(text.slice(labelStart, middle), depth + 1)}${externalLinkIconHtml()}</a>`
          : esc(text.slice(i, end + 1));
        i = end + 1; continue;
      }
    }
    let matched = false;
    for (const [delimiter, tag] of [['**', 'strong'], ['__', 'strong'], ['~~', 's'], ['*', 'em'], ['_', 'em']]) {
      if (!text.startsWith(delimiter, i)) continue;
      if (delimiter === '_' && /[\p{L}\p{N}]/u.test(text[i - 1] ?? '')) continue;
      const end = text.indexOf(delimiter, i + delimiter.length);
      if (end <= i + delimiter.length) continue;
      html += `<${tag}>${inline(text.slice(i + delimiter.length, end), depth + 1)}</${tag}>`;
      i = end + delimiter.length; matched = true; break;
    }
    if (!matched) { html += esc(text[i]); i++; }
  }
  return html;
}

export function renderMarkdown(value, depth = 0) {
  const lines = String(value).replace(/\r\n?/g, '\n').split('\n');
  if (depth > 4) return `<p>${esc(value)}</p>`;
  const blocks = [];
  const listItem = line => /^\s{0,3}([-+*]|\d+\.)\s+(.+)$/.exec(line);
  const startsBlock = line => /^(?:\s*$|```|#{1,6}\s|>\s?)/.test(line) || listItem(line);
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    if (lines[i].startsWith('```')) {
      const code = []; i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`); continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (heading) {
      const level = Math.min(6, heading[1].length + 3);
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`); i++; continue;
    }
    if (/^>\s?/.test(lines[i])) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(`<blockquote>${renderMarkdown(quote.join('\n'), depth + 1)}</blockquote>`); continue;
    }
    const item = listItem(lines[i]);
    if (item) {
      const tag = /^\d/.test(item[1]) ? 'ol' : 'ul', items = [];
      const start = tag === 'ol' ? ` start="${Number.parseInt(item[1], 10)}"` : '';
      while (i < lines.length) {
        const next = listItem(lines[i]);
        if (!next || (/^\d/.test(next[1]) ? 'ol' : 'ul') !== tag) break;
        items.push(`<li>${inline(next[2])}</li>`); i++;
      }
      blocks.push(`<${tag}${start}>${items.join('')}</${tag}>`); continue;
    }
    const paragraph = [lines[i++]];
    while (i < lines.length && !startsBlock(lines[i])) paragraph.push(lines[i++]);
    blocks.push(`<p>${paragraph.map(line => inline(line)).join('<br>')}</p>`);
  }
  return blocks.join('');
}
