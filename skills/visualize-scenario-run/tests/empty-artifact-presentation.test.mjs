import test from 'node:test';
import assert from 'node:assert/strict';
import { bundle, sourceBoundCandidate, observedAt } from './fixtures.mjs';
import { artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { renderHtml } from '../scripts/render.mjs';

test('genuine empty baselines remain private source data, while additions and clearing edits stay visible', () => {
  for (const [first, last] of [['', ''], ['\n', '\n'], ['Old content\n', ''], ['', 'New content\n'], ['\n', 'New content\n']]) {
    const b = bundle();
    b.artifacts[0].kind = 'document';
    const step = b.occurrences[1];
    step.time = { at: '2026-01-01T12:00:01Z' }; step.evidence_refs.push('empty-history');
    const later = structuredClone(step);
    later.id = 'cleared'; later.time.at = '2026-01-01T12:00:02Z';
    b.occurrences.splice(2, 0, later);
    b.evidence.push({ id: 'empty-history', kind: 'tool_result', source: { system: 'Synthetic captured history' },
      captured_at: observedAt, content: { first, last }, completeness: 'complete', redactions: [] });
    const source = sourceBoundCandidate(b);
    const draft = { schema_version: '1.3', snapshot_id: source.snapshot_id, editor_id: source.editor_id,
      parent_agent_id: source.parent_agent_id, summary: source.summary, header_copy: source.header_copy,
      claims: source.claims, events: source.timeline.map(event => ({ occurrence_id: event.id,
        description: event.description, claim_refs: event.claim_refs, supporting_detail: event.supporting_detail })),
      artifact_claims: source.artifact_claims, omitted_occurrences: source.omitted_occurrences };
    const sidecar = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(b), records: [], versions: [
      { id: 'first', artifact_id: 'a-draft', occurrence_id: step.id, operation: 'capture', value_ref: { evidence_id: 'empty-history', pointer: '/first' } },
      { id: 'last', artifact_id: 'a-draft', occurrence_id: later.id, operation: 'replace', value_ref: { evidence_id: 'empty-history', pointer: '/last' } },
    ] };
    const original = JSON.stringify([b, sidecar]);
    const assembled = assembleCandidate(b, draft, { artifactVersionSource: sidecar });
    assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
    const rendered = renderHtml(assembled.snapshot);
    assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
    const cards = rendered.html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/g) ?? [];
    assert.equal(cards.length, Number(Boolean(first.trim())) + Number(Boolean(first.trim() || last.trim())));
    assert.doesNotMatch(cards.join(''), /Artifact content is unavailable/);
    if (first.trim() && !last.trim()) assert.match(cards.at(-1), /<del class="diff-text">Old content/);
    if (!first.trim() && last.trim()) assert.match(cards.at(-1), /<ins class="diff-text">New content/);
    assert.equal(assembled.snapshot.artifacts.find(a => a.id === 'version:last').before, first);
    assert.equal(assembled.snapshot.artifacts.find(a => a.id === 'version:last').after, last);
    assert.equal(JSON.stringify([b, sidecar]), original);
  }
});
