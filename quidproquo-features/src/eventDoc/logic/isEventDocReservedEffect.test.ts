import { describe, expect, it } from 'vitest';

import { EventDocEffect } from '../models';
import { isEventDocReservedEffect } from './isEventDocReservedEffect';

describe('isEventDocReservedEffect', () => {
  it('is true for every reserved lifecycle effect', () => {
    for (const type of Object.values(EventDocEffect)) {
      expect(isEventDocReservedEffect(type)).toBe(true);
    }
  });

  it('is false for a domain event', () => {
    expect(isEventDocReservedEffect('SET_BODY')).toBe(false);
    expect(isEventDocReservedEffect('publish')).toBe(false);
  });
});
