import { describe, expect, it } from 'vitest';

import { getViewsDevtool } from './getViewsDevtool';

describe('getViewsDevtool', () => {
  it('emits no source map for a production build, since the build directory is published as is', () => {
    expect(getViewsDevtool(false)).toBe(false);
  });

  it('keeps inline maps for development', () => {
    expect(getViewsDevtool(true)).toBe('eval-cheap-module-source-map');
  });
});
