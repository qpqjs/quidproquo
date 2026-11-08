import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readJsonFileStore } from '../jsonFileStore';
import { getOrSeedDevJwtSecret } from './devJwtSecret';

const directoryA = { serviceName: 'svc', directoryName: 'users' };
const directoryB = { serviceName: 'svc', directoryName: 'admins' };

describe('getOrSeedDevJwtSecret', () => {
  let runtimePath: string;

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-jwt-secret-'));
  });

  afterEach(() => {
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  // Security regression: concurrent first uses must agree on one secret, or a token signed with the losing
  // secret stops verifying the moment the other write lands.
  it('hands every concurrent first use of a directory the same secret', async () => {
    const secrets = await Promise.all(Array.from({ length: 5 }, () => getOrSeedDevJwtSecret(runtimePath, directoryA)));

    expect(new Set(secrets).size).toBe(1);
    expect(await getOrSeedDevJwtSecret(runtimePath, directoryA)).toBe(secrets[0]);
  });

  it('keeps both secrets when two directories of one service seed at once', async () => {
    const [a, b] = await Promise.all([getOrSeedDevJwtSecret(runtimePath, directoryA), getOrSeedDevJwtSecret(runtimePath, directoryB)]);

    expect(await readJsonFileStore(runtimePath, 'jwtSecrets', 'svc')).toEqual({ users: a, admins: b });
  });
});
