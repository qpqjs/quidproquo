import * as fs from 'fs/promises';
import * as path from 'path';

const OUTBOX_DIRECTORY = 'emailOutbox';

/**
 * Nothing leaves the machine: every send is kept as the raw message the provider would have
 * been handed, under `<runtimePath>/emailOutbox/<service>/<messageId>.eml`, for reading back.
 */
export const writeLocalEmailOutbox = async (runtimePath: string, serviceName: string, messageId: string, rawMessage: string): Promise<string> => {
  const directory = path.join(runtimePath, OUTBOX_DIRECTORY, serviceName);
  const filePath = path.join(directory, `${messageId}.eml`);

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(filePath, rawMessage);

  return filePath;
};
