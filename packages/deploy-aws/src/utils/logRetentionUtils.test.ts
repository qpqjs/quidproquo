import { aws_logs } from 'aws-cdk-lib';
import { describe, expect, it } from 'vitest';

import { resolveLogRetention } from './logRetentionUtils';

describe('resolveLogRetention', () => {
  it('defaults to one month when no days are given', () => {
    expect(resolveLogRetention(undefined)).toBe(aws_logs.RetentionDays.ONE_MONTH);
  });

  it('returns exact matches', () => {
    expect(resolveLogRetention(365)).toBe(aws_logs.RetentionDays.ONE_YEAR);
  });

  it('rounds up to the next supported retention', () => {
    expect(resolveLogRetention(370)).toBe(aws_logs.RetentionDays.THIRTEEN_MONTHS);
  });

  it('caps at ten years', () => {
    expect(resolveLogRetention(99999)).toBe(aws_logs.RetentionDays.TEN_YEARS);
  });
});
