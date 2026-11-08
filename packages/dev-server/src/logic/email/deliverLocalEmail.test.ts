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

  // The receipt rule stores one object per message, so onEmail runs once per receiving drive no matter how many
  // addresses at the host the message names, and a repeated address is still one delivery.
  it('writes one copy per receiver drive, naming every distinct recipient at that host in Delivered-To headers', async () => {
    const written = await deliverLocalEmail(
      storagePath,
      inboxes,
      ['Help@Inbox.App.Example', 'sales@inbox.app.example', 'help@inbox.app.example', 'ap@invoices.app.example'],
      'msg-1',
      RAW,
    );

    expect(written.map((file) => path.relative(storagePath, file))).toEqual([
      path.join('crm', 'email-support', 'msg-1.eml'),
      path.join('crm', 'email-audit', 'msg-1.eml'),
      path.join('billing', 'email-invoices', 'msg-1.eml'),
    ]);
    expect(await fs.readFile(written[0]!, 'utf8')).toBe(`Delivered-To: help@inbox.app.example\r\nDelivered-To: sales@inbox.app.example\r\n${RAW}`);
    expect(await fs.readFile(written[2]!, 'utf8')).toBe(`Delivered-To: ap@invoices.app.example\r\n${RAW}`);
  });

  // The provider accepts a display-name recipient and stamps the bare address; a header-style recipient must
  // match its host and never put the display name (or anything else) into Delivered-To.
  it('matches and stamps the bare address of a display-name recipient', async () => {
    const written = await deliverLocalEmail(storagePath, inboxes, ['Accounts Payable <AP@Invoices.App.Example>'], 'msg-3', RAW);

    expect(written.map((file) => path.relative(storagePath, file))).toEqual([path.join('billing', 'email-invoices', 'msg-3.eml')]);
    expect(await fs.readFile(written[0]!, 'utf8')).toBe(`Delivered-To: ap@invoices.app.example\r\n${RAW}`);
  });

  // Security regression: a recipient string is caller input written into a header, so a line break in it must
  // not become an extra header for onEmail to parse.
  it('never lets a line break in a recipient add a header', async () => {
    const written = await deliverLocalEmail(
      storagePath,
      inboxes,
      ['ap@invoices.app.example\r\nX-Injected: yes', 'ap@invoices.app.example'],
      'msg-4',
      RAW,
    );

    expect(written).toHaveLength(1);
    const content = await fs.readFile(written[0]!, 'utf8');
    expect(content).not.toContain('X-Injected');
    expect(content.startsWith('Delivered-To: ap@invoices.app.example\r\n')).toBe(true);
  });

  it('delivers nothing for a recipient at a host no receiver listens on', async () => {
    expect(await deliverLocalEmail(storagePath, inboxes, ['someone@gmail.example'], 'msg-2', RAW)).toEqual([]);
  });
});
