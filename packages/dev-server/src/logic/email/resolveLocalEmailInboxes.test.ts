import { buildTestQpqConfig } from '@qpqjs/testing';
import { defineDns, defineEmailReceiver, defineEmailReceivingDomain } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../__fixtures__/buildTestDevServerConfig';
import { resolveLocalEmailInboxes } from './resolveLocalEmailInboxes';

const onEmail = '/entry/email/onEmail::onEmail';

describe('resolveLocalEmailInboxes', () => {
  it('lists each receiver with the hosts the receiving domain resolves to on every root', async () => {
    const devServerConfig = buildTestDevServerConfig({
      qpqConfigs: [
        buildTestQpqConfig([
          defineDns(['app.example', 'app.test']),
          defineEmailReceivingDomain('inbox'),
          defineEmailReceiver('support', { onEmail }),
          defineEmailReceiver('audit', { onEmail }),
        ]),
        // Receivers but no receiving domain: nothing to receive for, as the deploy would refuse.
        buildTestQpqConfig([defineDns('app.example'), defineEmailReceiver('invoices', { onEmail })]),
        buildTestQpqConfig([]),
      ],
    });

    const inboxes = await resolveLocalEmailInboxes(devServerConfig);

    expect(inboxes.map((inbox) => [inbox.serviceName, inbox.storageDriveName])).toEqual([
      ['test-module', 'email-support'],
      ['test-module', 'email-audit'],
    ]);
    expect(inboxes[0]!.hosts).toHaveLength(2);
    expect(inboxes[0]!.hosts.every((host) => host.startsWith('inbox.') && host === host.toLowerCase())).toBe(true);
    expect(inboxes[1]!.hosts).toEqual(inboxes[0]!.hosts);
  });
});
