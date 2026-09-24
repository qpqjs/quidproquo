import { defineEmailReceiver, defineEmailSender, QPQConfig } from 'quidproquo';

import { SMOKE_EMAIL_RECEIVER } from '../constants/SMOKE_EMAIL_RECEIVER';

/**
 * The test sends to its own receiving domain, the receiver hands the parsed
 * message to onSmokeEmailReceived, which writes a marker into the probe store,
 * and the test polls for it. The sender is what lets the test send; the
 * receiving domain is a verified identity, so the SES sandbox allows it.
 */
export const defineEmailReceiveSmoke = (): QPQConfig => [
  defineEmailSender(),
  defineEmailReceiver(SMOKE_EMAIL_RECEIVER, {
    onEmail: {
      basePath: __dirname,
      relativePath: '../entry/email/onSmokeEmailReceived',
      functionName: 'onSmokeEmailReceived',
    },
  }),
];
