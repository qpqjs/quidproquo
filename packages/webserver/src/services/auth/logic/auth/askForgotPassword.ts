import { AskResponse, askUserDirectoryForgotPassword, AuthenticationDeliveryDetails } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askForgotPassword(username: string): AskResponse<AuthenticationDeliveryDetails> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  const deliveryDetails = yield* askUserDirectoryForgotPassword(userDirectoryName, username);

  return deliveryDetails;
}
