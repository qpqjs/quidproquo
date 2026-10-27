import { describe, expect, it } from 'vitest';

import { getStoryNameFromQpqFunctionRuntime, InvalidQpqFunctionRuntimeError } from './qpqFunctionRuntimeUtils';

describe('getStoryNameFromQpqFunctionRuntime', () => {
  it('returns the method after the :: separator for a relative path runtime', () => {
    expect(getStoryNameFromQpqFunctionRuntime('/entry/controller::onAuthUpdate')).toBe('onAuthUpdate');
  });

  it('returns the functionName for an advanced runtime', () => {
    expect(getStoryNameFromQpqFunctionRuntime({ basePath: '/repo', relativePath: '/entry', functionName: 'handler' })).toBe('handler');
  });

  it('throws when a string runtime is missing the :: function name', () => {
    expect(() => getStoryNameFromQpqFunctionRuntime('/entry/controller' as any)).toThrow(InvalidQpqFunctionRuntimeError);
    expect(() => getStoryNameFromQpqFunctionRuntime('/entry/controller::')).toThrow(InvalidQpqFunctionRuntimeError);
  });
});
