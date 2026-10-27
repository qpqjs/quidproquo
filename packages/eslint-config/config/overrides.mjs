export const overrides = {
  rules: {
    // Generators
    'require-yield': 'off',

    // Dev Exp
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'prefer-const': 'off',

    // Allow @ts-ignore, not just @ts-expect-error
    '@typescript-eslint/ban-ts-comment': 'off',

    // Probably remove
    '@typescript-eslint/no-unnecessary-type-arguments': 'off',
    '@typescript-eslint/no-unnecessary-generics': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
  },
};
