import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';
import { ApiQPQWebServerConfigSetting, qpqWebServerUtils } from 'quidproquo-webserver';

import { aws_apigateway, aws_cloudwatch, aws_ec2, aws_lambda, aws_logs, aws_ssm, aws_wafv2 } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { getVirtualNetworkWorkloadSecurityGroupName } from '../../../../utils';
import { domainScopedId, resolveDeployHostForRoot } from '../../../../utils/domain';
import { createDefaultResourceAlarm } from '../../../base/createDefaultResourceAlarm';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';

export interface ApiQpqWebserverApiConstructProps extends QpqConstructBlockProps {
  apiConfig: ApiQPQWebServerConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

export class ApiQpqWebserverApiConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: ApiQpqWebserverApiConstructProps) {
    super(scope, id, props);

    const vpc = props.apiConfig.virtualNetworkName
      ? aws_ec2.Vpc.fromLookup(this, 'vpc-lookup', {
          vpcName: awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig(props.apiConfig.virtualNetworkName, props.qpqConfig),
        })
      : undefined;

    // The bootstrap-created workload group, not a CDK auto-created one — in-VPC
    // data stores allow ingress from this group only
    const securityGroups =
      vpc && props.apiConfig.virtualNetworkName
        ? [
            aws_ec2.SecurityGroup.fromLookupByName(
              this,
              'workload-sg-lookup',
              getVirtualNetworkWorkloadSecurityGroupName(props.apiConfig.virtualNetworkName, props.qpqConfig),
              vpc,
            ),
          ]
        : undefined;

    // Build Function
    const func = new Function(this, 'api-function', {
      functionName: this.resourceName(`${props.apiConfig.apiName}-route`),
      functionType: 'apiGatewayEventHandler',
      executorName: 'apiGatewayEventHandler',

      // Match API Gateway's 29s integration cap — the (25s) Function default would kill
      // slow requests as a 502 with 4s of the gateway window still unused
      timeoutInSeconds: 29,

      qpqConfig: props.qpqConfig,

      apiLayerVersions: props.apiLayerVersions,

      reservedConcurrentExecutions: props.apiConfig.maxConcurrentExecutions,

      role: this.getServiceRole(),

      vpc,
      securityGroups,
    });

    const accessLogGroup = new aws_logs.LogGroup(this, 'access-logs', {
      retention: aws_logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a rest api
    const api = new aws_apigateway.LambdaRestApi(this, 'lambda-rest-api', {
      restApiName: this.resourceName(`${props.apiConfig.apiName}-rest-api`),
      handler: func.lambdaFunction,
      binaryMediaTypes: ['*/*'],
      proxy: true,
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
      endpointTypes: [aws_apigateway.EndpointType.REGIONAL],
      deployOptions: {
        accessLogDestination: new aws_apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: aws_apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: false,
        }),
        loggingLevel: aws_apigateway.MethodLoggingLevel.ERROR,
        metricsEnabled: true,
        dataTraceEnabled: false,
      },
    });

    // Default alarm (opt-in via defineNotifyError): server-side (5XX) errors
    // reaching clients. 4XX is caller error, so not alarmed by default.
    createDefaultResourceAlarm(this, props.qpqConfig, {
      id: 'default-alarm-5xx',
      alarmName: this.resourceName(`${props.apiConfig.apiName}-5xx`),
      metric: api.metricServerError({ period: cdk.Duration.minutes(1), statistic: 'Sum' }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // Security event monitoring (opt-in via defineNotifyError, like all default alarms):
    // sustained 401s = credential stuffing / token probing, sustained 403s = forbidden
    // probing. Access logs are JSON (jsonWithStandardFields) with status as a string.
    // Thresholds are deliberate defaults - promote to config knobs if they prove noisy.
    // Guarded as a whole because metric filters bill custom metrics even without alarms.
    if (qpqCoreUtils.getNotifyErrorConfigs(props.qpqConfig).length > 0) {
      for (const statusCode of ['401', '403']) {
        const metricName = this.resourceName(`${props.apiConfig.apiName}-${statusCode}`);

        new aws_logs.MetricFilter(this, `auth-failure-filter-${statusCode}`, {
          logGroup: accessLogGroup,
          filterPattern: aws_logs.FilterPattern.stringValue('$.status', '=', statusCode),
          metricNamespace: 'qpq/security',
          metricName,
          metricValue: '1',
        });

        createDefaultResourceAlarm(this, props.qpqConfig, {
          id: `default-alarm-${statusCode}-rate`,
          alarmName: this.resourceName(`${props.apiConfig.apiName}-${statusCode}-rate`),
          metric: new aws_cloudwatch.Metric({
            namespace: 'qpq/security',
            metricName,
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 20,
          evaluationPeriods: 3,
          datapointsToAlarm: 2,
        });
      }
    }

    // Attach the shared REGIONAL web acl (created by the bootstrap phase's defineBootstrapWaf,
    // arn published to SSM) - one association per service api stage, resolved at deploy time
    if (qpqConfigAwsUtils.isWafProtectionEnabled(props.qpqConfig)) {
      new aws_wafv2.CfnWebACLAssociation(this, 'waf-association', {
        resourceArn: api.deploymentStage.stageArn,
        webAclArn: aws_ssm.StringParameter.valueForStringParameter(
          this,
          qpqConfigAwsUtils.getWafWebAclArnSsmParameterName('regional', props.qpqConfig),
        ),
      });
    }

    // Mounted under the service name on the api's custom domain of every root.
    for (const rootDomain of qpqWebServerUtils.getRootDomains(props.qpqConfig)) {
      new aws_apigateway.CfnBasePathMapping(this, domainScopedId(props.qpqConfig, 'bpm', rootDomain), {
        domainName: resolveDeployHostForRoot(props.qpqConfig, rootDomain, { subdomain: props.apiConfig.apiSubdomain }),
        basePath: qpqCoreUtils.getApplicationModuleName(props.qpqConfig),
        restApiId: api.restApiId,
        stage: api.deploymentStage.stageName,
      });
    }
  }
}
