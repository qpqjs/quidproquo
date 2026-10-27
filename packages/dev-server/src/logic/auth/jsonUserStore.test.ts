import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDevUserId, DEV_USER_EMAIL, DevUserDirectory } from './devAuth';
import { findDevUsersByAttribute, getDevUserByUserId, listDevUsers, upsertDevUser } from './jsonUserStore';

const DIRECTORY: DevUserDirectory = { serviceName: 'test-service', directoryName: 'test-directory' };
const SIBLING_DIRECTORY: DevUserDirectory = { serviceName: 'test-service', directoryName: 'other-directory' };
const OTHER_SERVICE_DIRECTORY: DevUserDirectory = { serviceName: 'other-service', directoryName: 'test-directory' };

describe('jsonUserStore', () => {
  let runtimePath: string;

  beforeEach(async () => {
    runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-user-store-'));
  });

  afterEach(async () => {
    await fs.rm(runtimePath, { recursive: true, force: true });
  });

  describe('upsertDevUser', () => {
    it('creates an entry keyed by the deterministic userId under the service and directory', async () => {
      const user = await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');

      expect(user).toEqual({
        userId: createDevUserId(DIRECTORY, 'joe@example.com'),
        email: 'joe@example.com',
        emailVerified: true,
      });

      const fileContent = JSON.parse(await fs.readFile(path.join(runtimePath, 'users', 'test-service', 'test-directory.json'), 'utf8'));
      expect(fileContent).toEqual({ [user.userId!]: user });
    });

    it('maps casing variants of an email to the same user', async () => {
      await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');
      await upsertDevUser(runtimePath, DIRECTORY, 'Joe@Example.com');

      expect(await listDevUsers(runtimePath, DIRECTORY)).toHaveLength(1);
    });

    it('merges new attributes and keeps existing ones', async () => {
      await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com', { givenName: 'Joe' });
      const user = await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com', { familyName: 'Coady' });

      expect(user.givenName).toBe('Joe');
      expect(user.familyName).toBe('Coady');
    });

    it('falls back to the dev user for a missing email', async () => {
      const user = await upsertDevUser(runtimePath, DIRECTORY);

      expect(user.email).toBe(DEV_USER_EMAIL);
    });

    it('keeps the same email separate across directories, with distinct userIds', async () => {
      const userA = await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');
      const userB = await upsertDevUser(runtimePath, SIBLING_DIRECTORY, 'joe@example.com');

      expect(userA.userId).not.toBe(userB.userId);
      expect(await listDevUsers(runtimePath, DIRECTORY)).toHaveLength(1);
      expect(await listDevUsers(runtimePath, SIBLING_DIRECTORY)).toHaveLength(1);
    });
  });

  describe('getDevUserByUserId', () => {
    it('resolves a userId back to its user', async () => {
      const created = await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');

      expect(await getDevUserByUserId(runtimePath, DIRECTORY, created.userId!)).toEqual(created);
    });

    it('returns null for an unknown userId', async () => {
      expect(await getDevUserByUserId(runtimePath, DIRECTORY, 'unknown-user-id')).toBeNull();
    });

    it('scopes users to same-named directories on different services', async () => {
      const created = await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');

      expect(await getDevUserByUserId(runtimePath, OTHER_SERVICE_DIRECTORY, created.userId!)).toBeNull();
    });
  });

  describe('listDevUsers', () => {
    it('lists every user in the directory', async () => {
      await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');
      await upsertDevUser(runtimePath, DIRECTORY, 'jane@example.com');

      const users = await listDevUsers(runtimePath, DIRECTORY);

      expect(users.map((u) => u.email).sort()).toEqual(['jane@example.com', 'joe@example.com']);
    });

    it('returns an empty list for a directory with no users', async () => {
      expect(await listDevUsers(runtimePath, DIRECTORY)).toEqual([]);
    });
  });

  describe('findDevUsersByAttribute', () => {
    it('matches emails case-insensitively', async () => {
      await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');

      const users = await findDevUsersByAttribute(runtimePath, DIRECTORY, 'email', 'Joe@Example.com');

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('joe@example.com');
    });

    it('matches other attributes exactly', async () => {
      const created = await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');

      expect(await findDevUsersByAttribute(runtimePath, DIRECTORY, 'userId', created.userId!)).toHaveLength(1);
      expect(await findDevUsersByAttribute(runtimePath, DIRECTORY, 'userId', created.userId!.toUpperCase())).toHaveLength(0);
    });

    it('returns an empty list when nothing matches', async () => {
      await upsertDevUser(runtimePath, DIRECTORY, 'joe@example.com');

      expect(await findDevUsersByAttribute(runtimePath, DIRECTORY, 'email', 'jane@example.com')).toEqual([]);
    });
  });
});
