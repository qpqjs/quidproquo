import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
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
import { getUserDirectorySetAccessTokenActionProcessor } from './getUserDirectorySetAccessTokenActionProcessor';
import { getUserDirectorySetPasswordActionProcessor } from './getUserDirectorySetPasswordActionProcessor';
import { getUserDirectorySetUserAttributesActionProcessor } from './getUserDirectorySetUserAttributesActionProcessor';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;
const devServerConfig = buildTestDevServerConfig();

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getUserDirectoryActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getUserDirectoryAssociateSoftwareTokenActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryAuthenticateUserActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryChangePasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryConfirmEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryConfirmForgotPasswordActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryCreateUserActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryDecodeAccessTokenActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryForgotPasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUserAttributesActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUserAttributesByUserIdActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUsersActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryGetUsersByAttributeActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryReadAccessTokenActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRefreshTokenActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRequestEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryRespondToAuthChallengeActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectorySetAccessTokenActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserDirectorySetPasswordActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectorySetUserAttributesActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getUserDirectoryActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
