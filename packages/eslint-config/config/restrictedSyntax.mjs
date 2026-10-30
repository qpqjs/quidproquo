// Mechanical checks for the code standards marked lint (C2, C3, D4a, G6, E, D1, D6); G5's `| null` is qpq/nullable-over-null.
// Errors since the cleanup pass (H1): every package is clean under them.
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
    selector: inGenerator("NewExpression[callee.name='Date'][arguments.length=0]"),
    message: 'C2: stories are deterministic; use askDateNow().',
  },
  {
    selector: inGenerator("CallExpression[callee.object.name='Math'][callee.property.name='random']"),
    message: 'C2: stories are deterministic; use askNewGuid() or a seeded source.',
  },
  {
    selector: `${inGenerator("CallExpression[callee.name='randomUUID']")}, ${inGenerator("CallExpression[callee.property.name='randomUUID']")}`,
    message: 'C2: stories are deterministic; use askNewGuid().',
  },
];

// D1 is a source rule: a test may read a setting's type to assert what a define* built.
const narrowWithGuard = {
  selector: "BinaryExpression[operator=/^[!=]==$/][left.property.name='configSettingType']",
  message: 'D1: narrow a setting with its is<Name>Setting guard, not by comparing configSettingType.',
};

export const restrictedSyntaxConfigs = [
  {
    rules: {
      'no-restricted-syntax': ['error', ...base],
    },
  },
  {
    // Re-exports are what barrels are for (G6); the utils namespace composers are the
    // one sanctioned exception.
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/index.ts', '**/index.tsx', '**/qpq*UtilsLib.ts', '**/qpq*Utils.ts', '**/awsNamingUtils.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
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
        'error',
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
        'error',
        ...base,
        narrowWithGuard,
        {
          selector: "TemplateLiteral:has(Identifier[name='applicationName']):has(Identifier[name='environment'])",
          message: 'D6: application, environment, feature and module names are composed by the naming module only.',
        },
      ],
    },
  },
  {
    // The one place `T | null` is spelled out.
    files: ['**/Nullable.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
