export { expectGenerator, GeneratorExpectChain } from './generatorExpect';
export * from './types';

// The vitest matchers are NOT exported here: they register globally as a side
// effect, so vitest users opt in explicitly via `import 'quidproquo-testing/vitest'`.
