import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig } from 'quidproquo-core';
import { CacheQPQWebServerConfigSetting, qpqHeaderIsBot } from 'quidproquo-webserver';

import { aws_cloudfront, aws_s3 } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqWebServerCacheConstructProps extends QpqConstructBlockProps {
  cacheConfig: CacheQPQWebServerConfigSetting;
}

export class QpqWebServerCacheConstruct extends QpqConstructBlock {
  cachePolicy: aws_cloudfront.ICachePolicy;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, cacheConfig: CacheQPQWebServerConfigSetting): QpqWebServerCacheConstruct {
    const cachePolicyId = qpqDeployAwsCdkUtils.importStackValue(
      awsNamingUtils.getCFExportNameCachePolicyIdFromConfig(cacheConfig.name, qpqConfig, cacheConfig.owner?.module, cacheConfig.owner?.application),
    );

    class Import extends QpqConstructBlock {
      cachePolicy = aws_cloudfront.CachePolicy.fromCachePolicyId(scope, `${id}-${cacheConfig.uniqueKey}`, cachePolicyId);
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqWebServerCacheConstructProps) {
    super(scope, id, props);

    this.cachePolicy = new aws_cloudfront.CachePolicy(this, `dist-cp`, {
      cachePolicyName: this.resourceName(props.cacheConfig.name),
      defaultTtl: cdk.Duration.seconds(props.cacheConfig.cache.defaultTTLInSeconds),
      minTtl: cdk.Duration.seconds(props.cacheConfig.cache.minTTLInSeconds),
      maxTtl: cdk.Duration.seconds(props.cacheConfig.cache.maxTTLInSeconds),

      headerBehavior: aws_cloudfront.CacheHeaderBehavior.allowList(
        qpqHeaderIsBot,
        'Origin',
        'Access-Control-Request-Headers',
        'Access-Control-Request-Method',
      ),

      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    qpqDeployAwsCdkUtils.exportStackValue(
      this,
      awsNamingUtils.getCFExportNameCachePolicyIdFromConfig(
        props.cacheConfig.name,
        props.qpqConfig,
        props.cacheConfig.owner?.module,
        props.cacheConfig.owner?.application,
      ),
      this.cachePolicy.cachePolicyId,
    );
  }
}
