import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineNotifyError } from './notifyError';

describe('defineNotifyError', () => {
  it('builds a NotifyError setting with the given name and an undefined publish list by default', () => {
    expect(defineNotifyError('Alerts')).toEqual({
      configSettingType: QPQCoreConfigSettingType.notifyError,
      uniqueKey: 'Alerts',
      name: 'Alerts',
      onAlarm: {
        publishToEventBus: undefined,
      },
    });
  });

  it('passes the publishToEventBus list through', () => {
    expect(defineNotifyError('Alerts', { onAlarm: { publishToEventBus: ['bus'] } }).onAlarm.publishToEventBus).toEqual(['bus']);
  });
});
