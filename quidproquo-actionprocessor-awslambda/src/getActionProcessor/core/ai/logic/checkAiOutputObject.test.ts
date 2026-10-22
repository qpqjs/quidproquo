import { describe, expect, it } from 'vitest';

import { checkAiOutputObject } from './checkAiOutputObject';

const schema = {
  type: 'object',
  properties: {
    application_type: { type: 'string', enum: ['single', 'joint'] },
    quote: { type: 'object', properties: { term_in_months: { type: 'integer' } }, additionalProperties: false },
  },
  additionalProperties: false,
};

describe('checkAiOutputObject', () => {
  it('accepts a value that fits', () => {
    expect(checkAiOutputObject(schema, { application_type: 'joint', quote: { term_in_months: 60 } })).toEqual({ valid: true });
  });

  it('names a value outside an enum', () => {
    expect(checkAiOutputObject(schema, { application_type: 'Joint (2 applicants)' })).toEqual({
      valid: false,
      problems: '/application_type must be equal to one of the allowed values',
    });
  });

  it('names an extra key inside a nested object', () => {
    expect(checkAiOutputObject(schema, { quote: { term_in_months: 60, payment_term: 0 } })).toEqual({
      valid: false,
      problems: '/quote must NOT have additional properties (payment_term)',
    });
  });

  it('lists every mismatch up to five', () => {
    const many = { type: 'object', properties: Object.fromEntries('abcdefg'.split('').map((k) => [k, { type: 'integer' }])) };
    const check = checkAiOutputObject(many, Object.fromEntries('abcdefg'.split('').map((k) => [k, 'x'])));

    expect(check.valid).toBe(false);
    expect(check.valid === false && check.problems.split('; ')).toHaveLength(5);
  });
});
