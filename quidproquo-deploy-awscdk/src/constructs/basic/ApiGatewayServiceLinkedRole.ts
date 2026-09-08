import { qpqConfigAwsUtils } from 'quidproquo-config-aws';

import { aws_iam } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';

export interface ApiGatewayServiceLinkedRoleProps extends QpqConstructBlockProps {}

// API Gateway reads ACM certificates through AWSServiceRoleForAPIGateway, which AWS creates
// lazily on first use. A fresh account's first custom domain therefore fails with "Access
// denied to certificate" while that same failure creates the role. Creating it here, and
// making every DomainName depend on it, removes the one-time failure. Idempotent: an account
// that already has the role answers InvalidInput, which is ignored. Never deleted.
export class ApiGatewayServiceLinkedRole extends QpqConstructBlock {
  public readonly resource: AwsCustomResource;

  constructor(scope: Construct, id: string, props: ApiGatewayServiceLinkedRoleProps) {
    super(scope, id, props);

    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);

    this.resource = new AwsCustomResource(this, 'create', {
      installLatestAwsSdk: false,
      onCreate: {
        service: 'IAM',
        action: 'createServiceLinkedRole',
        parameters: { AWSServiceName: 'ops.apigateway.amazonaws.com' },
        physicalResourceId: PhysicalResourceId.of('AWSServiceRoleForAPIGateway'),
        ignoreErrorCodesMatching: 'InvalidInput',
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new aws_iam.PolicyStatement({
          actions: ['iam:CreateServiceLinkedRole'],
          resources: [`arn:aws:iam::${accountId}:role/aws-service-role/ops.apigateway.amazonaws.com/*`],
        }),
      ]),
    });
  }
}
