import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';
import { DomainTarget, qpqWebServerUtils, WebSocketQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { aws_apigatewayv2, aws_iam, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { importStackValue } from '../../../../utils';
import { domainScopedId } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { SubdomainName } from '../../../basic';
import { Function } from '../../../basic/Function';

export interface QpqApiWebserverWebsocketConstructProps extends QpqConstructBlockProps {
  websocketConfig: WebSocketQPQWebServerConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

export class QpqApiWebserverWebsocketConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqApiWebserverWebsocketConstructProps) {
    super(scope, id, props);

    // Don't deploy when deprecated.
    if (props.websocketConfig.deprecated) {
      return;
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
    const awsAccountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);

    const apiId = importStackValue(awsNamingUtils.getCFExportNameWebsocketApiIdFromConfig(props.websocketConfig.apiName, props.qpqConfig));

    const deployment = new aws_apigatewayv2.CfnDeployment(this, 'websocket-deployment', {
      apiId,
    });

    const stage = new aws_apigatewayv2.CfnStage(this, 'websocket-stage', {
      apiId,
      deploymentId: deployment.ref,
      stageName: 'prod',
    });

    const func = new Function(this, 'api-function', {
      functionName: this.resourceName(`${props.websocketConfig.apiName}-ws`),
      functionType: 'apiGatwayEventWebsocketWithIdentity_websocketEvent',
      executorName: 'apiGatwayEventWebsocketWithIdentity_websocketEvent',

      qpqConfig: props.qpqConfig,

      apiLayerVersions: props.apiLayerVersions,

      environment: {
        websocketApiName: props.websocketConfig.apiName,
      },

      reservedConcurrentExecutions: props.websocketConfig.maxConcurrentExecutions,

      role: this.getServiceRole(),
    });

    // Let api gateway invoke this ok
    func.lambdaFunction.grantInvoke(
      new aws_iam.ServicePrincipal('apigateway.amazonaws.com', {
        conditions: {
          ArnLike: {
            'aws:SourceArn': `arn:aws:execute-api:${region}:${awsAccountId}:${apiId}/*`,
          },
        },
      }),
    );

    const integration = new aws_apigatewayv2.CfnIntegration(this, 'websocket-integration', {
      apiId,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${func.lambdaFunction.functionArn}/invocations`,
    });

    // Create the route and associate it with the integration
    const connectRoute = new aws_apigatewayv2.CfnRoute(this, 'connect-route', {
      apiId,
      routeKey: '$connect',
      target: `integrations/${integration.ref}`,
      apiKeyRequired: false,
      authorizationType: 'NONE',
      operationName: 'connect',
    });

    // Create the route and associate it with the integration
    const disconnectRoute = new aws_apigatewayv2.CfnRoute(this, 'disconnect-route', {
      apiId,
      routeKey: '$disconnect',
      target: `integrations/${integration.ref}`,
      apiKeyRequired: false,
      authorizationType: 'NONE',
      operationName: 'disconnect',
    });

    // Create the route and associate it with the integration
    const defaultRoute = new aws_apigatewayv2.CfnRoute(this, 'default-route', {
      apiId,
      routeKey: '$default',
      target: `integrations/${integration.ref}`,
      apiKeyRequired: false,
      authorizationType: 'NONE',
      operationName: 'default',
    });

    deployment.addDependency(connectRoute);
    deployment.addDependency(disconnectRoute);
    deployment.addDependency(defaultRoute);

    // A custom domain on every root, each mapped onto the one websocket api.
    const target: DomainTarget = {
      subdomain: props.websocketConfig.apiSubdomain,
      service: props.websocketConfig.onRootDomain ? undefined : qpqCoreUtils.getApplicationModuleName(props.qpqConfig),
    };

    for (const rootDomain of qpqWebServerUtils.getRootDomains(props.qpqConfig)) {
      const subdomain = new SubdomainName(this, domainScopedId(props.qpqConfig, 'subdomain', rootDomain), {
        rootDomain,
        target,
        qpqConfig: props.qpqConfig,
      });

      new aws_apigatewayv2.CfnApiMapping(this, domainScopedId(props.qpqConfig, 'websocket-api-mapping', rootDomain), {
        apiId: apiId,
        domainName: subdomain.domainName.domainName,
        stage: stage.ref,
      });
    }
  }
}
