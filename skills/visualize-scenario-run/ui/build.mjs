import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const cwd = fileURLToPath(new URL('.', import.meta.url));
const check = process.argv.includes('--check');
const temporary = await mkdtemp(join(tmpdir(), 'scenario-ui-build-'));
try {
  const common = { absWorkingDir: cwd, bundle: true, minify: true, legalComments: 'eof', write: false, define: { 'process.env.NODE_ENV': '"production"' }, jsx: 'automatic', charset: 'ascii' };
  let licenses = await readFile(join(cwd, 'THIRD-PARTY.md'), 'utf8');
  for (const name of ['react', 'react-dom', 'scheduler', '@radix-ui/react-slot', '@radix-ui/react-compose-refs', 'class-variance-authority', 'clsx', 'tailwind-merge', 'tailwindcss']) {
    const base = join(cwd, 'node_modules', name);
    const pkg = JSON.parse(await readFile(join(base, 'package.json'), 'utf8'));
    let license;
    for (const file of ['LICENSE', 'LICENSE.txt', 'license', 'license.md', 'LICENSE.md']) {
      try { license = await readFile(join(base, file), 'utf8'); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    // This Radix tarball omits LICENSE; both primitives belong to the same
    // radix-ui/primitives repository and carry its WorkOS MIT license.
    if (!license && name === '@radix-ui/react-compose-refs' && pkg.license === 'MIT') license = await readFile(join(cwd, 'node_modules/@radix-ui/react-slot/LICENSE'), 'utf8');
    if (!license) throw new Error(`Missing license: ${name}`);
    licenses += `\n\n${name}@${pkg.version}\n${license}`;
  }
  const browser = await build({ ...common, entryPoints: ['src/browser.jsx'], platform: 'browser', format: 'iife', target: ['chrome120', 'safari17'] });
  const server = await build({ ...common, entryPoints: ['src/server.jsx'], platform: 'node', format: 'esm', target: 'node22', banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
  execFileSync(join(cwd, 'node_modules/.bin/tailwindcss'), ['-i', 'src/styles.css', '-o', join(temporary, 'ui.css'), '--minify'], { cwd, stdio: 'pipe' });
  const notice = `\n/*\n${licenses.replaceAll('*/', '* /')}\n*/\n`;
  const files = { 'browser.js': browser.outputFiles[0].text + notice, 'server.mjs': server.outputFiles[0].text + notice, 'ui.css': await readFile(join(temporary, 'ui.css'), 'utf8'), 'THIRD-PARTY-LICENSES.txt': licenses };
  await mkdir(join(cwd, 'dist'), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    if (name !== 'server.mjs' && /<\/(?:script|style)/i.test(content)) throw new Error(`Unsafe inline asset: ${name}`);
    const path = join(cwd, 'dist', name);
    if (check) {
      if (await readFile(path, 'utf8') !== content) throw new Error(`Stale UI build: ${name}`);
    } else await writeFile(path, content);
  }
  console.log(check ? 'Bundled UI is reproducible and current.' : 'Built offline UI assets.');
} finally { await rm(temporary, { recursive: true, force: true }); }
