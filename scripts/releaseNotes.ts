// Writes one version's CHANGELOG.md section to a file, for the GitHub release body.
// Fails when the section is missing or empty, which also catches a /changes run that
// did not write its entry.
// Usage: npx tsx ./scripts/releaseNotes.ts <version> <outFile>

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import { readMarkdownSection } from './readMarkdownSection';

const ROOT = join(__dirname, '..');

const main = () => {
  const [version, outFile] = process.argv.slice(2);

  if (!version || !outFile) {
    console.error('Usage: releaseNotes.ts <version> <outFile>');
    process.exit(1);
  }

  const notes = readMarkdownSection(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'), version);

  if (!notes) {
    console.error(`CHANGELOG.md has no entry for ${version}`);
    process.exit(1);
  }

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${notes}\n`, 'utf8');
  console.log(`wrote the ${version} release notes to ${outFile}`);
};

main();
