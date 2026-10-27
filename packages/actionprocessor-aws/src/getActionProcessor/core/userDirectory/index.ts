import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

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

export const getUserDirectoryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserDirectoryAssociateSoftwareTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryAuthenticateUserActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryChangePasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryConfirmEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryConfirmForgotPasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryCreateUserActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryDecodeAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryForgotPasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryGetUserAttributesActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryGetUserAttributesByUserIdActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryGetUsersActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryGetUsersByAttributeActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryReadAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryRefreshTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryRevokeRefreshTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryRequestEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryRespondToAuthChallengeActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectorySetAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectorySetPasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectorySetUserAttributesActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectorySignOutUserActionProcessor(qpqConfig, dynamicModuleLoader)),
});
