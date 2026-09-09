import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineAccountGithubOidcProvider } from './defineAccountGithubOidcProvider';

describe('defineAccountGithubOidcProvider', () => {
  it('builds the single account provider setting', () => {
    expect(defineAccountGithubOidcProvider()).toEqual({
      configSettingType: QPQAwsConfigSettingType.accountGithubOidcProvider,
      uniqueKey: 'accountGithubOidcProvider',
    });
  });
});
