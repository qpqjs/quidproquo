import qpqESLintConfig from '@qpqjs/eslint-config';

// B9 exception: the CLI talks to the developer through the console.
export default [...qpqESLintConfig, { rules: { 'no-console': 'off' } }];
