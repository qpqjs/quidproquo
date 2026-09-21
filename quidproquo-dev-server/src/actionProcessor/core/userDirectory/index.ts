import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../../types';
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

export const getUserDirectoryActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getUserDirectoryAssociateSoftwareTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryAuthenticateUserActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryChangePasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryConfirmEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryConfirmForgotPasswordActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryCreateUserActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryDecodeAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryForgotPasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryGetUserAttributesActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryGetUserAttributesByUserIdActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryGetUsersActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryGetUsersByAttributeActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryReadAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryRefreshTokenActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryRequestEmailVerificationActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryRespondToAuthChallengeActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectorySetAccessTokenActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectorySetPasswordActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectorySetUserAttributesActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
  });
