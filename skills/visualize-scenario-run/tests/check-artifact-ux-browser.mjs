// Local presentation-only check. The actual page is produced by the production
// renderer CLI from an exact completed snapshot, never an alternate authored UI.
// node check-artifact-ux-browser.mjs EXISTING_PLAYWRIGHT NEW_PRIVATE_OUT EXACT_SNAPSHOT
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, stat, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderHtml } from '../scripts/render.mjs';
import { factualDigest } from '../scripts/contracts.mjs';
import { contentDiff } from '../scripts/diff.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';
import { feedbackRuntime } from '../scripts/feedback.mjs';
import { validatedFeedbackContext } from '../scripts/feedback-context.mjs';
import { bundle, sourceBoundCandidate, observedAt } from './fixtures.mjs';
import { concernFixture, technicalFix } from './concern-fixture.mjs';

const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const out = resolve(process.argv[3]), input = resolve(process.argv[4]);
await mkdir(out, { mode: 0o700 });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inputBytes = await readFile(input), doc = JSON.parse(inputBytes), originalDoc = JSON.stringify(doc), digest = factualDigest(doc);
const originalHtmlPath = join(dirname(input), 'completed-review.html'), originalHtmlBytes = await readFile(originalHtmlPath);
const actualHtml = join(out, 'actual-review.html');
const cli = spawnSync(process.execPath, ['--disallow-code-generation-from-strings', new URL('../scripts/render.mjs', import.meta.url).pathname, input, actualHtml], { encoding: 'utf8', timeout: 30000 });
assert.equal(cli.status, 0, cli.stderr || cli.stdout);
assert.equal(JSON.parse(cli.stdout).ok, true);
const generated = await readFile(actualHtml);
assert.equal(generated.toString(), renderHtml(doc).html);
assert.equal((await stat(actualHtml)).mode & 0o777, 0o600);

const cases = [
  ['whitespace-hostile', 'same\r\n\r\nold <script>bad()</script> \r\nrepeat\t \r\nend', 'same\r\n\r\nnew <img src="https://example.test/no" onerror="bad()">\r\nrepeat\t \r\nend\n'],
  ['creation', '', 'Created content.\n'], ['clearing', 'Deleted content.\r\n', ''],
  ['equal', 'Same content.\r\n \r\n', 'Same content.\r\n \r\n'],
  ['repeated', 'a\nb\na\nb\n', 'b\na\nb\na\n'],
];
const fixtures = [];
for (const [label, before, after] of cases) {
  const source = bundle();
  Object.assign(source.artifacts[0], { kind: 'document', media_type: 'text/markdown', source_url: 'https://example.test/source.html' });
  // Exercise empty strings through the real version projection, not by relaxing
  // the historical source bundle's nonempty artifact contract.
  const step=source.occurrences[1]; step.time={at:'2026-01-01T12:00:01Z'}; step.evidence_refs.push('ux-history');
  const later=structuredClone(step); later.id='ux-later'; later.time.at='2026-01-01T12:00:02Z'; source.occurrences.splice(2,0,later);
  source.evidence.push({id:'ux-history',kind:'tool_result',source:{system:'Synthetic captured history'},captured_at:observedAt,content:{before,after},completeness:'complete',redactions:[]});
  const candidate=sourceBoundCandidate(source);
  const draft={schema_version:'1.3',snapshot_id:candidate.snapshot_id,editor_id:candidate.editor_id,parent_agent_id:candidate.parent_agent_id,summary:candidate.summary,header_copy:candidate.header_copy,
    claims:candidate.claims,events:candidate.timeline.map(event=>({occurrence_id:event.id,description:event.description,claim_refs:event.claim_refs,supporting_detail:event.supporting_detail})),
    artifact_claims:candidate.artifact_claims,omitted_occurrences:candidate.omitted_occurrences};
  const versionSource={schema_version:'1.0',bundle_digest:artifactVersionBundleDigest(source),records:[],versions:[
    {id:'ux-before',artifact_id:'a-draft',occurrence_id:step.id,operation:'capture',value_ref:{evidence_id:'ux-history',pointer:'/before'}},
    {id:'ux-after',artifact_id:'a-draft',occurrence_id:later.id,operation:'replace',value_ref:{evidence_id:'ux-history',pointer:'/after'}},
  ]};
  const assembled=assembleCandidate(source,draft,{artifactVersionSource:versionSource}); assert.equal(assembled.ok,true,JSON.stringify(assembled.errors));
  const rendered = renderHtml(assembled.snapshot);
  assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
  const path = join(out, `${label}.html`); await writeFile(path, rendered.html, { flag: 'wx', mode: 0o600 });
  fixtures.push({ label, path, pair: [before, after] });
}
const single = bundle();
Object.assign(single.artifacts[0], { content: '[A **source**](https://example.test/page)\n\n<script>inert</script>\n', media_type: 'text/markdown', source_url: 'https://example.test/page' });
delete single.artifacts[0].before; delete single.artifacts[0].after;
const singlePath = join(out, 'single-captured-side.html');
await writeFile(singlePath, renderHtml(sourceBoundCandidate(single)).html, { flag: 'wx', mode: 0o600 });
const concern = concernFixture().doc, concernPath = join(out, 'synthetic-concern.html');
await writeFile(concernPath, renderHtml(concern).html, { flag: 'wx', mode: 0o600 });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [], requests = [], checks = [], screenshots = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.route('**/*', async route => {
  if (/^https?:/.test(route.request().url())) { requests.push(route.request().url()); await route.abort(); }
  else await route.continue();
});
const capture = async name => { const path=join(out,name); await page.screenshot({ path }); await chmod(path,0o600); screenshots.push(path); };
const count = async expected => assert.equal(await page.locator('#prompt-count').innerText(), String(expected));
async function safety() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await page.locator('img, iframe, object, script[src], link[rel="stylesheet"]').count(), 0);
  assert.deepEqual(await page.locator('[style]:not([style=""])').evaluateAll(nodes => nodes.map(n=>n.outerHTML)), []);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
  for (const tag of ['style','script']) assert.ok(csp.includes(`'sha256-${createHash('sha256').update(await page.locator(tag).textContent()).digest('base64')}'`));
  assert.equal(await page.locator('.top h2, #prompt-summary, .prompt-bar').count(), 0);
  assert.doesNotMatch(await page.locator('.top').innerText(), /Claude Prompt ·|\b(cart|basket|checkout|shopping)\b/i);
  assert.equal(await page.locator('#review-prompt').getAttribute('aria-describedby'), 'prompt-count-description');
  assert.equal(await page.locator('body a[href]').evaluateAll(nodes => nodes.every(a => {
    const icon=a.lastElementChild;
    return a.target==='_blank' && a.rel==='noopener noreferrer' && icon?.matches('svg.external-link-icon') && icon.getAttribute('aria-hidden')==='true' && icon.getAttribute('focusable')==='false' && a.textContent.trim().length>0;
  })), true);
  assert.doesNotMatch(await page.locator('body').innerText(), /copy_review|reviewer_id|checker_id|candidate_digest|field_digest|rule_versions|artifact_version_source|ARTIFACT_CAPTURE/i);
}
async function revealAndReconstruct(diff, before, after) {
  const context = diff.locator('tr.diff-context .diff-text');
  for (let i=0;i<await context.count();i++) assert.equal(await context.nth(i).isVisible(), false);
  const summaries = diff.locator('.diff-context-disclosure > summary');
  for (let i=0;i<await summaries.count();i++) { await summaries.nth(i).focus(); await page.keyboard.press('Enter'); }
  const rows = await diff.locator('tr.diff-line').evaluateAll(nodes => nodes.map(node => ({
    kind: node.classList.contains('diff-added')?'added':node.classList.contains('diff-removed')?'removed':'context',
    text: JSON.parse(node.querySelector('.diff-source').getAttribute('data-source')),
    marker: node.querySelector('.diff-marker').textContent,
    label: node.querySelector('.sr-only').textContent,
  })));
  assert.equal(rows.filter(row=>row.kind!=='added').map(row=>row.text).join(''), before);
  assert.equal(rows.filter(row=>row.kind!=='removed').map(row=>row.text).join(''), after);
  for (const row of rows) { assert.equal(row.marker,row.kind==='added'?'+':row.kind==='removed'?'−':' '); assert.match(row.label,/Added:|Removed:|Unchanged:/); }
  assert.deepEqual(rows.map(({kind,text})=>({kind,text})), contentDiff(before,after));
  return { before_sha256:hash(before), after_sha256:hash(after), context_regions:await summaries.count(), added_utf16:rows.filter(r=>r.kind==='added').reduce((n,r)=>n+r.text.length,0), removed_utf16:rows.filter(r=>r.kind==='removed').reduce((n,r)=>n+r.text.length,0) };
}
try {
  const modes = [[1728,873,'none','no-preference'],[1280,900,'none','no-preference'],[390,700,'none','reduce'],[390,560,'none','reduce'],[320,560,'none','reduce'],[1280,900,'active','reduce']];
  const pairs = doc.timeline.flatMap(event => event.artifact_refs.map(id=>doc.artifacts.find(a=>a.id===id)).filter(a=>typeof a.before==='string'&&typeof a.after==='string'&&(a.before.trim()||a.after.trim())).map(a=>({event_id:event.id,before:a.before,after:a.after})));
  for (const [width,height,forcedColors,reducedMotion] of modes) {
    const mode=`${width}x${height}-${forcedColors}`;
    await page.setViewportSize({width,height}); await page.emulateMedia({forcedColors,reducedMotion});
    await page.goto(pathToFileURL(actualHtml).href); await count(0); await safety();
    assert.equal(await page.locator('.event').count(),doc.timeline.length);
    assert.equal(await page.locator('.content-diff').count(),pairs.length);
    assert.ok(await page.locator('a').filter({hasText:/^Open page$/}).count()>0);
    assert.ok(await page.getByRole('link',{name:'Open Google Doc',exact:true}).count()>0);
    await capture(`actual-${mode}-header.png`);
    const comparisons=[];
    for (let i=0;i<pairs.length;i++) {
      const diff=page.locator('.content-diff').nth(i), pair=pairs[i];
      await diff.locator('.diff-added .diff-text, .diff-removed .diff-text').first().scrollIntoViewIfNeeded();
      if(forcedColors==='none') {
        const added=await diff.locator('tr.diff-added').first().evaluate(n=>getComputedStyle(n).backgroundColor);
        assert.equal(added,'rgb(32, 60, 45)');
      }
      await capture(`actual-${mode}-changes-${i+1}.png`);
      comparisons.push(await revealAndReconstruct(diff,pair.before,pair.after));
    }
    for(const summary of await page.locator('.event-details > summary').all()) await summary.evaluate(n=>n.parentElement.open=true);
    await safety();
    await page.evaluate(()=>scrollTo(0,0)); await page.mouse.move(width-24,Math.min(height-20,200)); await page.mouse.wheel(0,180);
    await page.waitForFunction(()=>document.scrollingElement.scrollTop>100);
    assert.equal(await page.locator('.scenario').evaluate(n=>n.scrollTop),0);
    const dismiss=page.locator('[data-dismiss-concern]').first();
    if(await dismiss.count()) assert.equal(await dismiss.evaluate((n,forced)=>{const s=getComputedStyle(n);return n.tagName==='BUTTON'&&!n.closest('summary')&&parseFloat(s.borderTopWidth)===0&&(forced==='active'||s.backgroundColor==='rgba(0, 0, 0, 0)')&&s.textDecorationLine.includes('underline');},forcedColors),true);
    checks.push({actual:true,width,height,forcedColors,reducedMotion,comparisons,document_wheel:true,all_links_have_trailing_trusted_icon:true});
  }
  for(const fixture of fixtures) for(const [width,height] of [[1280,900],[390,560],[320,560]]) {
    await page.emulateMedia({forcedColors:'none',reducedMotion:'reduce'}); await page.setViewportSize({width,height}); await page.goto(pathToFileURL(fixture.path).href);
    await safety(); assert.equal(await page.locator('.business-artifact script, .business-artifact img').count(),0);
    const proof=await revealAndReconstruct(page.locator('.content-diff'),...fixture.pair);
    await safety(); checks.push({synthetic:fixture.label,width,height,...proof});
  }
  await page.goto(pathToFileURL(singlePath).href); await safety();
  assert.equal(await page.locator('.content-diff, .business-artifact ins, .business-artifact del').count(),0);
  assert.ok((await page.locator('.business-artifact').innerText()).includes('<script>inert</script>'));
  assert.equal(await page.locator('.markdown a svg.external-link-icon').count(),1);
  // Feedback semantics: three explicit items, exact TECH bytes, local dismissal,
  // dedupe/edit/remove, clipboard stubs only, and reload resetting local state.
  await page.setViewportSize({width:1280,height:900}); await page.goto(pathToFileURL(concernPath).href);
  await page.locator('[data-add-correct]').click(); await count(1);
  assert.equal(await page.locator('#prompt-count-description').innerText(),'1 item in prompt.');
  await page.locator('[data-comment][data-event="draft-1"]').click(); await page.locator('#comment-text').fill('Keep the unsent state.'); await page.locator('#save-comment').click();
  await page.locator('.review-flag summary').click(); await page.locator('[data-add-fix]').click(); await count(3);
  await page.locator('[data-add-correct], [data-add-fix]').evaluateAll(nodes=>nodes.forEach(n=>n.click())); await count(3);
  const context=validatedFeedbackContext(concern), runtime=feedbackRuntime();
  let items=runtime.add(context,[],'correct','correct',undefined,'Preserve the behavior shown in this run.');
  items=runtime.add(context,items,'comment','issue','draft-1','Keep the unsent state.'); items=runtime.add(context,items,'fix','issue','draft-1',technicalFix);
  const expected=runtime.compose(context,items);
  await page.locator('[data-dismiss-concern]').focus(); await page.keyboard.press('Space'); await count(3);
  assert.equal(await page.locator('#draft-1 .event-details > summary').evaluate(n=>n===document.activeElement),true);
  await page.locator('#review-prompt').click(); assert.equal(await page.locator('#prompt-preview').inputValue(),expected);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.testCopy=text;}}}));
  await page.locator('#copy-prompt').click(); assert.equal(await page.evaluate(()=>window.testCopy),expected);
  await page.locator('#prompt-items button[aria-label="Edit Comment · Step 2"]').click(); await page.locator('#comment-text').fill('Edited comment.'); await page.locator('#save-comment').click(); await count(3);
  assert.ok((await page.locator('#prompt-preview').inputValue()).includes(technicalFix)); assert.equal(await page.locator('#copy-status').innerText(),'');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Deliberate local denial');}}}));
  await page.locator('#copy-prompt').click(); assert.match(await page.locator('#copy-status').innerText(),/Copy the selected prompt manually/);
  await page.locator('#prompt-items button[aria-label="Remove Comment · Step 2"]').click(); await count(2);
  await page.keyboard.press('Escape'); await page.reload(); await count(0); assert.equal(await page.locator('[data-dismiss-concern]').count(),1);
  await page.locator('[data-add-correct]').click(); assert.equal(await page.locator('#prompt-count').evaluate(n=>getComputedStyle(n).animationName),'none');
  assert.deepEqual(errors,[]); assert.deepEqual(requests,[]);
  assert.deepEqual(await readFile(input),inputBytes); assert.deepEqual(await readFile(originalHtmlPath),originalHtmlBytes);
  assert.equal(JSON.stringify(doc),originalDoc); assert.equal(factualDigest(doc),digest);
  const report={ok:true,presentation_only_rerender:true,not_new_native_generation_or_review:true,input,input_sha256:hash(inputBytes),factual_digest:digest,input_unchanged:true,
    original_html:originalHtmlPath,original_html_sha256:hash(originalHtmlBytes),original_html_unchanged:true,artifact_path:actualHtml,html_sha256:hash(generated),exact_current_renderer:true,mode:'0600',
    dependencies:{'react-diff-view':'3.3.3 (MIT)','lucide-react':'1.73.0 (ISC)'},checks,screenshots,console_errors:errors,http_requests:requests,
    feedback_exact:true,clipboard_stub_and_manual_fallback:true,dismiss_preserves_feedback_and_focus:true,edit_remove_dedupe:true,reload_memory_only:true,
    limits:'Deterministic local presentation verification; no new model/native/application run, source service read, review approval, real clipboard write or user acceptance.'};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx',mode:0o600});
  console.log(JSON.stringify({ok:true,output_directory:out,artifact_path:actualHtml,html_sha256:report.html_sha256,input_sha256:report.input_sha256,checks:checks.length,screenshots:screenshots.length}));
} finally {await browser.close();}
