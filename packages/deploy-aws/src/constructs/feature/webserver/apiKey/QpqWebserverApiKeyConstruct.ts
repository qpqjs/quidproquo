import { awsNamingUtils } from '@qpqjs/actionprocessor-aws';
import { ApiKeyQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { aws_apigateway, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export type QpqWebserverApiKeyConstructProps = {
  apiKeyConfig: ApiKeyQPQWebServerConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
} & QpqConstructBlockProps;

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
    qpqDeployAwsUtils.applyEnvironmentTags(apiKey, props.qpqConfig);

    qpqDeployAwsUtils.exportStackValue(this, awsNamingUtils.getCFExportNameApiKeyIdFromConfig(apiKeyConfig.name, props.qpqConfig), apiKey.keyId);
  }
}
