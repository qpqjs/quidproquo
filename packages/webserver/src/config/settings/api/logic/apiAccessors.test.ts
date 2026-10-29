import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineApi } from '../defineApi';
import { getAllApiConfigs } from './getAllApiConfigs';
import { getApiByName } from './getApiByName';
import { getOwnedApiConfigs } from './getOwnedApiConfigs';
import { resolveApiOrThrow } from './resolveApiOrThrow';

const config = buildTestQpqConfig([defineApi('api'), defineApi('admin', { subDomain: 'admin-api' })]);

describe('api accessors', () => {
  it('lists every api; apis carry no owner so all are owned', () => {
    expect(getAllApiConfigs(config).map((api) => api.apiName)).toEqual(['api', 'admin']);
    expect(getOwnedApiConfigs(config).map((api) => api.apiName)).toEqual(['api', 'admin']);
  });

  it('finds an api by name, null when unknown', () => {
    expect(getApiByName('admin', config)?.apiSubdomain).toBe('admin-api');
    expect(getApiByName('missing', config)).toBeNull();
  });

  it('resolves an api by name or throws naming it', () => {
    expect(resolveApiOrThrow('api', config).apiName).toBe('api');
    expect(() => resolveApiOrThrow('missing', config)).toThrow('No api setting found for [missing]');
  });
});
