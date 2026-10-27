import { describe, expect, it } from 'vitest';

import * as publicApi from './index';

describe('quidproquo-actionprocessor-web public surface', () => {
  it('exports the processor resolvers consumers depend on', () => {
    expect(typeof publicApi.getWebActionProcessors).toBe('function');
    expect(typeof publicApi.createApiRequestActionProcessor).toBe('function');
    expect(typeof publicApi.getApiRequestActionProcessor).toBe('function');
    expect(typeof publicApi.getCoreActionProcessor).toBe('function');
    expect(typeof publicApi.getWebActionProcessor).toBe('function');
    expect(typeof publicApi.getWebserverActionProcessor).toBe('function');
  });
});
