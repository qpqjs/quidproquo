import { randomBytes } from 'crypto';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';
import { DevUserDirectory } from './devAuth';

// Offline stand-in for a user pool's signing key: one random HMAC secret per user directory,
// seeded on first use and kept in the runtime store so tokens survive dev-server restarts.
//
//   <runtimePath>/jwtSecrets/<serviceName>.json   { "<directoryName>": "<base64 32 bytes>" }
//
// Random per checkout, so a dev token never verifies anywhere else.
const JWT_SECRETS_STORE_DIRECTORY = 'jwtSecrets';

export const getOrSeedDevJwtSecret = async (runtimePath: string, userDirectory: DevUserDirectory): Promise<string> => {
  const secrets = await readJsonFileStore<string>(runtimePath, JWT_SECRETS_STORE_DIRECTORY, userDirectory.serviceName);

  const existing = secrets[userDirectory.directoryName];
  if (existing !== undefined) {
    return existing;
  }

  const secret = randomBytes(32).toString('base64');
  await writeJsonFileStore(runtimePath, JWT_SECRETS_STORE_DIRECTORY, userDirectory.serviceName, {
    ...secrets,
    [userDirectory.directoryName]: secret,
  });

  return secret;
};
