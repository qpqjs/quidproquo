import qpqESLintConfig from '@qpqjs/eslint-config';

// B9 exception: the bundler reports to the developer through the console.
export default [...qpqESLintConfig, { rules: { 'no-console': 'off' } }];
