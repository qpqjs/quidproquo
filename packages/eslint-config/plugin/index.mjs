import askPrefixGeneratorOnly from './rules/ask-prefix-generator-only.mjs';
import filenameMatchesExport from './rules/filename-matches-export.mjs';
import noHistoryComments from './rules/no-history-comments.mjs';
import nullableOverNull from './rules/nullable-over-null.mjs';
import oneExportPerFile from './rules/one-export-per-file.mjs';
import requireYieldStar from './rules/require-yield-star.mjs';

const plugin = {
  meta: {
    name: 'eslint-plugin-qpq',
    version: '0.1.0',
  },
  rules: {
    'require-yield-star': requireYieldStar,
    'ask-prefix-generator-only': askPrefixGeneratorOnly,
    'no-history-comments': noHistoryComments,
    'nullable-over-null': nullableOverNull,
    'one-export-per-file': oneExportPerFile,
    'filename-matches-export': filenameMatchesExport,
  },
};

// Flat-config preset: `...qpqPlugin.configs.recommended` (it is a single
// config object, spread it into the array or include it directly).
plugin.configs = {
  recommended: {
    plugins: { qpq: plugin },
    rules: {
      'qpq/require-yield-star': 'error',
      'qpq/ask-prefix-generator-only': 'error',
      'qpq/no-history-comments': 'error',
      // Warns until the `| null` cleanup lands (H1 keeps this one out of the error flip).
      'qpq/nullable-over-null': 'warn',
      'qpq/one-export-per-file': 'warn',
      'qpq/filename-matches-export': 'warn',
    },
  },
};

export default plugin;
