import { awsNamingUtils } from '@qpqjs/actionprocessor-aws';
import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { QPQConfig } from '@qpqjs/core';

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
