import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig } from 'quidproquo-core';

import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface QpqServiceStackProps {
  qpqConfig: QPQConfig;
}

export class QpqServiceStack extends Stack {
  qpqConfig: QPQConfig;

  constructor(scope: Construct, id: string, props: QpqServiceStackProps) {
    super(scope, id, {
      env: {
        region: qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig),
        account: qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig),
      },
    });

    this.qpqConfig = props.qpqConfig;
  }

  resourceName(name: string) {
    return awsNamingUtils.getConfigRuntimeResourceNameFromConfig(name, this.qpqConfig);
  }
}
