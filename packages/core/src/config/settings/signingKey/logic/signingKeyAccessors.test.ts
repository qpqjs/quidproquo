import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineSigningKey } from '../defineSigningKey';
import { getAllSigningKeyConfigs } from './getAllSigningKeyConfigs';
import { getOwnedSigningKeyConfigs } from './getOwnedSigningKeyConfigs';
import { getSigningKeyByName } from './getSigningKeyByName';
import { resolveSigningKeyOrThrow } from './resolveSigningKeyOrThrow';

const config = [
  defineApplication('app', 'root'),
  defineModule('svc'),
  defineSigningKey('mine'),
  defineSigningKey('theirs', { owner: { module: 'other', signingKeyName: 'theirs' } }),
];

describe('signingKey accessors', () => {
  it('lists every key, and only the owned ones', () => {
    expect(getAllSigningKeyConfigs(config).map((key) => key.keyName)).toEqual(['mine', 'theirs']);
    expect(getOwnedSigningKeyConfigs(config).map((key) => key.keyName)).toEqual(['mine']);
  });

  it('finds a key by name, null when unknown', () => {
    expect(getSigningKeyByName('mine', config)?.keyName).toBe('mine');
    expect(getSigningKeyByName('missing', config)).toBeNull();
  });

  it('resolves a key by name or throws naming it', () => {
    expect(resolveSigningKeyOrThrow('theirs', config).keyName).toBe('theirs');
    expect(() => resolveSigningKeyOrThrow('missing', config)).toThrow('Can not find signing key [missing]');
  });
});
