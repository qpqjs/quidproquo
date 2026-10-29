import { AskResponse, askUserDirectoryForgotPassword, AuthenticationDeliveryDetails } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

export function* askAuthForgotPassword(username: string): AskResponse<AuthenticationDeliveryDetails> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  const deliveryDetails = yield* askUserDirectoryForgotPassword(userDirectoryName, username);

  return deliveryDetails;
}
