import { describe, expect, it } from 'vitest';

import { allLogLevelEnumValues, LogLevelEnum, logLevelEnumLookups } from './LogLevelEnum';

describe('allLogLevelEnumValues', () => {
  it('contains every numeric log level exactly once', () => {
    expect(allLogLevelEnumValues).toEqual([
      LogLevelEnum.Fatal,
      LogLevelEnum.Error,
      LogLevelEnum.Warn,
      LogLevelEnum.Info,
      LogLevelEnum.Debug,
      LogLevelEnum.Trace,
    ]);
  });

  it('does not include the reverse-mapping names of the numeric enum', () => {
    const nonNumericValues = allLogLevelEnumValues.filter((value) => typeof value !== 'number');

    expect(nonNumericValues).toEqual([]);
  });
});

describe('logLevelEnumLookups', () => {
  it('is All plus the named levels', () => {
    expect(logLevelEnumLookups).toEqual(['All', 'Fatal', 'Error', 'Warn', 'Info', 'Debug', 'Trace']);
  });
});
