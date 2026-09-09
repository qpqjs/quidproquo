import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils, WebSocketQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { aws_apigateway, aws_apigatewayv2, aws_iam, aws_lambda, aws_ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { exportStackValue } from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqServiceRole } from '../../../base/QpqServiceRole';

export interface QpqWebserverWebsocketConstructProps extends QpqConstructBlockProps {
  websocketConfig: WebSocketQPQWebServerConfigSetting;
}

export class QpqWebserverWebsocketConstruct extends QpqConstructBlock {
  public api: aws_apigatewayv2.CfnApi;

  constructor(scope: Construct, id: string, props: QpqWebserverWebsocketConstructProps) {
    super(scope, id, props);

    this.api = new aws_apigatewayv2.CfnApi(this, 'websocket-api', {
      name: this.resourceName(props.websocketConfig.apiName),
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.type',
    });

    exportStackValue(this, awsNamingUtils.getCFExportNameWebsocketApiIdFromConfig(props.websocketConfig.apiName, props.qpqConfig), this.api.ref);

    // Published so referencing services (which can't know the AWS-generated id at synth)
    // can resolve it at deploy time for their scoped ManageConnections grants
    new aws_ssm.StringParameter(this, 'websocket-api-id-param', {
      parameterName: awsNamingUtils.getWebsocketApiIdSsmParameterName(props.websocketConfig.apiName, props.qpqConfig),
      stringValue: this.api.ref,
    });
  }

  // Scope websocket pushes to this service's own websocket apis (exact api ids), mirroring
  // the per-pool Cognito grant pattern. No-op when the service owns no websockets.
  // Referenced-but-unowned websockets are granted separately in the api phase - see
  // authorizeManageConnectionsForReferencedWebsockets.
  public static authorizeManageConnectionsForRole(
    role: aws_iam.IRole,
    websocketConstructs: QpqWebserverWebsocketConstruct[],
    qpqConfig: QPQConfig,
  ): void {
    if (websocketConstructs.length > 0) {
      const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
      const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);

      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          sid: 'APIGatewayManageConnections',
          effect: aws_iam.Effect.ALLOW,
          actions: ['execute-api:ManageConnections'],
          resources: websocketConstructs.map((websocket) => `arn:aws:execute-api:${region}:${accountId}:${websocket.api.ref}/*`),
        }),
      );
    }
  }

  // Exact-ARN pushes to websocket apis this service references but does NOT own - e.g. a
  // shared websocket-queue owned by another module, where service-request responses push
  // straight from the responding service's lambda. The api ids are AWS-generated in the
  // owning services' inf stacks, and modules reference each other's websockets (admin <->
  // websocket-queue), so this grant cannot live in the inf phase (mutual SSM/role refs
  // deadlock fresh environments). It runs in the API phase instead: all inf stacks deploy
  // first (publishing their api-id SSM params), so the deploy-time SSM dynamic references
  // here always resolve. No-op when the config references no unowned websockets.
  public static authorizeManageConnectionsForReferencedWebsockets(scope: Construct, qpqConfig: QPQConfig): void {
    const ownedApiNames = new Set(qpqWebServerUtils.getOwnedWebsocketSettings(qpqConfig).map((setting) => setting.apiName));
    const unownedWebsocketSettings = qpqWebServerUtils.getWebsocketSettings(qpqConfig).filter((setting) => !ownedApiNames.has(setting.apiName));

    if (unownedWebsocketSettings.length === 0) {
      return;
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);

    QpqServiceRole.of(scope, qpqConfig).addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ['execute-api:ManageConnections'],
        resources: unownedWebsocketSettings.map((setting) => {
          const apiId = aws_ssm.StringParameter.valueForStringParameter(
            scope,
            awsNamingUtils.getWebsocketApiIdSsmParameterName(setting.apiName, qpqConfig),
          );

          return `arn:aws:execute-api:${region}:${accountId}:${apiId}/*`;
        }),
      }),
    );
  }
}
