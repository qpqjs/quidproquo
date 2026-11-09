import { collectExports } from './exports/collectExports.mjs';
import { isAllowedPair } from './exports/isAllowedPair.mjs';
import { isExemptFile } from './exports/isExemptFile.mjs';

// One main export per file (G1), with a few types or constants that belong to it allowed
// alongside. Barrels, declaration files and tests are exempt, and the two sanctioned pairs
// (askXBase + askX, XEffect + XPayload) count as one concept. The rule cannot tell a helper
// type from a second main export, so it counts: `max` is the export count a file may reach
// before it warns. The shared config sets it; the rule's own default is one.
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'one export per file, apart from the G1 pairs' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany:
        "This file exports {{count}} things ('{{names}}'); one main export per file, named after it, plus only the types or constants that belong to it (G1).",
    },
  },
  create(context) {
    if (isExemptFile(context.filename)) return {};
    const max = context.options[0]?.max ?? 1;
    return {
      Program(program) {
        const exports = collectExports(program);
        if (exports.length <= max) return;
        if (exports.length === 2 && isAllowedPair(exports[0].name, exports[1].name)) return;
        context.report({
          node: exports[1].node,
          messageId: 'tooMany',
          data: { count: String(exports.length), names: exports.map((e) => e.name).join(', ') },
        });
      },
    };
  },
};
