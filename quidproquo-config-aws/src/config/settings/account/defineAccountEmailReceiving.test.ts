import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineAccountEmailReceiving } from './defineAccountEmailReceiving';

describe('defineAccountEmailReceiving', () => {
  it('builds the single account receipt rule set setting', () => {
    expect(defineAccountEmailReceiving()).toEqual({
      configSettingType: QPQAwsConfigSettingType.accountEmailReceiving,
      uniqueKey: 'accountEmailReceiving',
    });
  });
});
