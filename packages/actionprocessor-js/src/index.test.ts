import { describe, expect, it } from 'vitest';

import * as publicApi from './index';

describe('quidproquo-actionprocessor-js public surface', () => {
  it('exports the processor resolvers consumers depend on', () => {
    expect(typeof publicApi.getCoreActionProcessor).toBe('function');
    expect(typeof publicApi.getWebserverActionProcessor).toBe('function');
    expect(typeof publicApi.getCustomActionActionProcessor).toBe('function');
    expect(typeof publicApi.getGuidActionProcessor).toBe('function');
    expect(typeof publicApi.getDnsActionProcessor).toBe('function');
  });
});
