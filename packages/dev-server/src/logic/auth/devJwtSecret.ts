import { randomBytes } from 'crypto';

import { updateJsonFileStore } from '../jsonFileStore';
import { DevUserDirectory } from './devAuth';

// Offline stand-in for a user pool's signing key: one random HMAC secret per user directory,
// seeded on first use and kept in the runtime store so tokens survive dev-server restarts.
//
//   <runtimePath>/jwtSecrets/<serviceName>.json   { "<directoryName>": "<base64 32 bytes>" }
//
// Random per checkout, so a dev token never verifies anywhere else.
const JWT_SECRETS_STORE_DIRECTORY = 'jwtSecrets';

export const getOrSeedDevJwtSecret = async (runtimePath: string, userDirectory: DevUserDirectory): Promise<string> => {
  // Seeded inside the store's serialised update: two first uses of a directory (or of two directories
  // sharing the service's file) at once must agree on one secret each, or a token signed with the
  // losing secret stops verifying as soon as the other write lands.
  const secrets = await updateJsonFileStore<string>(runtimePath, JWT_SECRETS_STORE_DIRECTORY, userDirectory.serviceName, (values) =>
    values[userDirectory.directoryName] !== undefined ? values : { ...values, [userDirectory.directoryName]: randomBytes(32).toString('base64') },
  );

  return secrets[userDirectory.directoryName]!;
};
