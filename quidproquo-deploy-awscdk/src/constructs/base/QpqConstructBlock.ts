import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig } from 'quidproquo-core';

import { aws_iam } from 'aws-cdk-lib';
import { IGrantable } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { QpqResource } from './QpqResource';
import { QpqServiceRole } from './QpqServiceRole';

export interface QpqConstructBlockProps {
  qpqConfig: QPQConfig;
}

export class QpqConstructBlock extends Construct implements QpqResource {
  qpqConfig: QPQConfig;

  constructor(scope: Construct, id: string, props: QpqConstructBlockProps) {
    super(scope, id);

    this.qpqConfig = props.qpqConfig;
  }

  resourceName(name: string) {
    return awsNamingUtils.getConfigRuntimeResourceNameFromConfig(name, this.qpqConfig);
  }

  resourceNameWithModuleOveride(name: string, module?: string) {
    return awsNamingUtils.getConfigRuntimeResourceNameFromConfigWithServiceOverride(name, this.qpqConfig, module);
  }

  qpqResourceName(name: string, resourceType: string) {
    return awsNamingUtils.getQpqRuntimeResourceNameFromConfig(name, this.qpqConfig, resourceType);
  }

  qpqBootstrapResourceName(name: string) {
    return awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig(name, this.qpqConfig);
  }

  grantRead(grantee: IGrantable): void {}

  grantWrite(grantee: IGrantable): void {}

  grantAll(grantee: IGrantable): void {
    this.grantRead(grantee);
    this.grantWrite(grantee);
  }

  getServiceRole(): aws_iam.IRole {
    return QpqServiceRole.of(this, this.qpqConfig);
  }
}
