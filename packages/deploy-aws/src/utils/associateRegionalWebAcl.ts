import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { QPQConfig } from '@qpqjs/core';

import { aws_ssm, aws_wafv2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Attaches the shared REGIONAL web acl (created by the bootstrap phase's defineBootstrapWaf, arn
 * published to SSM) to one API Gateway stage, resolved at deploy time. Does nothing when WAF
 * protection is off, so every regional api attaches the same way or not at all.
 */
export const associateRegionalWebAcl = (scope: Construct, stageArn: string, qpqConfig: QPQConfig): void => {
  if (!qpqConfigAwsUtils.isWafProtectionEnabled(qpqConfig)) {
    return;
  }

  new aws_wafv2.CfnWebACLAssociation(scope, 'waf-association', {
    resourceArn: stageArn,
    webAclArn: aws_ssm.StringParameter.valueForStringParameter(scope, qpqConfigAwsUtils.getWafWebAclArnSsmParameterName('regional', qpqConfig)),
  });
};
