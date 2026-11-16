// SCRIPTED packaging/source-immutability regressions. No native or source calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { packagePostrun } from '../scripts/postrun-package.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { postrunFixture, postrunDraft } from './postrun-package-fixtures.test.mjs';

function setTime(input, id, at, logged) {
  const event = input.session.items.find(item => item.id === id), record = JSON.parse(event.content.message);
  record.at = at; event.created_at = logged; event.content.message = JSON.stringify(record);
}

test('SCRIPTED packaging sorts cross-stream nanosecond instants before deterministic equal-time tie breakers', () => {
  const input = postrunFixture();
  setTime(input, 'evt-3', '2026-01-01T12:00:03.123Z', '2026-01-01T17:45:03.123456781+05:45');
  setTime(input, 'evt-4', '2026-01-01T12:00:03.123Z', '2026-01-01T08:30:03.123456782-03:30');
  const original = JSON.stringify(input), result = packagePostrun(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const order = result.bundle.occurrences.map(item => item.id);
  assert.ok(order.indexOf('occ:evt-3') < order.indexOf('occ:evt-4'), 'Lexical stream order must not replace actual nanosecond order');
  for (const id of ['evt-3', 'evt-4']) {
    const occurrence = result.bundle.occurrences.find(item => item.id === `occ:${id}`);
    assert.deepEqual(occurrence.time, { earliest: '2026-01-01T12:00:03.123Z', latest: '2026-01-01T12:00:03.124Z' });
    assert.equal(result.bundle.evidence.find(item => item.id === `log:${id}`).content.event.created_at, input.session.items.find(item => item.id === id).created_at);
  }
  assert.equal(JSON.stringify(input), original);
});

test('SCRIPTED packaging outward rounding contains source time across a minute without widening the complete window', () => {
  for (const [at, logged, latest] of [
    ['2026-01-01T12:00:59.999Z', '2026-01-01T12:00:59.999999999Z', '2026-01-01T12:01:00.000Z'],
    ['2026-01-01T12:01:00.000Z', '2026-01-01T17:46:00.000000000+05:45', '2026-01-01T12:01:00.000Z'],
  ]) {
    const input = postrunFixture(); input.captured_at = input.context.coverage.observation_window.through;
    setTime(input, 'evt-8', at, logged);
    const original = JSON.stringify(input), result = packagePostrun(input);
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.deepEqual(result.bundle.coverage.observation_window, input.context.coverage.observation_window);
    assert.deepEqual(result.bundle.occurrences.find(item => item.id === 'occ:evt-8').time, { earliest: at, latest });
    const evidence = result.bundle.evidence.find(item => item.id === 'log:evt-8');
    assert.equal(evidence.content.event.created_at, logged); assert.equal(JSON.parse(evidence.content.event.content.message).at, at);
    const assembled = assembleCandidate(result.bundle, postrunDraft(result), { artifactVersionSource: result.artifactVersionSource });
    assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(renderHtml(assembled.snapshot).ok, true);
    assert.equal(JSON.stringify(input), original);
  }
});

test('SCRIPTED capture-before-window and application time after exact log time remain rejected without input repairs', () => {
  for (const mutate of [
    input => { input.captured_at = '2026-01-01T12:00:59.999Z'; },
    input => { setTime(input, 'evt-8', '2026-01-01T12:00:08.124Z', '2026-01-01T12:00:08.123999999Z'); },
  ]) {
    const input = postrunFixture(); mutate(input); const original = JSON.stringify(input);
    assert.equal(packagePostrun(input).ok, false); assert.equal(JSON.stringify(input), original);
  }
});
