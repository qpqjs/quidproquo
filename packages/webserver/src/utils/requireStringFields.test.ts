import { describe, expect, it } from 'vitest';

import { requireStringFields } from './requireStringFields';

describe('requireStringFields', () => {
  it('returns the data when every field is a non-empty string', () => {
    expect(requireStringFields('a', 'b')({ a: 'x', b: 'y', c: 1 })).toEqual({ a: 'x', b: 'y', c: 1 });
  });

  it('throws naming each missing, empty or non-string field', () => {
    expect(() => requireStringFields('a', 'b', 'c')({ a: '', b: 2 })).toThrow('Missing or invalid fields: a, b, c');
  });

  it('treats a null body as having no fields', () => {
    expect(() => requireStringFields('a')(null)).toThrow('Missing or invalid fields: a');
  });
});
