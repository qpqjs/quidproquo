import * as fs from 'fs/promises';
import * as path from 'path';

import { LocalEmailInbox } from './LocalEmailInbox';

const CRLF = '\r\n';

const hostOf = (address: string): string => address.slice(address.lastIndexOf('@') + 1).toLowerCase();

/**
 * The local stand-in for the mail provider's receipt rule: one copy of the raw message per
 * recipient at a receiving host, written into the receiver's drive with the provider's
 * `Delivered-To` header, so the drive's create handler parses and dispatches it exactly as
 * deployed. Returns the files written; a recipient nobody receives for is simply not delivered.
 */
export const deliverLocalEmail = async (
  storagePath: string,
  inboxes: LocalEmailInbox[],
  recipients: string[],
  messageId: string,
  rawMessage: string,
): Promise<string[]> => {
  const written: string[] = [];

  for (const recipient of recipients) {
    const host = hostOf(recipient);

    for (const inbox of inboxes.filter((candidate) => candidate.hosts.includes(host))) {
      const directory = path.join(storagePath, inbox.serviceName, inbox.storageDriveName);
      const filePath = path.join(directory, `${messageId}-${written.length}.eml`);

      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(filePath, `Delivered-To: ${recipient.toLowerCase()}${CRLF}${rawMessage}`);

      written.push(filePath);
    }
  }

  return written;
};
