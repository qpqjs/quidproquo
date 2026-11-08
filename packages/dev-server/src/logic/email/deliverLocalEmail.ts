import * as fs from 'fs/promises';
import * as path from 'path';

import { LocalEmailInbox } from './LocalEmailInbox';

const CRLF = '\r\n';

// A recipient may be written `Support <help@inbox.app.example>`, as the provider accepts: the bare
// address is what is matched against receivers and what the provider stamps into Delivered-To. CR/LF
// is removed as the raw message builder does for every header, so a recipient can never add a header.
const toBareAddress = (recipient: string): string => {
  const sanitised = recipient.replace(/[\r\n]+/g, '').trim();
  const bracketed = /<([^<>]*)>\s*$/.exec(sanitised);

  return (bracketed ? bracketed[1]! : sanitised).trim().toLowerCase();
};

const hostOf = (address: string): string => address.slice(address.lastIndexOf('@') + 1);

/**
 * The local stand-in for the mail provider's receipt rule: one copy of the raw message per
 * receiver drive whose host the message was addressed to, written with one `Delivered-To`
 * header per distinct recipient at that host, so the drive's create handler parses and
 * dispatches it exactly as deployed. Deployed, the receipt rule stores one object per message
 * and onEmail runs once however many addresses at the host it names; a copy per recipient here
 * would run it once per address. Returns the files written; a recipient nobody receives for is
 * simply not delivered.
 */
export const deliverLocalEmail = async (
  storagePath: string,
  inboxes: LocalEmailInbox[],
  recipients: string[],
  messageId: string,
  rawMessage: string,
): Promise<string[]> => {
  const written: string[] = [];

  for (const inbox of inboxes) {
    const delivered = [...new Set(recipients.map(toBareAddress).filter((address) => inbox.hosts.includes(hostOf(address))))];
    if (delivered.length === 0) {
      continue;
    }

    const directory = path.join(storagePath, inbox.serviceName, inbox.storageDriveName);
    const filePath = path.join(directory, `${messageId}.eml`);
    const deliveredToHeaders = delivered.map((recipient) => `Delivered-To: ${recipient}${CRLF}`).join('');

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, `${deliveredToHeaders}${rawMessage}`);

    written.push(filePath);
  }

  return written;
};
