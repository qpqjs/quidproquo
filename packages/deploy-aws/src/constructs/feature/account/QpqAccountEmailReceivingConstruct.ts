import { awsNamingUtils } from '@qpqjs/config-aws';

import { aws_iam, aws_ses } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../base/QpqConstructBlock';

export type QpqAccountEmailReceivingConstructProps = {} & QpqConstructBlockProps;

// The account's one active receipt rule set. CloudFormation can create a rule set but not
// activate it, so activation is an SDK call; every app's inf stack adds its rules to this set
// by name (awsNamingUtils.QPQ_EMAIL_RECEIPT_RULE_SET_NAME) and never activates anything itself.
export class QpqAccountEmailReceivingConstruct extends QpqConstructBlock {
  public readonly ruleSet: aws_ses.ReceiptRuleSet;

  constructor(scope: Construct, id: string, props: QpqAccountEmailReceivingConstructProps) {
    super(scope, id, props);

    this.ruleSet = new aws_ses.ReceiptRuleSet(this, 'rule-set', {
      receiptRuleSetName: awsNamingUtils.QPQ_EMAIL_RECEIPT_RULE_SET_NAME,
    });

    const activate = {
      service: 'SES',
      action: 'setActiveReceiptRuleSet',
      parameters: { RuleSetName: awsNamingUtils.QPQ_EMAIL_RECEIPT_RULE_SET_NAME },
      physicalResourceId: PhysicalResourceId.of(`active-${awsNamingUtils.QPQ_EMAIL_RECEIPT_RULE_SET_NAME}`),
    };

    // Deactivating on delete (no RuleSetName) is what lets the set itself delete; SES refuses
    // to delete an active set.
    const activation = new AwsCustomResource(this, 'activate', {
      installLatestAwsSdk: false,
      onCreate: activate,
      onUpdate: activate,
      onDelete: {
        service: 'SES',
        action: 'setActiveReceiptRuleSet',
        parameters: {},
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        // SetActiveReceiptRuleSet has no resource-level ARN in IAM.
        new aws_iam.PolicyStatement({ actions: ['ses:SetActiveReceiptRuleSet'], resources: ['*'] }),
      ]),
    });
    activation.node.addDependency(this.ruleSet);
  }
}
