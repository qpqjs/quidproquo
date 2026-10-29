import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineSecret } from '../defineSecret';
import { getAllSecretConfigs } from './getAllSecretConfigs';
import { getOwnedSecretConfigs } from './getOwnedSecretConfigs';
import { getSecretByName } from './getSecretByName';
import { resolveSecretOrThrow } from './resolveSecretOrThrow';

const config = [
  defineApplication('app', 'root'),
  defineModule('svc'),
  defineSecret('mine'),
  defineSecret('theirs', { owner: { module: 'other', secretName: 'theirs' } }),
];

describe('secret accessors', () => {
  it('lists every secret, and only the owned ones', () => {
    expect(getAllSecretConfigs(config).map((secret) => secret.key)).toEqual(['mine', 'theirs']);
    expect(getOwnedSecretConfigs(config).map((secret) => secret.key)).toEqual(['mine']);
  });

  it('finds a secret by name, null when unknown', () => {
    expect(getSecretByName('mine', config)?.key).toBe('mine');
    expect(getSecretByName('missing', config)).toBeNull();
  });

  it('resolves a secret by name or throws naming it', () => {
    expect(resolveSecretOrThrow('theirs', config).key).toBe('theirs');
    expect(() => resolveSecretOrThrow('missing', config)).toThrow('Can not find secret [missing]');
  });
});
