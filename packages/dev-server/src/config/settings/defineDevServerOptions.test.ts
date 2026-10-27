import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineDevServerOptions, getDevServerOptions, QPQDevServerConfigSettingType } from './defineDevServerOptions';

describe('defineDevServerOptions', () => {
  it('builds a DevServerOptions setting with the given ports', () => {
    expect(defineDevServerOptions({ views: { port: 3069 }, webEntries: { docs: { port: 3090 } } })).toEqual({
      configSettingType: QPQDevServerConfigSettingType.devServerOptions,
      uniqueKey: 'DevServerOptions',
      views: { port: 3069 },
      webEntries: { docs: { port: 3090 } },
    });
  });
});

describe('getDevServerOptions', () => {
  it('returns the defined options', () => {
    const qpqConfig = buildTestQpqConfig([defineDevServerOptions({ views: { port: 3069 } })]);

    expect(getDevServerOptions(qpqConfig).views?.port).toBe(3069);
  });

  it('returns empty options when none are defined', () => {
    expect(getDevServerOptions(buildTestQpqConfig())).toEqual({});
  });

  it('throws when more than one is defined', () => {
    const qpqConfig = buildTestQpqConfig([defineDevServerOptions({ views: { port: 3069 } }), defineDevServerOptions({ views: { port: 3070 } })]);

    expect(() => getDevServerOptions(qpqConfig)).toThrow();
  });
});
