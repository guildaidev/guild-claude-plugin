// Local eval witness, not a security boundary or independent source verification.
// Inputs are fictional raw sources. This file does not author a timeline/review.
import assert from 'node:assert/strict';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const sha = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => { try { assert.deepEqual(a, b); return true; } catch { return false; } };
const rawText = document => document.body.content.flatMap(block => block.paragraph?.elements ?? []).map(element => element.textRun?.content ?? '').join('');
const nativeEvent = item => item?.content?.event ?? item?.content;
const privateProcedure = /\b(?:readback|read\s+(?:the\s+)?(?:document|file|artifact|text)\s+back|artifact_observed|mutation_requested|mutation_acknowledged|process_result|console_log|not admitted|(?:copy|fact)\s*review|checker|candidate digest|internal steps[^.!?]*(?:not retained|not shown))\b/i;

export async function verifyReview({ snapshotPath, htmlPath, skillRoot, fixtureDirectory }) {
  const [snapshotBytes, htmlBytes, eventsBytes, sessionBytes] = await Promise.all([
    readFile(snapshotPath), readFile(htmlPath),
    readFile(join(fixtureDirectory, 'source-events.json')), readFile(join(fixtureDirectory, 'session.json')),
  ]);
  const snapshot = JSON.parse(snapshotBytes), source = JSON.parse(eventsBytes), session = JSON.parse(sessionBytes);
  const moduleAt = name => import(pathToFileURL(join(skillRoot, 'scripts', name)).href);
  const [{ validate }, { renderHtml }, { contentDiff }, publicProjection] = await Promise.all([
    moduleAt('contracts.mjs'), moduleAt('render.mjs'), moduleAt('diff.mjs'), moduleAt('public-evidence.mjs'),
  ]);
  const errors = [], checks = {};
  const check = (name, condition) => { checks[name] = Boolean(condition); if (!condition) errors.push(name); };
  check('valid_source_bound_snapshot', validate(snapshot).ok && snapshot.schema_version === '1.10' && snapshot.source_bundle?.schema_version === '1.0');
  check('matching_normal_packaged_renderer', Buffer.from(renderHtml(snapshot).html).equals(htmlBytes));
  check('fixture_scope', source.synthetic === true && source.session_id === session.id && snapshot.run.workspace_id === session.workspace.id
    && snapshot.run.agent_version_ids.includes(session.agent_version_override.id)
    && snapshot.sessions.some(item => item.id === session.id && item.workspace_id === session.workspace.id));
  const event = id => { const found = source.items.find(item => item.id === id); assert.ok(found, 'Missing fictional source event'); return found; };
  const states = ['event-doc-initial-done', 'event-doc-first-done', 'event-doc-final-done'].map(id => event(id));
  const [initial, first, final] = states.map(item => rawText(item.content));
  assert.equal(initial, '\n'); assert.ok(final.startsWith(first));
  const docId = states[0].content.documentId;
  check('same_observed_artifact_identity', states.every(item => item.content.documentId === docId));

  const evidenceSupports = (item, expected) => {
    if (!item) return false;
    const native = nativeEvent(item);
    if (native?.id === expected.id && equal(native.content, expected.content)) return true;
    if (item.source?.record_id === expected.id && (equal(item.content, expected.content) || equal(item.content?.result, expected.content))) return true;
    return item.source?.record_id === expected.task.id && (equal(item.content, expected.content) || equal(item.content?.result, expected.content));
  };
  const atStep = expectedId => snapshot.timeline.flatMap((step, index) => step.evidence_refs.some(id => evidenceSupports(snapshot.evidence.find(item => item.id === id), event(expectedId))) ? [index] : []);
  const units = [
    ['first_source', 'event-select-first-done'], ['first_requested_process', 'event-process-first-done'],
    ['creation', 'event-create-done'], ['first_change', 'event-insert-first-done'],
    ['second_source', 'event-select-second-done'], ['second_requested_process', 'event-process-second-done'],
    ['second_change', 'event-insert-second-done'],
  ];
  const positions = Object.fromEntries(units.map(([name, id]) => [name, atStep(id)]));
  check('distinct_source_process_and_change_steps', units.every(([name]) => positions[name].length === 1)
    && new Set(units.map(([name]) => positions[name][0])).size === units.length);
  if (checks.distinct_source_process_and_change_steps) {
    check('workflow_order', units.every(([name], index) => index === 0 || positions[units[index - 1][0]][0] < positions[name][0]));
  } else check('workflow_order', false);

  const forStep = name => snapshot.timeline[positions[name][0]];
  const attached = name => (forStep(name)?.artifact_refs ?? []).map(id => snapshot.artifacts.find(artifact => artifact.id === id));
  const firstVersion = attached('first_change').find(item => item?.before === initial && item.after === first);
  const finalVersion = attached('second_change').find(item => item?.before === first && item.after === final);
  check('real_initial_state_not_inferred_empty', Boolean(firstVersion));
  check('successive_exact_observed_versions', Boolean(finalVersion));
  check('artifact_target_matches_sources', [firstVersion, finalVersion].every(item => item?.source_url === `https://docs.google.com/document/d/${docId}/edit`));
  check('diffs_attached_to_changes_not_validation', Boolean(firstVersion && finalVersion) && positions.first_change[0] !== positions.second_change[0]);
  check('source_preserving_added_content', [firstVersion, finalVersion].every(item => {
    if (!item) return false;
    const rows = contentDiff(item.before, item.after);
    return rows.some(row => row.kind === 'added') && !rows.some(row => row.kind === 'removed' && row.text.trim())
      && rows.filter(row => row.kind !== 'added').map(row => row.text).join('') === item.before
      && rows.filter(row => row.kind !== 'removed').map(row => row.text).join('') === item.after;
  }));
  const publicSteps = snapshot.timeline.map(step => ({
    description: step.description,
    detail: publicProjection.publicSupportingDetail?.(snapshot, step) ?? step.supporting_detail,
    concern: step.concern?.explanation ?? null,
    suggested_fix: step.suggested_feedback?.explanation ?? null,
    artifacts: step.artifact_refs.map(id => snapshot.artifacts.find(item => item.id === id)?.title),
  }));
  const limitations = publicProjection.sourceLimitations(snapshot);
  check('validation_and_generation_are_private', !privateProcedure.test(JSON.stringify({ steps: publicSteps, limitations })));
  check('no_validation_story_rows', snapshot.timeline.every(step => !privateProcedure.test(step.description)));
  const html = htmlBytes.toString('utf8');
  check('normal_manual_feedback_controls', /id="prompt-count"/.test(html) && /id="prompt-review"/.test(html)
    && /id="copy-prompt"/.test(html) && /id="comment-composer"/.test(html) && /class="prompt-state"/.test(html)
    && !/class="prompt-bar"/.test(html));
  const meta = html.match(/<meta\s+[^>]*http-equiv="Content-Security-Policy"[^>]*>/i)?.[0] ?? '';
  const policy = (meta.match(/\bcontent="([^"]*)"/)?.[1] ?? '')
    .replace(/&#39;|&#x27;|&apos;/gi, "'").replace(/&quot;|&#34;|&#x22;/gi, '"').replace(/&amp;/g, '&');
  const directives = new Map(policy.split(';').map(value => value.trim().split(/\s+/)).filter(parts => parts[0]).map(([name, ...values]) => [name, values]));
  const none = name => directives.get(name)?.length === 1 && directives.get(name)[0] === "'none'";
  const hashes = name => directives.get(name)?.length > 0 && directives.get(name).every(value => /^'sha256-[A-Za-z0-9+/]+={0,2}'$/.test(value));
  check('strict_offline_policy', ['default-src', 'connect-src', 'object-src', 'base-uri', 'form-action', 'img-src'].every(none)
    && hashes('script-src') && hashes('style-src') && !/unsafe-inline|unsafe-eval/.test(policy));
  check('source_inputs_unchanged', Buffer.from(await readFile(snapshotPath)).equals(snapshotBytes)
    && Buffer.from(await readFile(htmlPath)).equals(htmlBytes)
    && Buffer.from(await readFile(join(fixtureDirectory, 'source-events.json'))).equals(eventsBytes)
    && Buffer.from(await readFile(join(fixtureDirectory, 'session.json'))).equals(sessionBytes));
  return {
    report: { schema_version: '1.0', ok: errors.length === 0, synthetic_sources: true, checks, errors,
      snapshot_sha256: sha(snapshotBytes), html_sha256: sha(htmlBytes), fixture_sha256: sha(eventsBytes),
      limitation: 'Local fixture/output verification, not independent live verification, native dispatch proof, a security boundary or user acceptance.' },
    publicSummary: { application: snapshot.header_copy.application_name, purpose: snapshot.header_copy.workflow_purpose,
      scenario: snapshot.header_copy.scenario_name, description: snapshot.header_copy.scenario_description, steps: publicSteps, limitations },
  };
}

const invokedPath = process.argv[1] ? await realpath(resolve(process.argv[1])).catch(() => undefined) : undefined;
if (invokedPath === await realpath(fileURLToPath(import.meta.url))) {
  const [snapshot, html, skill] = process.argv.slice(2);
  if (!snapshot || !html || !skill) throw new Error('Expected SNAPSHOT HTML INSTALLED_SKILL_ROOT');
  const fixtureDirectory = join(dirname(resolve(process.argv[1])), 'fixtures');
  let result;
  try { result = await verifyReview({ snapshotPath: resolve(snapshot), htmlPath: resolve(html), skillRoot: resolve(skill), fixtureDirectory }); }
  catch { result = { report: { schema_version: '1.0', ok: false, errors: ['invalid_review_or_fixture'] }, publicSummary: { error: 'Review verification did not complete.' } }; }
  await writeFile('verification.json', JSON.stringify(result.report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  await writeFile('review-public-summary.json', JSON.stringify(result.publicSummary, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(result.report)); process.exitCode = result.report.ok ? 0 : 1;
}
