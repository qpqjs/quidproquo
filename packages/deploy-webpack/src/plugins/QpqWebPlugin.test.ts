import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QpqWebPlugin } from './QpqWebPlugin';

describe('QpqWebPlugin', () => {
  it('constructs a webpack plugin instance exposing apply', () => {
    const plugin = new QpqWebPlugin({ qpqConfig: buildTestQpqConfig() });

    expect(plugin).toBeInstanceOf(QpqWebPlugin);
    expect(typeof plugin.apply).toBe('function');
  });
});
