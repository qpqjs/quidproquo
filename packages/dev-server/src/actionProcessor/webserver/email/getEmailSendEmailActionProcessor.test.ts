import { resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';
import { askEmailSendEmail, EmailActionType } from '@qpqjs/webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getEmailSendEmailActionProcessor } from './getEmailSendEmailActionProcessor';

const { email } = vi.hoisted(() => ({
  email: {
    writeLocalEmailOutbox: vi.fn(async () => '/runtime/emailOutbox/crm/id.eml'),
    resolveLocalEmailInboxes: vi.fn(async () => [{ serviceName: 'crm', storageDriveName: 'email-support', hosts: ['inbox.app.example'] }]),
    deliverLocalEmail: vi.fn(async () => ['/storage/crm/email-support/id-0.eml']),
  },
}));

vi.mock('../../../logic/email/writeLocalEmailOutbox', () => ({ writeLocalEmailOutbox: email.writeLocalEmailOutbox }));
vi.mock('../../../logic/email/resolveLocalEmailInboxes', () => ({ resolveLocalEmailInboxes: email.resolveLocalEmailInboxes }));
vi.mock('../../../logic/email/deliverLocalEmail', () => ({ deliverLocalEmail: email.deliverLocalEmail }));

const getProcessor = async () => {
  const processors = await getEmailSendEmailActionProcessor(buildTestDevServerConfig())(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[EmailActionType.SendEmail];
};

describe('getEmailSendEmailActionProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('keeps the raw message in the outbox, delivers it to the local receivers (bcc included) and answers a unique id', async () => {
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      from: 'noreply@app.example',
      to: ['help@inbox.app.example'],
      bcc: ['audit@inbox.app.example'],
      subject: 'hi',
      bodyText: 'body',
    });

    const messageId = resolveActionResult(result);
    expect(messageId).toMatch(/^dev-server-email-/);

    const [runtimePath, serviceName, outboxId, raw] = email.writeLocalEmailOutbox.mock.calls[0]!;
    expect([runtimePath, serviceName, outboxId]).toEqual(['/tmp/runtime', 'test-module', messageId]);
    expect(raw).toContain('To: help@inbox.app.example');
    expect(raw).not.toContain('audit@inbox.app.example');

    const [storagePath, , recipients, deliveredId] = email.deliverLocalEmail.mock.calls[0]!;
    expect([storagePath, recipients, deliveredId]).toEqual(['/tmp/qpq-storage', ['help@inbox.app.example', 'audit@inbox.app.example'], messageId]);
  });

  it('answers BadRequest for a message with no recipient, as the provider would', async () => {
    const process = await getProcessor();

    const [, error] = await invokeProcessor(process, { from: 'noreply@app.example', to: [], subject: 'hi', bodyText: 'body' });

    expect(error?.errorType).toBe(askEmailSendEmail.errorType.BadRequest);
    expect(email.writeLocalEmailOutbox).not.toHaveBeenCalled();
  });
});
