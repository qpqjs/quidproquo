import { describe, expect, it } from 'vitest';

import { combineQpqApis } from './QpqMappedApi';

describe('combineQpqApis', () => {
  it('merges two apis into one object', () => {
    function* askA() {}
    function* askB() {}

    expect(combineQpqApis({ askA }, { askB })).toEqual({ askA, askB });
  });

  it('lets the second api override colliding keys', () => {
    function* askA() {}
    function* askAOverride() {}

    expect(combineQpqApis({ askA }, { askA: askAOverride }).askA).toBe(askAOverride);
  });
});
