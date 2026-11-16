// Append-only local dispatch claims; no models, review authorship or overwrites.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const secondPath = path => `${path}.iteration-2`;
const readClaim = async path => {
  const bytes = await readFile(path);
  if (bytes.length > 4096) throw new Error('claim');
  const claim = JSON.parse(bytes.toString('utf8'));
  if (Object.keys(claim).sort().join(',') !== 'candidate_digest,copy_reviews_consumed,max_copy_reviews,schema_version' ||
      claim.schema_version !== '1.1' || claim.max_copy_reviews !== 2 ||
      ![1, 2].includes(claim.copy_reviews_consumed) || !/^[a-f0-9]{64}$/.test(claim.candidate_digest)) throw new Error('claim');
  return claim;
};
export async function copyBudget(path) {
  const first = await readClaim(path);
  if (first.copy_reviews_consumed !== 1) throw new Error('claim');
  try {
    const second = await readClaim(secondPath(path));
    if (second.copy_reviews_consumed !== 2) throw new Error('claim');
    return second;
  } catch (error) {
    if (error.code === 'ENOENT') return first;
    throw error;
  }
}
export async function claimCopy(path, digest) {
  const create = async (claimPath, iteration) => {
    const claim = { schema_version: '1.1', max_copy_reviews: 2, copy_reviews_consumed: iteration, candidate_digest: digest };
    await writeFile(claimPath, `${JSON.stringify(claim)}\n`, { flag: 'wx', mode: 0o600 });
    return { ok: true, budget_path: resolve(path), claim_path: resolve(claimPath), ...claim };
  };
  try { return await create(path, 1); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const budget = await copyBudget(path); // Reject historical one-call or malformed markers.
  if (budget.copy_reviews_consumed === 1) {
    try { return await create(secondPath(path), 2); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  return { ok: false, errors: [{ path: '$.copy_review', code: 'copy_review_limit', message: 'Both copy-review dispatches are consumed.', repair: 'Keep the second reviewed text and its findings; do not dispatch again or reset the claims.' }] };
}
