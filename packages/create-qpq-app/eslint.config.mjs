import qpqESLintConfig from '@qpqjs/eslint-config';

// B9 exception: the scaffolder talks to the developer through the console.
export default [...qpqESLintConfig, { ignores: ['template/**', 'scripts/**'] }, { rules: { 'no-console': 'off' } }];
