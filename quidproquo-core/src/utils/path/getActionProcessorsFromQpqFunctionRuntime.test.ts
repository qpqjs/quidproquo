import { describe, expect, it } from 'vitest';

import { getActionProcessorsFromQpqFunctionRuntime } from './getActionProcessorsFromQpqFunctionRuntime';

describe('getActionProcessorsFromQpqFunctionRuntime', () => {
  it('returns the action processor sources of an advanced runtime', () => {
    const actionProcessors = [{ basePath: '/base', relativePath: '/overrides::getOverrides', functionName: 'getOverrides' }];

    expect(getActionProcessorsFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'rel', functionName: 'fn', actionProcessors })).toBe(
      actionProcessors,
    );
  });

  it('returns undefined for an advanced runtime without action processors', () => {
    expect(getActionProcessorsFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'rel', functionName: 'fn' })).toBeUndefined();
  });

  it('returns undefined for a relative path string runtime and for no runtime', () => {
    expect(getActionProcessorsFromQpqFunctionRuntime('/entry/controller::onAuth')).toBeUndefined();
    expect(getActionProcessorsFromQpqFunctionRuntime(undefined)).toBeUndefined();
  });
});
