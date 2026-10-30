import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { qpqCoreUtils } from '@qpqjs/core';
import { DomainTarget, qpqWebServerUtils, WebSocketQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { aws_apigatewayv2, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { importStackValue } from '../../../../utils';
import { domainScopedId } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { SubdomainName } from '../../../basic';
import { Function } from '../../../basic/Function';

export type QpqApiWebserverWebsocketConstructProps = {
  websocketConfig: WebSocketQPQWebServerConfigSetting;
} & QpqConstructBlockProps;

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
      functionName: this.resourceName(awsNamingUtils.getLambdaBaseName(props.websocketConfig.apiName, awsNamingUtils.QpqLambdaKind.Websocket)),
      handler: 'apiGatwayEventWebsocketWithIdentity_websocketEvent',

      qpqConfig: props.qpqConfig,

      environment: {
        websocketApiName: props.websocketConfig.apiName,
      },

      reservedConcurrentExecutions: props.websocketConfig.maxConcurrentExecutions,

      role: this.getServiceRole(),
    });

    // A fixed construct id: grantInvoke derives one from the principal, and the imported api id
    // token renders differently on every synth, which would replace the permission on every deploy.
    func.lambdaFunction.addPermission('api-gateway-invoke', {
      principal: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: `arn:aws:execute-api:${region}:${awsAccountId}:${apiId}/*`,
    });

    const integration = new aws_apigatewayv2.CfnIntegration(this, 'websocket-integration', {
      apiId,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${func.lambdaFunction.functionArn}/invocations`,
    });

    const connectRoute = new aws_apigatewayv2.CfnRoute(this, 'connect-route', {
      apiId,
      routeKey: '$connect',
      target: `integrations/${integration.ref}`,
      apiKeyRequired: false,
      authorizationType: 'NONE',
      operationName: 'connect',
    });

    const disconnectRoute = new aws_apigatewayv2.CfnRoute(this, 'disconnect-route', {
      apiId,
      routeKey: '$disconnect',
      target: `integrations/${integration.ref}`,
      apiKeyRequired: false,
      authorizationType: 'NONE',
      operationName: 'disconnect',
    });

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
