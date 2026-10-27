import { describe, expect, it } from 'vitest';

import { _deprecated_serviceEntryMap } from './serviceImporter';

describe('_deprecated_serviceEntryMap', () => {
  it('is an empty map', () => {
    expect(_deprecated_serviceEntryMap).toEqual({});
  });
});
