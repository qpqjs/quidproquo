import { askConfigGetGlobal, askFileDelete, askFileReadBinaryContents, askInlineFunctionExecute, AskResponse } from 'quidproquo-core';

import { askEmailParse } from '../../../../actions/email/askEmailParse';
import { EmailReceivedEvent, EmailReceivedEventResponse } from '../../../../types/EmailReceivedEvent';
import { StorageDriveEvent, StorageDriveEventResponse } from '../../../../types/StorageDriveEvent';
import { EMAIL_RECEIVER_ON_EMAIL_GLOBAL } from '../../constants/emailReceivingGlobals';

// The receiver drive's create handler: each object the mail provider wrote is one message.
// It is parsed here and handed to the receiver's onEmail, then deleted; a message whose
// handler throws stays until the drive's lifecycle rule sweeps it.
export function* onCreate(event: StorageDriveEvent): AskResponse<StorageDriveEventResponse> {
  const onEmailFunctionName = yield* askConfigGetGlobal<string>(EMAIL_RECEIVER_ON_EMAIL_GLOBAL);

  for (const filepath of event.filePaths) {
    const raw = yield* askFileReadBinaryContents(event.driveName, filepath);
    const message = yield* askEmailParse(raw.base64Data);

    yield* askInlineFunctionExecute<EmailReceivedEventResponse, EmailReceivedEvent>(onEmailFunctionName, { message });

    yield* askFileDelete(event.driveName, [filepath]);
  }
}
