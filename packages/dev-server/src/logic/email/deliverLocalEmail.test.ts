import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { deliverLocalEmail } from './deliverLocalEmail';
import { LocalEmailInbox } from './LocalEmailInbox';

const RAW = 'From: a@x.example\r\nSubject: hi\r\n\r\nbody';

describe('deliverLocalEmail', () => {
  let storagePath: string;
  const inboxes: LocalEmailInbox[] = [
    { serviceName: 'crm', storageDriveName: 'email-support', hosts: ['inbox.app.example'] },
    { serviceName: 'crm', storageDriveName: 'email-audit', hosts: ['inbox.app.example'] },
    { serviceName: 'billing', storageDriveName: 'email-invoices', hosts: ['invoices.app.example'] },
  ];

  beforeEach(async () => {
    storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-email-'));
  });

  afterEach(async () => {
    await fs.rm(storagePath, { recursive: true, force: true });
  });

  it('writes one copy per recipient into every receiver drive at that host, with the delivered-to header', async () => {
    const written = await deliverLocalEmail(storagePath, inboxes, ['Help@Inbox.App.Example', 'ap@invoices.app.example'], 'msg-1', RAW);

    expect(written.map((file) => path.relative(storagePath, file))).toEqual([
      path.join('crm', 'email-support', 'msg-1-0.eml'),
      path.join('crm', 'email-audit', 'msg-1-1.eml'),
      path.join('billing', 'email-invoices', 'msg-1-2.eml'),
    ]);
    expect(await fs.readFile(written[0]!, 'utf8')).toBe(`Delivered-To: help@inbox.app.example\r\n${RAW}`);
  });

  it('delivers nothing for a recipient at a host no receiver listens on', async () => {
    expect(await deliverLocalEmail(storagePath, inboxes, ['someone@gmail.example'], 'msg-2', RAW)).toEqual([]);
  });
});
