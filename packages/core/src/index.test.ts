import { describe, expect, it } from 'vitest';

import * as core from './index';

// The package entry point re-exports every public barrel. Importing it here exercises
// each re-export chain and guards against a barrel that fails to resolve.
describe('quidproquo-core entry point', () => {
  it('re-exports the core building blocks', () => {
    expect(typeof core.defineApplication).toBe('function');
    expect(typeof core.runStory).toBe('function');
    expect(typeof core.askCatch).toBe('function');
    expect(typeof core.askNewGuid).toBe('function');
    expect(typeof core.isString).toBe('function');
  });

  it('exposes the aggregated qpqCoreUtils namespace', () => {
    expect(typeof core.qpqCoreUtils.getApplicationName).toBe('function');
  });
});
