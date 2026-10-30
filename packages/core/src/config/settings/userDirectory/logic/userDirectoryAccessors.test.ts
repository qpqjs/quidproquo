import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineUserDirectory } from '../defineUserDirectory';
import { getAllUserDirectoryConfigs } from './getAllUserDirectoryConfigs';
import { getOwnedUserDirectoryConfigs } from './getOwnedUserDirectoryConfigs';
import { getUserDirectoryByName } from './getUserDirectoryByName';
import { resolveUserDirectoryOrThrow } from './resolveUserDirectoryOrThrow';

const config = [
  defineApplication('app', 'production', 'root'),
  defineModule('svc'),
  defineUserDirectory('main'),
  defineUserDirectory('foreign', { owner: { module: 'other', userDirectoryName: 'foreign' } }),
];

describe('user directory accessors', () => {
  it('lists every directory, and only the owned ones', () => {
    expect(getAllUserDirectoryConfigs(config).map((directory) => directory.name)).toEqual(['main', 'foreign']);
    expect(getOwnedUserDirectoryConfigs(config).map((directory) => directory.name)).toEqual(['main']);
  });

  it('finds a directory by name, null when unknown', () => {
    expect(getUserDirectoryByName('main', config)?.name).toBe('main');
    expect(getUserDirectoryByName('missing', config)).toBeNull();
  });

  it('resolves a directory by name or throws naming it', () => {
    expect(resolveUserDirectoryOrThrow('foreign', config).name).toBe('foreign');
    expect(() => resolveUserDirectoryOrThrow('missing', config)).toThrow('UserDirectory not found: missing');
  });
});
