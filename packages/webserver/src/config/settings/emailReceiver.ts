import { defineInlineFunction, defineStorageDrive, QPQConfig, QPQConfigSetting, QpqFunctionRuntime } from 'quidproquo-core';

import { EMAIL_RECEIVER_ON_EMAIL_GLOBAL } from '../../services/emailReceiving/constants/emailReceivingGlobals';
import { getServiceEntryQpqFunctionRuntime } from '../../services/getServiceEntryQpqFunctionRuntime';
import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface EmailReceiverQPQWebServerConfigSetting extends QPQConfigSetting {
  name: string;
  // The drive raw messages land in, owned by the receiver; apps never name it.
  storageDriveName: string;
  onEmailFunctionName: string;
}

export type EmailReceiverOptions = {
  // Runs once per received message with an EmailReceivedEvent.
  onEmail: QpqFunctionRuntime;
};

/** The drive a receiver's raw messages land in. Framework-owned: the api never names it. */
export const emailReceiverStorageDriveName = (name: string): string => `email-${name}`;

/** The inline function a receiver's onEmail is registered as. */
export const emailReceiverOnEmailFunctionName = (name: string): string => `qpq-email-receiver-${name}`;

// A handled message is deleted by the create handler seconds after it lands; the lifecycle
// rule only sweeps up the ones a failing handler left behind.
const UNHANDLED_RETENTION_DAYS = 1;

/**
 * Receive mail sent to any address at the app's receiving domain (defineEmailReceivingDomain).
 * Every message runs `onEmail` with an EmailReceivedEvent carrying the parsed message: who it
 * is from, who it was delivered to, subject, bodies, attachments and the provider's SPF/DKIM
 * verdicts. The transport (a drive the
 * provider writes raw messages into, a create handler that parses them) is the receiver's own.
 * A throwing handler loses that message after the platform's retries; catch inside it to do
 * otherwise. Deployed platforms only; the dev server does not receive mail.
 */
export const defineEmailReceiver = (name: string, options: EmailReceiverOptions): QPQConfig => {
  const storageDriveName = emailReceiverStorageDriveName(name);
  const onEmailFunctionName = emailReceiverOnEmailFunctionName(name);

  const receiver: EmailReceiverQPQWebServerConfigSetting = {
    configSettingType: QPQWebServerConfigSettingType.EmailReceiver,
    uniqueKey: `emailReceiver-${name}`,

    name,
    storageDriveName,
    onEmailFunctionName,
  };

  return [
    receiver,

    defineInlineFunction(options.onEmail, { functionName: onEmailFunctionName }),

    defineStorageDrive(storageDriveName, {
      lifecycleRules: [{ deleteAfterDays: UNHANDLED_RETENTION_DAYS }],
      onEvent: {
        create: {
          ...getServiceEntryQpqFunctionRuntime('emailReceiving', 'storageDrive', 'onCreate::onCreate'),
          globals: { [EMAIL_RECEIVER_ON_EMAIL_GLOBAL]: onEmailFunctionName },
        },
      },
    }),
  ];
};
