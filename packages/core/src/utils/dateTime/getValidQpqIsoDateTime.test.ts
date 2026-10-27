import { describe, expect, it } from 'vitest';

import { getValidQpqIsoDateTime } from './getValidQpqIsoDateTime';

describe('getValidQpqIsoDateTime', () => {
  it('accepts a real UTC ISO date time with milliseconds', () => {
    expect(getValidQpqIsoDateTime('2024-06-01T12:34:56.789Z')).toBe('2024-06-01T12:34:56.789Z');
    expect(getValidQpqIsoDateTime(new Date().toISOString())).toBeDefined();
  });

  it('returns undefined for undefined or empty input', () => {
    expect(getValidQpqIsoDateTime(undefined)).toBeUndefined();
    expect(getValidQpqIsoDateTime('')).toBeUndefined();
  });

  it('rejects strings that are not the exact shape', () => {
    expect(getValidQpqIsoDateTime('2024-06-01')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-06-01T12:34:56Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-06-01T12:34:56.789+00:00')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-06-01T12:34:56.789')).toBeUndefined();
    expect(getValidQpqIsoDateTime('not a date')).toBeUndefined();
  });

  it('rejects values with extra content around a valid date', () => {
    expect(getValidQpqIsoDateTime('x2024-06-01T12:34:56.789Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-06-01T12:34:56.789Zx')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-06-01T12:34:56.789Z\n2024-06-01T12:34:56.789Z')).toBeUndefined();
  });

  it('rejects shape-valid but impossible instants', () => {
    expect(getValidQpqIsoDateTime('2024-02-30T00:00:00.000Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-13-01T00:00:00.000Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-00-01T00:00:00.000Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-01-00T00:00:00.000Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-01-32T00:00:00.000Z')).toBeUndefined();
    expect(getValidQpqIsoDateTime('2024-01-01T25:00:00.000Z')).toBeUndefined();
  });

  it('accepts a leap day in a leap year only', () => {
    expect(getValidQpqIsoDateTime('2024-02-29T00:00:00.000Z')).toBe('2024-02-29T00:00:00.000Z');
    expect(getValidQpqIsoDateTime('2023-02-29T00:00:00.000Z')).toBeUndefined();
  });
});
