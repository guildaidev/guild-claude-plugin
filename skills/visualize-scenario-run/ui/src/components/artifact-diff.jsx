// Actual react-diff-view components (MIT), composed with the local shadcn Card.
// No patch parser, syntax execution, worker, virtualization, CSS injection or
// selection optimization. The caller supplies the existing bounded exact diff.
import * as React from 'react';
import { Diff, Hunk, Decoration } from 'react-diff-view';
import { Card } from './card.jsx';

const rowType = { context: 'normal', removed: 'delete', added: 'insert' };
const rowClass = { normal: 'context', delete: 'removed', insert: 'added' };
const lineCount = text => {
  let count = text.endsWith('\n') ? 0 : 1;
  for (const character of text) if (character === '\n') count++;
  return count;
};

// Row metadata is an escaped JSON string, not executable markup. HTML parsers
// normalize literal CRLF text, so this preserves exact source reconstruction,
// including empty lines, CRLF, trailing spaces and a missing final newline.
function renderSourceToken(token) {
  const { kind, value } = token;
  const Tag = kind === 'added' ? 'ins' : kind === 'removed' ? 'del' : 'span';
  const label = kind === 'added' ? 'Added' : kind === 'removed' ? 'Removed' : 'Unchanged';
  return <React.Fragment key="source">
    <span className="diff-marker" aria-hidden="true">{kind === 'added' ? '+' : kind === 'removed' ? '−' : ' '}</span>
    <span className="sr-only">{label}: </span>
    <span className="diff-source" data-source={JSON.stringify(value)}><Tag className="diff-text">{value}</Tag></span>
    {!value.endsWith('\n') ? <span className="diff-eol">No final newline</span> : value.endsWith('\r\n') ? <span className="diff-eol">CRLF</span> : null}
  </React.Fragment>;
}

function prepareRows(rows) {
  let oldLine = 1, newLine = 1;
  const segments = [], tokens = { old: [], new: [] };
  for (const { kind, text } of rows) {
    const normal = kind === 'context', lines = lineCount(text);
    let segment = segments.at(-1);
    if (!segment || segment.context !== normal) {
      segment = { context: normal, content: `-${oldLine} +${newLine}`, oldStart: oldLine, newStart: newLine, oldLines: 0, newLines: 0, changes: [] };
      segments.push(segment);
    }
    const change = { type: rowType[kind], content: text,
      ...(normal ? { isNormal: true, oldLineNumber: oldLine, newLineNumber: newLine } : { lineNumber: kind === 'removed' ? oldLine : newLine, [kind === 'removed' ? 'isDelete' : 'isInsert']: true }) };
    segment.changes.push(change);
    // Use a nonempty custom token type even for a blank line; upstream's default
    // CodeCell otherwise substitutes a space for empty content.
    const source = [{ type: 'source', kind, value: text }];
    if (kind !== 'added') { tokens.old[oldLine - 1] = source; oldLine += lines; segment.oldLines += lines; }
    if (kind !== 'removed') { tokens.new[newLine - 1] = source; newLine += lines; segment.newLines += lines; }
  }
  return { segments, tokens };
}

export function ArtifactDiff({ before, after, rows }) {
  const { segments, tokens } = prepareRows(rows);
  const props = { viewType: 'unified', diffType: 'modify', optimizeSelection: false, tokens, renderToken: renderSourceToken,
    generateLineClassName: ({ changes }) => `diff-${rowClass[changes[0].type]}` };
  return <section className="content-diff" aria-label="Content changes">
    <Card className="artifact-diff-card">
      {before === after ? <p className="diff-legend">No content changes.</p> : <p className="diff-legend"><span className="diff-key-removed">− Removed</span><span className="diff-key-added">+ Added</span></p>}
      {before === '' && after !== '' ? <p className="diff-empty">Previous captured content is empty.</p> : null}
      {before === '' && after === '' ? <p className="diff-empty">Captured content is empty.</p> : <Diff {...props} hunks={segments.filter(segment => !segment.context)}>
        {() => segments.map((segment, index) => segment.context ? <Decoration key={index}>
          <details className="diff-context-disclosure"><summary>Show {segment.oldLines.toLocaleString('en-US')} unchanged {segment.oldLines === 1 ? 'line' : 'lines'}</summary>
            <Diff {...props} hunks={[segment]}>{() => <Hunk key={index} hunk={segment} />}</Diff>
          </details>
        </Decoration> : <Hunk key={index} hunk={segment} />)}
      </Diff>}
      {after === '' && before !== '' ? <p className="diff-empty">Current captured content is empty.</p> : null}
    </Card>
  </section>;
}
