import { AiQPQConfigSetting } from 'quidproquo-core';

import { aws_iam } from 'aws-cdk-lib';

export class QpqCoreAiConstruct {
  public static authorizeActionsForRole(role: aws_iam.IRole, aiConfigs: AiQPQConfigSetting[]) {
    if (aiConfigs.length === 0) {
      return;
    }

    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['*'],
      }),
    );
  }
}
