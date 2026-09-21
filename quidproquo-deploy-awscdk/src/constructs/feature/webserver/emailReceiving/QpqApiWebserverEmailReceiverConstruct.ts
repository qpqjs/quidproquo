import { qpqCoreUtils } from 'quidproquo-core';
import { EmailReceiverQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { aws_ses } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { emailReceiptRuleName } from './emailReceiptRuleName';
import { QPQ_EMAIL_RECEIPT_RULE_SET_NAME } from './emailReceiptRuleSetName';
import { resolveEmailReceivingHosts } from './resolveEmailReceivingHosts';

export interface QpqApiWebserverEmailReceiverConstructProps extends QpqConstructBlockProps {
  emailReceiverConfig: EmailReceiverQPQWebServerConfigSetting;
}

// The app's rule in the account's shared receipt rule set: mail to the receiving host of any
// root lands in the receiver's drive under its key prefix. The set is referenced by name (the
// account stack owns and activates it); the drive's bucket policy grants the write on the Inf
// stack, keyed to this rule (see QpqCoreStorageDriveConstruct's emailReceiptRuleNames prop).
export class QpqApiWebserverEmailReceiverConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqApiWebserverEmailReceiverConstructProps) {
    super(scope, id, props);

    const { name, storageDriveName } = props.emailReceiverConfig;

    const recipients = resolveEmailReceivingHosts(props.qpqConfig).map(({ host }) => host);
    if (recipients.length === 0) {
      throw new Error(
        `Email receiver "${name}" needs a receiving domain: this service must declare defineEmailReceivingDomain (the same one as the bootstrap config), as it does defineDns`,
      );
    }

    // The write statement is on the owner's bucket, so only the owner can declare the receiver.
    const storageDrive = qpqCoreUtils.getOwnedStorageDrives(props.qpqConfig).find((drive) => drive.storageDrive === storageDriveName);
    if (!storageDrive) {
      throw new Error(`Email receiver "${name}" writes into storage drive "${storageDriveName}", which this service does not own`);
    }
    // The provider writes bare keys, which a scoped drive refuses to read.
    if (storageDrive.scoped) {
      throw new Error(`Email receiver "${name}" cannot write into scoped storage drive "${storageDriveName}"`);
    }

    new aws_ses.CfnReceiptRule(this, 'rule', {
      ruleSetName: QPQ_EMAIL_RECEIPT_RULE_SET_NAME,
      rule: {
        name: emailReceiptRuleName(props.qpqConfig, name),
        enabled: true,
        recipients,
        scanEnabled: true,
        tlsPolicy: 'Optional',
        actions: [{ s3Action: { bucketName: this.resourceName(storageDriveName), objectKeyPrefix: props.emailReceiverConfig.keyPrefix } }],
      },
    });
  }
}
