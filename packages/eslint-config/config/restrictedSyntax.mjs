// Mechanical checks for the code standards marked lint (C2, C3, D4a, G5, G6, E, D1, D6).
// They warn until every package has had its autofix pass; a later change flips them to errors.
const inGenerator = (selector) => `:function[generator=true] ${selector}`;

const base = [
  {
    selector: 'ExpressionStatement > YieldExpression[delegate=true] > CallExpression[callee.name=/^(askThrowError|askErrorThrow)$/]',
    message: 'C3: throw with `return yield* askErrorThrow(...)` so control visibly stops here.',
  },
  {
    selector: 'SpreadElement > CallExpression[callee.name=/^define[A-Z]/]',
    message: 'D4a: a define* result is a config element; config flattens nested arrays, never spread it.',
  },
  {
    selector: inGenerator("CallExpression[callee.object.name='Date'][callee.property.name='now']"),
    message: 'C2: stories are deterministic; use askDateNow().',
  },
  {
    selector: inGenerator("NewExpression[callee.name='Date']"),
    message: 'C2: stories are deterministic; use askDateNow().',
  },
  {
    selector: inGenerator("CallExpression[callee.object.name='Math'][callee.property.name='random']"),
    message: 'C2: stories are deterministic; use askNewGuid() or a seeded source.',
  },
  {
    selector: inGenerator("CallExpression[callee.name='randomUUID'], CallExpression[callee.property.name='randomUUID']"),
    message: 'C2: stories are deterministic; use askNewGuid().',
  },
  {
    selector: 'TSUnionType > TSNullKeyword',
    message: 'G5: use Nullable<T> for a value that may be absent.',
  },
  {
    selector: "BinaryExpression[operator=/^[!=]==$/][left.property.name='configSettingType']",
    message: 'D1: narrow a setting with its is<Name>Setting guard, not by comparing configSettingType.',
  },
];

export const restrictedSyntaxConfigs = [
  {
    rules: {
      'no-restricted-syntax': ['warn', ...base],
    },
  },
  {
    // Re-exports are what barrels are for (G6); the utils namespace composers are the
    // one sanctioned exception.
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/index.ts', '**/index.tsx', '**/qpq*UtilsLib.ts', '**/qpq*Utils.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        ...base,
        { selector: 'ExportNamedDeclaration[source]', message: 'G6: `export ... from` belongs in index.ts only.' },
        { selector: 'ExportAllDeclaration', message: 'G6: `export * from` belongs in index.ts only.' },
      ],
    },
  },
  {
    // A hook is defined in hooks/ (E rules), never beside a component.
    files: ['**/*.tsx'],
    ignores: ['**/hooks/**'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        ...base,
        {
          selector: 'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^use[A-Z]/]',
          message: 'E: hooks live in a hooks/ folder, one per file.',
        },
      ],
    },
  },
  {
    // Physical names are built by the naming module (D6), nowhere else.
    files: ['**/*.ts'],
    ignores: ['**/*NamingUtils*.ts', '**/naming/**', '**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        ...base,
        {
          selector: 'TemplateLiteral > Identifier[name=/^(applicationName|environment|feature|featureName|moduleName)$/]',
          message: 'D6: application, environment, feature and module names are composed by the naming module only.',
        },
      ],
    },
  },
];
