import { randomBytes } from 'crypto';

import { getOrSeedJsonFileStoreValue } from '../jsonFileStore';
import { DevUserDirectory } from './devAuth';

// Offline stand-in for a user pool's signing key: one random HMAC secret per user directory,
// seeded on first use and kept in the runtime store so tokens survive dev-server restarts.
//
//   <runtimePath>/jwtSecrets/<serviceName>.json   { "<directoryName>": "<base64 32 bytes>" }
//
// Random per checkout, so a dev token never verifies anywhere else.
const JWT_SECRETS_STORE_DIRECTORY = 'jwtSecrets';

export const getOrSeedDevJwtSecret = (runtimePath: string, userDirectory: DevUserDirectory): Promise<string> =>
  getOrSeedJsonFileStoreValue(runtimePath, JWT_SECRETS_STORE_DIRECTORY, userDirectory.serviceName, userDirectory.directoryName, () =>
    randomBytes(32).toString('base64'),
  );
