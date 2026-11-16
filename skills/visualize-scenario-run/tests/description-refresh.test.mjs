// Scripted synthetic tests only. Actual narrow native authoring is a separate task.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { snapshot,fakeCopyReview,fakeChecker } from './fixtures.mjs';
import { assembleDescriptionRefresh,descriptionRefreshPacket,descriptionCacheDigest,cachedDescriptionProjection,generateDescriptionOnce } from '../scripts/description-refresh.mjs';
import { validate,validateCandidate,validateCopyReview,validateFactualReview,factualDigest,copyFields,prepareRenderSnapshot } from '../scripts/contracts.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { bundle } from './fixtures.mjs';
import { reviewPacket } from '../scripts/review-io.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { feedbackContext,feedbackRuntime } from '../scripts/feedback.mjs';
const output=()=>({schema_version:'1.0',scenario_description:'A customer asks about opening hours, and the assistant prepares a reply draft for review.',claim_refs:['context','claim-draft-1']});
const packetFor=async s=>{const {review,copy_review,copy_review_iterations,...candidate}=s;return reviewPacket('fact',candidate,'/synthetic/source.json');};
const reviewed=async c=>({...c,copy_review:fakeCopyReview(c),review:await fakeChecker().check(c),copy_review_iterations:1});

test('closed draft 1.2 explicitly assembles new summary semantics without altering original workflow/scenario or run results',async()=>{
 const b=bundle(),s=await snapshot(),draft={schema_version:'1.2',snapshot_id:'current-summary',editor_id:'current-author',parent_agent_id:s.parent_agent_id,summary:s.summary,header_copy:{application_name:s.header_copy.application_name,workflow_purpose:s.header_copy.workflow_purpose,scenario_name:s.header_copy.scenario_name,scenario_description:output().scenario_description,claim_refs:s.header_copy.claim_refs,description_claim_refs:output().claim_refs},claims:s.claims,events:s.timeline.map(({id,description,claim_refs,supporting_detail})=>({occurrence_id:id,description,claim_refs,supporting_detail})),artifact_claims:s.artifact_claims,omitted_occurrences:s.omitted_occurrences};
 const a=assembleCandidate(b,draft);assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.snapshot.schema_version,'1.8');assert.deepEqual(a.snapshot.workflow,b.workflow);assert.deepEqual(a.snapshot.scenario,b.scenario);assert.equal(a.snapshot.run.observed_resulting_state,b.run.observed_resulting_state);
});

test('source version contradiction is public business evidence, not a raw private review paragraph',async()=>{
 const s=await snapshot(),d=await reviewed(assembleDescriptionRefresh(s,output()).candidate);
 d.review.findings[0].gaps=["Conflict in candidate: run.application_version 'unknown' contradicts source application_version 'app-3'."];
 const html=renderHtml(d).html.split('<textarea id="feedback-context"')[0];
 assert.match(html,/Application version differs between records: unknown \/ app-3\./);
 assert.doesNotMatch(html,/Conflict in candidate|run.application_version/);
});

test('general present-tense policy replaces run-result components only in new 1.8; original 1.7 remains original',async()=>{
 const s=await snapshot(),before=structuredClone(s),p=descriptionRefreshPacket(s,await packetFor(s));
 assert.match(p.requirements,/GENERAL PRESENT-TENSE/);assert.match(p.requirements,/ONLY/);assert.match(p.requirements,/No observed-result/);assert.match(p.requirements,/one concise sentence/);
 assert.equal(p.product_policy.version,'1.1');assert.equal(p.kind,'scenario-description-only');
 const a=assembleDescriptionRefresh(s,output());assert.equal(a.ok,true);assert.equal(a.candidate.schema_version,'1.8');
 assert.equal(a.candidate.header_copy.starting_context,undefined);assert.equal(a.candidate.header_copy.observed_result,undefined);
 assert.equal(a.candidate.run.observed_resulting_state,s.run.observed_resulting_state);assert.deepEqual(a.candidate.timeline,s.timeline);
 assert.equal(prepareRenderSnapshot(s).ok,true);assert.deepEqual(s,before);
 const bad=structuredClone(a.candidate);bad.header_copy.observed_result='The run succeeded.';assert.equal(validateCandidate(bad).ok,false);
});

test('description refresh proves byte-identical other authored text, references, full specifications and source/artifact payloads',async()=>{
 const s=await snapshot(),a=assembleDescriptionRefresh(s,output());
 assert.equal(JSON.stringify(cachedDescriptionProjection(a.candidate)),JSON.stringify(cachedDescriptionProjection(s)));
 assert.equal(descriptionCacheDigest(s),descriptionCacheDigest(a.candidate));
 const before=new Map(copyFields(s).map(f=>[f.field_path,f]));
 for(const f of copyFields(a.candidate).filter(f=>f.field_path!=='$.header_copy.scenario_description')){assert.equal(f.text,before.get(f.field_path).text);assert.equal(f.field_digest,before.get(f.field_path).field_digest);}
 for(const field of ['workflow','scenario','evidence','artifacts','claims','timeline','run','presentation','coverage'])assert.equal(JSON.stringify(s[field]),JSON.stringify(a.candidate[field]),field);
 assert.equal(a.cache_proof.all_unaffected_text_and_sources_equal,true);
 a.candidate.header_copy.application_name='Other Name';assert.notEqual(descriptionCacheDigest(s),descriptionCacheDigest(a.candidate));
});

test('one generation is consumed before callback; invalid/throwing output and resumes never get a second author attempt',async()=>{
 const s=await snapshot(),evidencePacket=await packetFor(s),dir=await mkdtemp(join(tmpdir(),'description-once-'));
 for(const [name,generate]of [['bad',async()=>({...output(),application_name:'Not allowed'})],['throw',async()=>{throw new Error('stop');}],['valid',async()=>output()]]){
  let calls=0;const claimPath=join(dir,name+'.json');const callback=async packet=>{calls++;assert.equal((await stat(claimPath)).mode&0o777,0o600);assert.equal(packet.kind,'scenario-description-only');return generate();};
  const r=await generateDescriptionOnce({source:s,evidencePacket,claimPath,generate:callback});assert.equal(r.generations,1);assert.equal(r.ok,name==='valid');
  const bytes=await readFile(claimPath);const again=await generateDescriptionOnce({source:s,evidencePacket,claimPath,generate:callback});assert.equal(again.ok,false);assert.equal(calls,1);assert.deepEqual(await readFile(claimPath),bytes);
 }
});

test('malformed/mismatching source packet consumes no generation; closed output cannot rewrite other fields or invent claims',async()=>{
 const s=await snapshot(),evidencePacket=await packetFor(s),dir=await mkdtemp(join(tmpdir(),'description-source-'));let calls=0;
 evidencePacket.candidate.summary+=' different';
 const r=await generateDescriptionOnce({source:s,evidencePacket,claimPath:join(dir,'claim'),generate:async()=>{calls++;return output();}});assert.equal(r.ok,false);assert.equal(calls,0);await assert.rejects(stat(join(dir,'claim')),{code:'ENOENT'});
 for(const payload of [{...output(),extra:'x'},{...output(),claim_refs:[]},{...output(),claim_refs:['missing']},{...output(),scenario_description:''},{...output(),scenario_description:'a '.repeat(31)},{...output(),scenario_description:'😀'.repeat(201)}])assert.equal(assembleDescriptionRefresh(s,payload).ok,false);
});

test('current descriptor carries general summary semantics and budgets; both genuine review bindings must change',async()=>{
 const s=await snapshot(),a=assembleDescriptionRefresh(s,output()),c=a.candidate;
 const packet=await reviewPacket('copy',c,'/synthetic/new.json');assert.equal(packet.rule_versions.header_copy,'1.1');assert.match(packet.header_review.requirements,/GENERAL PRESENT-TENSE/);
 assert.equal(packet.header_copy_contract.fields.scenario_description.maxWords,30);assert.equal(packet.header_copy_contract.fields.scenario_description.maxCharacters,200);
 assert.ok(packet.fields.some(f=>f.field_path==='$.header_copy.scenario_description'));assert.ok(!packet.fields.some(f=>/starting_context|observed_result$/.test(f.field_path)&&f.field_path.startsWith('$.header_copy.')));
 assert.notEqual(factualDigest(c),s.review.factual_digest);assert.equal(validateCopyReview(c,s.copy_review).ok,false);assert.equal(validateFactualReview(c,s.review).ok,false);
 const d=await reviewed(c);assert.equal(validate(d).ok,true);assert.equal(d.copy_review.candidate_digest,d.review.factual_digest);
 d.header_copy.scenario_description+=' Again.';assert.equal(renderHtml(d).ok,false);
});

test('real new renderer shows only the brief general summary; run observations stay in run/timeline and old 1.7 rendering keeps old wording',async()=>{
 const s=await snapshot(),d=await reviewed(assembleDescriptionRefresh(s,output()).candidate),html=renderHtml(d).html;
 assert.ok(html.includes(`<p class="description">${output().scenario_description}</p>`));
 assert.ok(!html.match(/<p class="description">([^<]*)/)[1].includes(s.header_copy.observed_result));
 assert.ok(html.includes(s.timeline[1].description));assert.equal(d.header_copy.application_name,s.header_copy.application_name);
 assert.ok(renderHtml(s).html.includes(s.header_copy.observed_result));assert.equal(s.schema_version,'1.7');
 const context=feedbackContext(d),r=feedbackRuntime(),prompt=r.compose(context,r.add(context,[],'correct','correct',undefined,'Keep this behavior.'));
 assert.ok(prompt.includes(`Description: ${output().scenario_description}`));assert.ok(prompt.includes(s.scenario.expected_outcome));
});

test('no generation machinery in public markup or composed prompt, even with second nonpass; internal safe bindings and source bytes remain',async()=>{
 const s=await snapshot(),d=await reviewed(assembleDescriptionRefresh(s,output()).candidate);
 d.copy_review_iterations=2;d.copy_review.verdict='revise';
 const passage=d.copy_review.passages[0];d.copy_review.findings=[{field_path:passage.field_path,field_digest:passage.field_digest,rule_group:'meaning',rule_id:'PRIVATE-EDITORIAL',severity:'required',explanation:'PRIVATE editorial generation diagnostic',semantic_risk:'possible'}];
 d.review.findings[0].finding='qualified';d.review.findings[0].gaps=['The prior state is unknown.','PRIVATE reviewer candidate digest machinery'];
 const before=structuredClone(d),html=renderHtml(d).html,publicMarkup=html.split('<textarea id="feedback-context"')[0];
 const forbidden=/copy_review|copy.review|copy.approv|copy.editor|factual_digest|candidate_digest|rule_versions|field_digest|checker_id|reviewer_id|PRIVATE|Source review:|Snapshot schema|Review scope|review qualified/i;
 assert.doesNotMatch(publicMarkup,forbidden);assert.ok(!publicMarkup.includes(d.editor_id));assert.ok(!publicMarkup.includes(d.review.checker_id));assert.ok(!publicMarkup.includes(d.review.factual_digest));
 assert.ok(publicMarkup.includes('The prior state is unknown.'));assert.ok(publicMarkup.includes(d.artifacts[0].after));
 const context=feedbackContext(d),runtime=feedbackRuntime();const cart=runtime.add(context,[],'comment','issue','draft-1','Please clarify this step.');const prompt=runtime.compose(context,cart);
 assert.doesNotMatch(prompt,forbidden);assert.ok(!prompt.includes(d.review.factual_digest));assert.ok(prompt.includes(d.run.id));assert.ok(prompt.includes('Please clarify this step.'));
 assert.equal(context.candidate_digest,d.review.factual_digest);runtime.validate(context,{schema_version:'1.0',items:cart});
 assert.throws(()=>runtime.validate({...context,candidate_digest:'0'.repeat(64)},{schema_version:'1.0',items:cart}));
 assert.deepEqual(d,before);assert.equal(validate(d).ok,true);assert.equal(d.copy_review.verdict,'revise');
});
