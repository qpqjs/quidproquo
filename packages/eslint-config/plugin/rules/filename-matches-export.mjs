import path from 'node:path';

import { collectExports } from './exports/collectExports.mjs';
import { isAllowedPair } from './exports/isAllowedPair.mjs';
import { isExemptFile } from './exports/isExemptFile.mjs';
import { isScreaming } from './exports/isScreaming.mjs';
import { primaryName } from './exports/primaryName.mjs';
import { screamingToCamel } from './exports/screamingToCamel.mjs';

// A file is named after what it exports (G1); a SCREAMING constant lives in a camelCase
// file (G8). Only files the one-export rule accepts are checked here.
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'the file name matches its export' },
    schema: [],
    messages: {
      mismatch: "'{{file}}' exports '{{name}}'; name the file '{{expected}}' (G1).",
    },
  },
  create(context) {
    if (isExemptFile(context.filename)) return {};
    return {
      Program(program) {
        const names = collectExports(program).map((e) => e.name);
        if (names.length === 0 || names.length > 2 || names.includes('default') || names.includes('*')) return;
        if (names.length === 2 && !isAllowedPair(names[0], names[1])) return;
        const name = primaryName(names);
        const expected = isScreaming(name) ? screamingToCamel(name) : name;
        // Every module extension the config lints, so the plugin's own .mjs files are held to the rule too.
        const base = path.basename(context.filename).replace(/\.[cm]?[jt]sx?$/, '');
        if (base !== expected) {
          context.report({ node: program, messageId: 'mismatch', data: { file: path.basename(context.filename), name, expected } });
        }
      },
    };
  },
};
