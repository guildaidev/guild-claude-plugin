import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const guide = (await readFile(new URL('../references/artifact-capture.md', import.meta.url), 'utf8')).replace(/\s+/g, ' ');
const implementation = guide.slice(guide.indexOf('### Required implementation:'), guide.indexOf('### Closed record 1.0'));

test('build instructions require an ordered observed version for every artifact create and edit', () => {
  assert.match(implementation, /every artifact create or edit/);
  assert.match(implementation, /every artifact type, not only documents/);
  const stages = ['Log mutation_requested', 'Log mutation_acknowledged', 'Log artifact_observed', 'Await the structured console emission'];
  const positions = stages.map(stage => implementation.indexOf(stage));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(implementation, /before the next application-controlled edit/);
  assert.match(implementation, /Do not wait until the application finishes to log all edits/);
  assert.match(implementation, /code-level ordering/);
  assert.match(guide, /await task\.console\.info\(JSON\.stringify\(evidence\)\)/);
});

test('edit evidence instructions preserve real empty baselines and observation limits without final-state backfill', () => {
  assert.match(implementation, /actually observed empty baseline/);
  assert.match(implementation, /Empty text is evidence, not missing evidence/);
  assert.match(implementation, /must not display an empty content card/);
  assert.match(implementation, /Do not assume that a new artifact is empty/);
  assert.match(implementation, /actual authorized service response or read/);
  assert.match(implementation, /URL or hash alone is not an observed content snapshot/);
  assert.match(implementation, /explicit observation gap/);
  assert.match(implementation, /Never invent a snapshot, broaden permissions, resend the mutation, or substitute the final state/);
  assert.match(implementation, /External writers can still race a read/);
  assert.match(implementation, /logging every edit does not authorize logging secrets/);
});

test('coverage instructions check each executed mutation instead of accepting one final readback', () => {
  assert.match(implementation, /per-operation coverage/);
  assert.match(implementation, /every actual mutation, including conditional edits that ran/);
  assert.match(implementation, /artifact_observed record for each such operation_id, or an explicit gap for that operation/);
  assert.match(implementation, /Do not replace these requirements with an aggregate artifact_observed min_records:1/);
  assert.match(implementation, /Unexecuted conditional branches are not missing edits/);
});
