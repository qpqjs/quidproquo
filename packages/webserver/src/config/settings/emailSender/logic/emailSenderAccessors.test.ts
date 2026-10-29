import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineEmailSender } from '../defineEmailSender';
import { getEmailSenderConfig } from './getEmailSenderConfig';
import { resolveEmailSenderConfigOrThrow } from './resolveEmailSenderConfigOrThrow';

describe('email sender accessors', () => {
  it('answers null without a sender and throws on resolve', () => {
    expect(getEmailSenderConfig(buildTestQpqConfig())).toBeNull();
    expect(() => resolveEmailSenderConfigOrThrow(buildTestQpqConfig())).toThrow('sends no mail');
  });

  it('returns the one sender and refuses two', () => {
    expect(resolveEmailSenderConfigOrThrow(buildTestQpqConfig([defineEmailSender()])).uniqueKey).toBe('emailSender');
    expect(() => getEmailSenderConfig(buildTestQpqConfig([defineEmailSender(), defineEmailSender()]))).toThrow('once per service');
  });
});
