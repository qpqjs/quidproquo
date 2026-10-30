import { collectExports, isAllowedPair, isExemptFile } from './exportsOfFile.mjs';

// One exported thing per file (G1). Barrels, declaration files and tests are exempt, and the
// two sanctioned pairs (askXBase + askX, XEffect + XPayload) count as one concept.
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'one export per file, apart from the G1 pairs' },
    schema: [],
    messages: {
      tooMany: "This file exports {{count}} things ('{{names}}'); one per file, named after it (G1).",
    },
  },
  create(context) {
    if (isExemptFile(context.filename)) return {};
    return {
      Program(program) {
        const exports = collectExports(program);
        if (exports.length <= 1) return;
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
