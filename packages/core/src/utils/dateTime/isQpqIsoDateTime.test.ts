import { describe, expect, it } from 'vitest';

import { isQpqIsoDateTime } from './isQpqIsoDateTime';

describe('isQpqIsoDateTime', () => {
  it('accepts a real instant in the exact toISOString form', () => {
    expect(isQpqIsoDateTime('2026-11-09T05:12:40.118Z')).toBe(true);
  });

  it('rejects other shapes, impossible instants and anything that is not a string', () => {
    ['2026-11-09', '2026-11-09T05:12:40Z', '2026-02-30T00:00:00.000Z', 'yesterday', '', undefined, null, 1762665160118].forEach((value) =>
      expect(isQpqIsoDateTime(value)).toBe(false),
    );
  });
});
