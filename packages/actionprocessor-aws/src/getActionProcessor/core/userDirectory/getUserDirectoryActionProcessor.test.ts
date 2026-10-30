import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserDirectoryActionProcessor } from './getUserDirectoryActionProcessor';
import { getUserDirectoryAssociateSoftwareTokenActionProcessor } from './getUserDirectoryAssociateSoftwareTokenActionProcessor';
import { getUserDirectoryAuthenticateUserActionProcessor } from './getUserDirectoryAuthenticateUserActionProcessor';
import { getUserDirectoryChangePasswordActionProcessor } from './getUserDirectoryChangePasswordActionProcessor';
import { getUserDirectoryConfirmEmailVerificationActionProcessor } from './getUserDirectoryConfirmEmailVerificationActionProcessor';
import { getUserDirectoryConfirmForgotPasswordActionProcessor } from './getUserDirectoryConfirmForgotPasswordActionProcessor';
import { getUserDirectoryCreateUserActionProcessor } from './getUserDirectoryCreateUserActionProcessor';
import { getUserDirectoryDecodeAccessTokenActionProcessor } from './getUserDirectoryDecodeAccessTokenActionProcessor';
import { getUserDirectoryForgotPasswordActionProcessor } from './getUserDirectoryForgotPasswordActionProcessor';
import { getUserDirectoryGetUserAttributesActionProcessor } from './getUserDirectoryGetUserAttributesActionProcessor';
import { getUserDirectoryGetUserAttributesByUserIdActionProcessor } from './getUserDirectoryGetUserAttributesByUserIdActionProcessor';
import { getUserDirectoryGetUsersActionProcessor } from './getUserDirectoryGetUsersActionProcessor';
import { getUserDirectoryGetUsersByAttributeActionProcessor } from './getUserDirectoryGetUsersByAttributeActionProcessor';
import { getUserDirectoryReadAccessTokenActionProcessor } from './getUserDirectoryReadAccessTokenActionProcessor';
import { getUserDirectoryRefreshTokenActionProcessor } from './getUserDirectoryRefreshTokenActionProcessor';
import { getUserDirectoryRequestEmailVerificationActionProcessor } from './getUserDirectoryRequestEmailVerificationActionProcessor';
import { getUserDirectoryRespondToAuthChallengeActionProcessor } from './getUserDirectoryRespondToAuthChallengeActionProcessor';
import { getUserDirectoryRevokeRefreshTokenActionProcessor } from './getUserDirectoryRevokeRefreshTokenActionProcessor';
import { getUserDirectorySetAccessTokenActionProcessor } from './getUserDirectorySetAccessTokenActionProcessor';
import { getUserDirectorySetPasswordActionProcessor } from './getUserDirectorySetPasswordActionProcessor';
import { getUserDirectorySetUserAttributesActionProcessor } from './getUserDirectorySetUserAttributesActionProcessor';
import { getUserDirectorySignOutUserActionProcessor } from './getUserDirectorySignOutUserActionProcessor';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getUserDirectoryActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getUserDirectoryAssociateSoftwareTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryAuthenticateUserActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryChangePasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryConfirmEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryConfirmForgotPasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryCreateUserActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryDecodeAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryForgotPasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUserAttributesActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUserAttributesByUserIdActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUsersActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUsersByAttributeActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryReadAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRefreshTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRevokeRefreshTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRequestEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRespondToAuthChallengeActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectorySetAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectorySetPasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectorySetUserAttributesActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectorySignOutUserActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getUserDirectoryActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
