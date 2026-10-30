import jsdoc from 'eslint-plugin-jsdoc';

// Every export gets a short JSDoc (G7). A warning, so a missing one never blocks a build.
export const jsdocConfigs = [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/index.ts', '**/index.tsx'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'warn',
        {
          // The rule's fixer only inserts an empty `/** */` block, which is worse than no comment, so lint:fix never runs it.
          enableFixer: false,
          publicOnly: true,
          require: { ArrowFunctionExpression: true, ClassDeclaration: true, FunctionDeclaration: true, FunctionExpression: true },
          contexts: ['TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSEnumDeclaration'],
        },
      ],
    },
  },
];
