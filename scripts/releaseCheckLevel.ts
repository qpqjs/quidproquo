// Refuses a patch release while breaking-changes.md has bullets under `## vNext`.
// On 0.x a break goes out as a minor bump (0.1.x to 0.2.0), because npm treats
// `^0.1.34` as "any 0.1.x": a break shipped as a patch reaches every caller unasked.
// Usage: npx tsx ./scripts/releaseCheckLevel.ts <patch|minor|major>

import { readFileSync } from 'fs';
import { join } from 'path';

import { readMarkdownSection } from './readMarkdownSection';

const ROOT = join(__dirname, '..');
const LEVELS = ['patch', 'minor', 'major'];

const countBreakingChanges = (): number => {
  const markdown = readFileSync(join(ROOT, 'breaking-changes.md'), 'utf8');
  const vNext = readMarkdownSection(markdown, 'vNext') ?? '';

  return vNext.split('\n').filter((line) => line.startsWith('- ')).length;
};

const main = () => {
  const level = process.argv[2];

  if (!LEVELS.includes(level)) {
    console.error(`Expected a release level (${LEVELS.join(', ')}), got: ${level ?? 'nothing'}`);
    process.exit(1);
  }

  const breakingChanges = countBreakingChanges();

  if (level === 'patch' && breakingChanges > 0) {
    console.error(`breaking-changes.md has ${breakingChanges} breaking change(s) under ## vNext, so this release must be minor, not patch.`);
    console.error('If an entry does not break someone upgrading from the last release, remove it and run again.');
    process.exit(1);
  }

  console.log(`${level} release, ${breakingChanges} breaking change(s) under ## vNext`);
};

main();
