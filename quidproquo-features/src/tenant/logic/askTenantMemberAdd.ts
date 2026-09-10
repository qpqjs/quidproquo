import { AskResponse, askThrowError, askUserDirectoryGetUsersByAttribute, ErrorTypeEnum } from 'quidproquo-core';

import { TenantMember } from '../models/TenantMember';
import { askTenantLinkMember } from './askTenantLinkMember';

// Add an EXISTING user directory account to a tenant by email. There is no invite
// flow: an email with no account is NotFound (the UI tells the admin to have the
// person sign up first). Idempotent - re-adding a member is a no-op that still
// returns the member.
export function* askTenantMemberAdd(userDirectoryName: string, tenantId: string, email: string): AskResponse<TenantMember> {
  const normalisedEmail = email.trim().toLowerCase();
  if (!normalisedEmail) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'An email address is required.');
  }

  const { items } = yield* askUserDirectoryGetUsersByAttribute(userDirectoryName, 'email', normalisedEmail, 1);
  const user = items[0];

  if (!user?.userId) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `No user account exists for ${normalisedEmail}.`);
  }

  yield* askTenantLinkMember(tenantId, user.userId);

  return {
    userId: user.userId,
    email: user.email ?? normalisedEmail,
    name: user.name ?? null,
  };
}
