import { InlineFunctionQPQConfigSetting, QPQCoreConfigSettingType, StorageDriveQPQConfigSetting } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineEmailReceiver, EmailReceiverQPQWebServerConfigSetting } from './emailReceiver';

const onEmail = '/entry/email/onEmail::onEmail';

describe('defineEmailReceiver', () => {
  const [receiver, inlineFunction, drive] = defineEmailReceiver('support', { onEmail }) as [
    EmailReceiverQPQWebServerConfigSetting,
    InlineFunctionQPQConfigSetting,
    StorageDriveQPQConfigSetting,
  ];

  it('declares the receiver with its derived drive and function names', () => {
    expect(receiver).toEqual({
      configSettingType: QPQWebServerConfigSettingType.EmailReceiver,
      uniqueKey: 'emailReceiver-support',
      name: 'support',
      storageDriveName: 'email-support',
      onEmailFunctionName: 'qpq-email-receiver-support',
    });
  });

  it('registers onEmail as the inline function the create handler calls', () => {
    expect(inlineFunction.configSettingType).toBe(QPQCoreConfigSettingType.inlineFunction);
    expect(inlineFunction.functionName).toBe('qpq-email-receiver-support');
    expect(inlineFunction.runtime).toBe(onEmail);
  });

  it('owns an unscoped, expiring drive whose create handler carries the function name', () => {
    expect(drive.storageDrive).toBe('email-support');
    expect(drive.scoped).toBe(false);
    expect(drive.lifecycleRules).toEqual([{ deleteAfterDays: 1 }]);
    expect(drive.onEvent?.create).toMatchObject({
      relativePath: 'emailReceiving/entry/storageDrive/onCreate',
      functionName: 'onCreate',
      globals: { 'qpq-email-receiver-on-email': 'qpq-email-receiver-support' },
    });
  });
});
