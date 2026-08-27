import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';

import { aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../utils/qpqDeployAwsCdkUtils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';

export interface WebserverRollProps extends QpqConstructBlockProps {}

export class WebserverRoll extends QpqConstructBlock {
  role: aws_iam.IRole;

  constructor(scope: Construct, id: string, props: WebserverRollProps) {
    super(scope, id, props);

    const role = new aws_iam.Role(this, 'role', {
      roleName: this.resourceName('service-role'),
      assumedBy: new aws_iam.CompositePrincipal(
        new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        new aws_iam.ServicePrincipal('transfer.amazonaws.com'),
        new aws_iam.ServicePrincipal('edgelambda.amazonaws.com'),
        // new aws_iam.ServicePrincipal('neptune.amazonaws.com'),
      ),
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(role, props.qpqConfig);

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);
    const applicationName = qpqCoreUtils.getApplicationName(props.qpqConfig);
    const environment = qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig);
    const feature = qpqCoreUtils.getApplicationModuleFeature(props.qpqConfig);

    // This deployment's identity tags, as applied to every qpq resource by applyEnvironmentTags.
    // Used for tag-based conditions where the target resource's id is unknowable at synth
    // (later deploy phase / AWS-generated) but the resource is still owned by this deployment.
    const applicationResourceTagConditions = {
      'aws:ResourceTag/application': qpqCoreUtils.getApplicationName(props.qpqConfig),
      'aws:ResourceTag/environment': qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig),
      ...(feature ? { 'aws:ResourceTag/feature': feature } : {}),
    };

    // Every event-bus topic this service can publish to (owned + referenced cross-module) -
    // the same owner-fallback derivation the runtime send processor uses to build the ARN.
    const eventBusTopicArns = qpqCoreUtils.getAllEventBusConfigs(props.qpqConfig).map((eventBusConfig) =>
      awsNamingUtils.getEventBusSnsTopicArn(
        eventBusConfig.owner?.resourceNameOverride || eventBusConfig.name,
        props.qpqConfig,

        eventBusConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(props.qpqConfig),
        eventBusConfig.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig),
        eventBusConfig.owner?.application || qpqCoreUtils.getApplicationName(props.qpqConfig),
        eventBusConfig.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(props.qpqConfig),
        eventBusConfig.isFifo,
      ),
    );

    const policies: aws_iam.PolicyStatementProps[] = [
      // Resolve cross-stack resource names at runtime via CloudFormation exports.
      {
        sid: 'CloudFormationListExports',
        actions: ['cloudformation:ListExports'],
        resources: ['*'],
      },

      // Read api-key values at runtime for api-key validation - keys are fetched individually
      // by id (never listed), so the grant is per-key, pinned to this application's tags.
      // Module is deliberately NOT pinned: routes may reference another service's key
      // (ApiKeyReference.serviceName) within the same application + environment.
      {
        sid: 'APIGatewayGetOperations',
        actions: ['apigateway:GET'],
        resources: [`arn:aws:apigateway:${region}::/apikeys/*`],
        conditions: {
          StringEquals: applicationResourceTagConditions,
        },
      },

      // Publish to event-bus SNS topics (the framework's pub/sub layer), scoped to the
      // buses this service declares. Omitted entirely when no event buses are configured.
      ...(eventBusTopicArns.length > 0
        ? [
            {
              sid: 'SNSPublishMessages',
              actions: ['sns:Publish'],
              resources: eventBusTopicArns,
            },
          ]
        : []),

      // Invoke QPQ service functions from other lambdas. The runtime derives target names
      // with getConfigRuntimeResourceName from its own app/env/feature (only the target
      // service varies), so the same helper builds this pattern with the function and
      // service segments wildcarded - cross-app/env invocation is not possible.
      {
        sid: 'LambdaInvokeFunction',
        actions: ['lambda:InvokeFunction'],
        resources: [
          `arn:aws:lambda:${region}:${accountId}:function:${awsNamingUtils.getConfigRuntimeResourceName('*-sfunc', applicationName, '*', environment, feature)}`,
        ],
      },

      // Look up ACM certs when wiring up custom domains at runtime.
      {
        sid: 'ACMCertificateOperations',
        actions: ['acm:DescribeCertificate', 'acm:ListCertificates'],
        resources: ['*'],
      },

      // Standard Lambda logging + log retrieval for the `askGetLogs` flow. Account-pinned;
      // region is left open because edge lambdas write logs in their execution region.
      {
        sid: 'CloudWatchLogsManagement',
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:PutLogEvents',
          'logs:GetLogEvents',
          'logs:FilterLogEvents',
        ],
        resources: [`arn:aws:logs:*:${accountId}:log-group:*`],
      },

      // Tags are the authorization boundary for the owned-resource grants (the
      // aws:ResourceTag-conditioned statements built from getOwnedResourceTagConditions):
      // anything that can retag a resource can move that boundary. The runtime role never
      // needs to mutate tags, and none of the allow statements grant these actions, so
      // today the boundary holds by omission. The explicit deny below would make that
      // load-bearing, but it is commented out to save inline-policy bytes (the 10,240
      // cap is the whole reason for the tag-based grants). Re-enable it if the role
      // ever gets headroom, and never add tag-mutation actions to any allow list here.
      // {
      //   sid: 'DenyTagMutation',
      //   effect: aws_iam.Effect.DENY,
      //   actions: [
      //     'dynamodb:TagResource',
      //     'dynamodb:UntagResource',
      //     's3:PutBucketTagging',
      //     'ssm:AddTagsToResource',
      //     'ssm:RemoveTagsFromResource',
      //     'secretsmanager:TagResource',
      //     'secretsmanager:UntagResource',
      //     'tag:TagResources',
      //     'tag:UntagResources',
      //   ],
      //   resources: ['*'],
      // },

      // Required for VPC-attached Lambdas to manage their ENIs.
      {
        sid: 'EC2NetworkInterfacePermissions',
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
          'ec2:AssignPrivateIpAddresses',
          'ec2:UnassignPrivateIpAddresses',
        ],
        resources: ['*'],
      },
    ];

    policies.forEach((policy) => {
      role.addToPolicy(new aws_iam.PolicyStatement(policy));
    });

    this.role = role;
  }
}
