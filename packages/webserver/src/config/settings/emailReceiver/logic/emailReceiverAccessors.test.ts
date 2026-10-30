import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineEmailReceiver, emailReceiverStorageDriveName } from '../defineEmailReceiver';
import { getAllEmailReceiverConfigs } from './getAllEmailReceiverConfigs';
import { getEmailReceiverByName } from './getEmailReceiverByName';
import { getEmailReceiversForStorageDrive } from './getEmailReceiversForStorageDrive';
import { getOwnedEmailReceiverConfigs } from './getOwnedEmailReceiverConfigs';
import { resolveEmailReceiverOrThrow } from './resolveEmailReceiverOrThrow';

const config = buildTestQpqConfig([
  defineEmailReceiver('inbox', { onEmail: '/entry/email::onEmail' }),
  defineEmailReceiver('support', { onEmail: '/entry/email::onSupport' }),
]);

describe('email receiver accessors', () => {
  it('lists every receiver; receivers carry no owner so all are owned', () => {
    expect(getAllEmailReceiverConfigs(config).map((receiver) => receiver.name)).toEqual(['inbox', 'support']);
    expect(getOwnedEmailReceiverConfigs(config).map((receiver) => receiver.name)).toEqual(['inbox', 'support']);
  });

  it('finds a receiver by name, null when unknown', () => {
    expect(getEmailReceiverByName('inbox', config)?.storageDriveName).toBe(emailReceiverStorageDriveName('inbox'));
    expect(getEmailReceiverByName('missing', config)).toBeNull();
  });

  it('resolves a receiver by name or throws naming it', () => {
    expect(resolveEmailReceiverOrThrow('support', config).name).toBe('support');
    expect(() => resolveEmailReceiverOrThrow('missing', config)).toThrow('No email receiver setting found for [missing]');
  });

  it('lists the receivers writing into a drive', () => {
    expect(getEmailReceiversForStorageDrive(emailReceiverStorageDriveName('support'), config).map((receiver) => receiver.name)).toEqual(['support']);
  });
});
