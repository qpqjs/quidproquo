import path from 'node:path';

import { collectExports, isAllowedPair, isExemptFile, isScreaming, primaryName, screamingToCamel } from './exportsOfFile.mjs';

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
        const base = path.basename(context.filename).replace(/\.[jt]sx?$/, '');
        if (base !== expected) {
          context.report({ node: program, messageId: 'mismatch', data: { file: path.basename(context.filename), name, expected } });
        }
      },
    };
  },
};
