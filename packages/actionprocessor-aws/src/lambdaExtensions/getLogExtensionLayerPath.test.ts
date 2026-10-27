import { describe, expect, it } from 'vitest';

import { getLogExtensionLayerPath } from './getLogExtensionLayerPath';

describe('getLogExtensionLayerPath', () => {
  it('resolves an absolute path to the extension-layer directory', () => {
    const result = getLogExtensionLayerPath();

    expect(result.startsWith('/')).toBe(true);
    expect(result.endsWith('extension-layer')).toBe(true);
  });
});
