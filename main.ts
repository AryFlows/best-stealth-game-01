// Frost Veil — the entry program. Copies game/ and screenshots/ from this
// repository into the output directory and writes /output/dossier.json with
// buildDossier from the kit's vendored library. Node 22, standard library
// only, no build step: `node main.ts`.
// The output directory is a grader mount: this program never removes it —
// it creates it if missing and clears only its CONTENTS.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');
if (!existsSync(gameSrc)) throw new Error('main.ts: no game/ directory in ' + repoRoot);
if (!existsSync(shotsSrc)) throw new Error('main.ts: no screenshots/ directory in ' + repoRoot);
/* Fail fast, with a readable error, when the screenshots break the caps
   buildDossier would refuse on anyway. */
const shotNames = readdirSync(shotsSrc).filter((n) => /\.(png|jpe?g)$/i.test(n)).sort();
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error('main.ts: screenshots/ holds ' + shotNames.length + ' images, expected 3 or 4');
}
for (const name of shotNames) {
  const { size } = statSync(join(shotsSrc, name));
  if (size > 262144) throw new Error('main.ts: screenshots/' + name + ' is ' + size + ' bytes, over the 262144 cap');
}
cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log('Frost Veil: wrote ' + outDir + ' (game/, screenshots/, dossier.json ' + dossier.length + ' bytes)');
