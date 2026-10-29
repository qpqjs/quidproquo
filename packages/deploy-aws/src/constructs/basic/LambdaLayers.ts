import { getLogExtensionLayerPath } from '@qpqjs/actionprocessor-aws';
import { awsNamingUtils } from '@qpqjs/config-aws';
import { ApiLayer, getAwsServiceAccountInfoConfig } from '@qpqjs/config-aws';
import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';

import { getLambdaRuntime } from '../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';

const getLambdaLayersWithFullPaths = (qpqConfig: QPQConfig): ApiLayer[] => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);

  return awsServiceAccountInfoConfig.apiLayers.map((layer: ApiLayer) => ({
    name: layer.name,
    // resolve, not join: a layer produced by tooling (see getUserScriptBuilderApiLayer) names an
    // absolute directory, which must pass through untouched.
    buildPath: layer.buildPath ? path.resolve(qpqCoreUtils.getConfigRoot(qpqConfig), layer.buildPath) : undefined,
    layerArn: layer.layerArn,
  }));
};

export type LambdaLayersProps = {} & QpqConstructBlockProps;

export class LambdaLayers extends QpqConstructBlock {
  public readonly layers: aws_lambda.ILayerVersion[];

  constructor(scope: Construct, id: string, props: LambdaLayersProps) {
    super(scope, id, props);

    const apiLayers = getLambdaLayersWithFullPaths(props.qpqConfig);
    const lambdaRuntime = getLambdaRuntime(props.qpqConfig);

    const userLayers = apiLayers.map((layer) => {
      return layer.buildPath
        ? new aws_lambda.LayerVersion(this, `${layer.name}-layer`, {
            layerVersionName: awsNamingUtils.getQpqRuntimeResourceNameFromConfig(layer.name, props.qpqConfig),
            code: new aws_lambda.AssetCode(layer.buildPath),
            compatibleRuntimes: [lambdaRuntime],
          })
        : aws_lambda.LayerVersion.fromLayerVersionArn(this, `${layer.name}-layer-ref`, layer.layerArn!);
    });

    // Always-on: the qpq-log-extension ships story logs to S3 off the function's
    // response path. Every construct that builds a Function must pass these layers
    // through as apiLayerVersions; bundles externalise layer modules on that assumption.
    const logExtensionLayer = new aws_lambda.LayerVersion(this, 'qpq-log-extension-layer', {
      layerVersionName: awsNamingUtils.getQpqRuntimeResourceNameFromConfig('qpq-log-extension', props.qpqConfig),
      code: new aws_lambda.AssetCode(getLogExtensionLayerPath()),
      compatibleRuntimes: [lambdaRuntime],
    });

    this.layers = [...userLayers, logExtensionLayer];
  }
}
