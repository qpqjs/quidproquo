import { ConfigActionType, FileActionType, InlineFunctionActionType, runStory, StoryError, throwsError } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { EmailActionType } from '../../../../actions/email/EmailActionType';
import { onCreate } from './onCreate';

const event = { driveName: 'inbox-drive', filePaths: ['msg-1.eml'] } as any;

const parsed = {
  recipients: ['inbox@example.com'],
  from: [{ address: 'a@x.example' }],
  to: [],
  cc: [],
  replyTo: [],
  subject: 's',
  attachments: [],
  authentication: {},
};

// Security regression: a message is deleted from the receiving drive only after its handler ran; a handler failure leaves
// the object for the lifecycle sweep instead of silently dropping mail, and the handler is always the configured one.
describe('emailReceiving onCreate', () => {
  it('parses, hands the message to the configured handler, then deletes the object', () => {
    const deletes = vi.fn(() => undefined);
    const executed: string[] = [];

    runStory(onCreate(event), {
      [ConfigActionType.GetGlobal]: 'onEmailFn',
      [FileActionType.ReadBinaryContents]: { base64Data: 'AA==', mimeType: 'message/rfc822', filename: 'msg-1.eml' },
      [EmailActionType.Parse]: parsed,
      [InlineFunctionActionType.Execute]: (action: any) => {
        executed.push(action.payload.functionName);
        return undefined;
      },
      [FileActionType.Delete]: deletes,
    });

    expect(executed).toEqual(['onEmailFn']);
    expect(deletes).toHaveBeenCalledTimes(1);
  });

  it('keeps the object when the handler throws', () => {
    const deletes = vi.fn(() => undefined);

    expect(() =>
      runStory(onCreate(event), {
        [ConfigActionType.GetGlobal]: 'onEmailFn',
        [FileActionType.ReadBinaryContents]: { base64Data: 'AA==', mimeType: 'message/rfc822', filename: 'msg-1.eml' },
        [EmailActionType.Parse]: parsed,
        [InlineFunctionActionType.Execute]: () => throwsError('GenericError', 'handler exploded'),
        [FileActionType.Delete]: deletes,
      }),
    ).toThrow(StoryError);
    expect(deletes).not.toHaveBeenCalled();
  });
});
