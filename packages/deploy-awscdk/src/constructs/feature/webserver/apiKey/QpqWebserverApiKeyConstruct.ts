import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { ApiKeyQPQWebServerConfigSetting, qpqWebServerUtils } from 'quidproquo-webserver';

import { aws_apigateway, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqWebserverApiKeyConstructProps extends QpqConstructBlockProps {
  apiKeyConfig: ApiKeyQPQWebServerConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

export class QpqWebserverApiKeyConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverApiKeyConstructProps) {
    super(scope, id, props);

    const apiKeyConfig = props.apiKeyConfig.apiKey;

    const apiKey = new aws_apigateway.ApiKey(this, apiKeyConfig.name, {
      description: apiKeyConfig.description,
      apiKeyName: this.resourceName(apiKeyConfig.name),
      value: apiKeyConfig.value,
      enabled: true,
    });

    // The service-role's apigateway:GET grant is tag-conditioned - keys must carry the qpq tags
    qpqDeployAwsCdkUtils.applyEnvironmentTags(apiKey, props.qpqConfig);

    qpqDeployAwsCdkUtils.exportStackValue(this, awsNamingUtils.getCFExportNameApiKeyIdFromConfig(apiKeyConfig.name, props.qpqConfig), apiKey.keyId);
  }
}
