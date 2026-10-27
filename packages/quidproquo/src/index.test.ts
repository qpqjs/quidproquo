import { describe, expect, it } from 'vitest';

import * as quidproquo from './index';

describe('quidproquo', () => {
  it('re-exports the core utilities', () => {
    expect(typeof quidproquo.qpqCoreUtils).toBe('object');
  });

  it('re-exports the webserver utilities', () => {
    expect(typeof quidproquo.qpqWebServerUtils).toBe('object');
  });
});
