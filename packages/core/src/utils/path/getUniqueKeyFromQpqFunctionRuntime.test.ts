import { describe, expect, it } from 'vitest';

import { getUniqueKeyFromQpqFunctionRuntime } from './getUniqueKeyFromQpqFunctionRuntime';

describe('getUniqueKeyFromQpqFunctionRuntime', () => {
  it('returns the relative path string unchanged', () => {
    expect(getUniqueKeyFromQpqFunctionRuntime('/entry/controller::onAuth')).toBe('/entry/controller::onAuth');
  });

  it('composes a key from the advanced runtime parts', () => {
    expect(getUniqueKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'service/entry', functionName: 'onAuth' })).toBe(
      '/base/service/entry::onAuth',
    );
  });
});
