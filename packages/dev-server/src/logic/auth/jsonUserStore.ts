import { UserAttributes } from 'quidproquo-core';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';
import { createDevUserId, DevUserDirectory, resolveDevUsername } from './devAuth';

// Offline stand-in for the user directory (Cognito). Every login or first access
// upserts an entry, so a userId can always be resolved back to its user - one
// hand-editable JSON file per resolved user directory, keyed by userId:
//
//   <runtimePath>/users/<serviceName>/<directoryName>.json
//     { "<userId>": { "userId": "...", "email": "...", ... } }

const USERS_STORE_DIRECTORY = 'users';

const readUsers = (runtimePath: string, userDirectory: DevUserDirectory): Promise<Record<string, UserAttributes>> =>
  readJsonFileStore<UserAttributes>(runtimePath, USERS_STORE_DIRECTORY, `${userDirectory.serviceName}/${userDirectory.directoryName}`);

// Creates or updates the entry for a login, keyed by its deterministic userId.
// Passed attributes override stored ones; anything else already stored is kept.
export const upsertDevUser = async (
  runtimePath: string,
  userDirectory: DevUserDirectory,
  email?: string | null,
  attributes: UserAttributes = {},
): Promise<UserAttributes> => {
  const resolvedEmail = resolveDevUsername(email).trim();
  const userId = createDevUserId(userDirectory, resolvedEmail);

  const users = await readUsers(runtimePath, userDirectory);
  const user: UserAttributes = {
    emailVerified: true,
    ...users[userId],
    ...attributes,
    userId,
    email: resolvedEmail,
  };

  await writeJsonFileStore(runtimePath, USERS_STORE_DIRECTORY, `${userDirectory.serviceName}/${userDirectory.directoryName}`, {
    ...users,
    [userId]: user,
  });

  return user;
};

export const getDevUserByUserId = async (runtimePath: string, userDirectory: DevUserDirectory, userId: string): Promise<UserAttributes | null> => {
  const users = await readUsers(runtimePath, userDirectory);

  return users[userId] || null;
};

export const listDevUsers = async (runtimePath: string, userDirectory: DevUserDirectory): Promise<UserAttributes[]> => {
  return Object.values(await readUsers(runtimePath, userDirectory));
};

export const findDevUsersByAttribute = async (
  runtimePath: string,
  userDirectory: DevUserDirectory,
  attributeName: keyof UserAttributes,
  attributeValue: string,
): Promise<UserAttributes[]> => {
  const users = await listDevUsers(runtimePath, userDirectory);

  // Emails identify users case-insensitively; every other attribute matches exactly.
  const matchesValue = (value: string | boolean): boolean =>
    attributeName === 'email' ? String(value).toLowerCase() === attributeValue.toLowerCase() : value === attributeValue;

  return users.filter((user) => user[attributeName] !== undefined && matchesValue(user[attributeName]!));
};
