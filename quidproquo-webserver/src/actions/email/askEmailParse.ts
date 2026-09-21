import { createActionRequester } from 'quidproquo-core';

import { EmailActionType } from './EmailActionType';
import { EmailMessage } from './EmailMessage';

/**
 * Parse a raw MIME message (base64, as askFileReadBinaryContents returns an object a
 * defineEmailReceiver wrote) into an EmailMessage. Pure on every platform.
 */
export const askEmailParse = createActionRequester<EmailMessage>()({
  actionType: EmailActionType.Parse,
  errorTypes: [
    'Invalid', // the bytes are not a MIME message
  ],
  getPayload: (rawBase64: string) => ({ rawBase64 }),
});
