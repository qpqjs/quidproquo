import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { AiQPQConfigSetting, QPQConfig } from '@qpqjs/core';

import { aws_iam } from 'aws-cdk-lib';

export class QpqCoreAiConstruct {
  public static authorizeActionsForRole(role: aws_iam.IRole, aiConfigs: AiQPQConfigSetting[], qpqConfig: QPQConfig) {
    if (aiConfigs.length === 0) {
      return;
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);

    // Foundation models are AWS-owned (no account in the ARN) and a cross-region inference
    // profile routes to models in other regions, so the model ARN is region-wildcarded; the
    // profiles themselves are this account's own.
    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['arn:aws:bedrock:*::foundation-model/*', `arn:aws:bedrock:${region}:${accountId}:inference-profile/*`],
      }),
    );
  }
}
