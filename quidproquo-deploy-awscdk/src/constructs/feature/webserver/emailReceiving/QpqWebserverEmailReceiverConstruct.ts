import { qpqCoreUtils } from 'quidproquo-core';
import { EmailReceiverQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { aws_ses } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { emailReceiptRuleName } from './emailReceiptRuleName';
import { QPQ_EMAIL_RECEIPT_RULE_SET_NAME } from './emailReceiptRuleSetName';
import { resolveEmailReceivingHosts } from './resolveEmailReceivingHosts';

export interface QpqWebserverEmailReceiverConstructProps extends QpqConstructBlockProps {
  emailReceiverConfig: EmailReceiverQPQWebServerConfigSetting;
}

// The app's rule in the account's shared receipt rule set: mail to the receiving host of any
// root lands in the receiver's drive under its key prefix. The set is referenced by name (the
// account stack owns and activates it); the drive's bucket policy grants the write separately,
// keyed to this rule (see QpqCoreStorageDriveConstruct's emailReceiptRuleNames prop).
export class QpqWebserverEmailReceiverConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverEmailReceiverConstructProps) {
    super(scope, id, props);

    const recipients = resolveEmailReceivingHosts(props.qpqConfig).map(({ host }) => host);
    if (recipients.length === 0) {
      throw new Error(
        `Email receiver "${props.emailReceiverConfig.name}" needs a receiving domain: this service must declare defineEmailReceivingDomain (the same one as the bootstrap config), as it does defineDns`,
      );
    }

    const { name, storageDriveName } = props.emailReceiverConfig;
    const storageDrive = qpqCoreUtils.getStorageDriveByName(storageDriveName, props.qpqConfig);
    if (!storageDrive) {
      throw new Error(`Email receiver "${name}" writes into storage drive "${storageDriveName}", which this config does not declare`);
    }
    // The provider writes bare keys, which a scoped drive refuses to read.
    if (storageDrive.scoped) {
      throw new Error(`Email receiver "${name}" cannot write into scoped storage drive "${storageDriveName}"`);
    }

    const bucketName = this.resourceName(storageDriveName);

    new aws_ses.CfnReceiptRule(this, 'rule', {
      ruleSetName: QPQ_EMAIL_RECEIPT_RULE_SET_NAME,
      rule: {
        name: emailReceiptRuleName(props.qpqConfig, props.emailReceiverConfig.name),
        enabled: true,
        recipients,
        scanEnabled: true,
        tlsPolicy: 'Optional',
        actions: [{ s3Action: { bucketName, objectKeyPrefix: props.emailReceiverConfig.keyPrefix } }],
      },
    });
  }
}
