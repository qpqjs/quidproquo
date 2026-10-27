import { describe, expect, it } from 'vitest';

import { eventDocFunctionsName } from './eventDocFunctionsName';

describe('eventDocFunctionsName', () => {
  it('derives a name unique per storeName + type pair', () => {
    expect(eventDocFunctionsName('templates', 'template')).toBe('templates#template#eventDocFunctions');
    expect(eventDocFunctionsName('templates', 'template')).not.toBe(eventDocFunctionsName('templates', 'layout'));
    expect(eventDocFunctionsName('templates', 'template')).not.toBe(eventDocFunctionsName('contents', 'template'));
  });
});
