import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineDns } from '../defineDns';
import { getDnsConfig } from './getDnsConfig';
import { getPrimaryRootDomain } from './getPrimaryRootDomain';
import { getRootDomains } from './getRootDomains';
import { resolveDnsConfigOrThrow } from './resolveDnsConfigOrThrow';

describe('dns accessors', () => {
  it('answers null, no roots and no primary without a domain', () => {
    const config = buildTestQpqConfig();

    expect(getDnsConfig(config)).toBeNull();
    expect(getRootDomains(config)).toEqual([]);
    expect(getPrimaryRootDomain(config)).toBeNull();
    expect(() => resolveDnsConfigOrThrow(config)).toThrow('declares no domain');
  });

  it('returns the one setting, its roots primary first', () => {
    const config = buildTestQpqConfig([defineDns(['a.com', 'b.com'])]);

    expect(resolveDnsConfigOrThrow(config).rootDomains).toEqual(['a.com', 'b.com']);
    expect(getPrimaryRootDomain(config)).toBe('a.com');
  });

  it('refuses two dns settings in one service', () => {
    expect(() => getDnsConfig(buildTestQpqConfig([defineDns('a.com'), defineDns('b.com')]))).toThrow('once per service');
  });
});
